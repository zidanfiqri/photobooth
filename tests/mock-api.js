// Mock Google Apps Script web app untuk tes lokal (kontrak JSON sama dengan apps-script/Code.gs).
// Pakai: node tests/mock-api.js [port]   → http://localhost:8090/exec   (token: TEST-TOKEN)
const http = require('http');
const fs = require('fs');
const path = require('path');

function start(port = 8090, outDir = path.join(__dirname, 'out', 'mock-drive')) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const state = { down: false, files: new Map(), log: [] };
  const send = (res, code, obj) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(obj));
  };
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    if (u.pathname === '/__ctl') {
      if (u.searchParams.has('down')) state.down = u.searchParams.get('down') === '1';
      return send(res, 200, { down: state.down, files: [...state.files.keys()], log: state.log });
    }
    if (req.method === 'OPTIONS') { state.log.push('PREFLIGHT ' + req.headers['access-control-request-headers']); res.writeHead(204, { 'Access-Control-Allow-Origin': '*' }); return res.end(); }
    if (u.pathname !== '/exec') return send(res, 404, { ok: false });
    if (state.down) { req.destroy(); return; } // simulasi internet / API mati
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        state.log.push('POST content-type=' + req.headers['content-type'] + ' bytes=' + body.length);
        let b; try { b = JSON.parse(body); } catch (e) { return send(res, 200, { ok: false, error: 'bad_json' }); }
        if (b.token !== 'TEST-TOKEN') return send(res, 200, { ok: false, error: 'unauthorized' });
        if (b.action === 'ping') {
          return send(res, 200, { ok: true, version: 'mock', rootUrl: 'https://drive.google.com/drive/folders/ROOT', eventUrl: 'https://drive.google.com/drive/folders/EVENT', eventPublic: true });
        }
        if (b.action === 'upload') {
          if (state.files.has(b.id)) return send(res, 200, { ok: true, status: 'ready', duplicate: true, ...state.files.get(b.id) });
          const name = `${b.id}_${b.stamp}_${b.frame}.${b.mime === 'image/jpeg' ? 'jpg' : 'png'}`;
          const p = path.join(outDir, name);
          fs.writeFileSync(p, Buffer.from(b.data, 'base64'));
          const info = { fileId: 'mockfile_' + b.id, name, mime: b.mime, eventTitle: b.eventTitle, folder: b.folder, path: p };
          state.files.set(b.id, info);
          state.log.push(`UPLOAD ${name} folder="${b.folder}"`);
          return setTimeout(() => send(res, 200, { ok: true, status: 'ready', ...info }), 300);
        }
        return send(res, 200, { ok: false, error: 'unknown_action' });
      });
      return;
    }
    const s = (u.searchParams.get('s') || '').toUpperCase();
    const action = u.searchParams.get('action') || 'get';
    const f = state.files.get(s);
    if (!f) return send(res, 200, { ok: true, status: 'pending' });
    if (action === 'img') return send(res, 200, { ok: true, status: 'ready', name: f.name, mime: f.mime, data: fs.readFileSync(f.path).toString('base64') });
    return send(res, 200, { ok: true, status: 'ready', fileId: f.fileId, name: f.name, mime: f.mime, eventTitle: f.eventTitle });
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, state, outDir })));
}

module.exports = { start };
if (require.main === module) {
  const port = Number(process.argv[2] || 8090);
  start(port).then(() => console.log(`mock Apps Script: http://localhost:${port}/exec  (token TEST-TOKEN)`));
}
