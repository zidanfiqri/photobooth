// Tes end-to-end: Chrome headless + kamera palsu + mock Apps Script.
// Jalankan: cd tests && npm i && npx playwright install chromium && npm run test:e2e
// Opsional: CHROME_PATH=/path/chrome  FAKE_VIDEO=/path/video.y4m (gambar kamera lebih realistis)
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const sharp = require('sharp');
const mock = require('./mock-api');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const FIX = path.join(__dirname, 'fixtures');
const APP_PORT = Number(process.env.APP_PORT || 8080);
const API_PORT = Number(process.env.API_PORT || 8090);
const BASE = `http://localhost:${APP_PORT}/`;
const API = `http://localhost:${API_PORT}/exec`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function staticServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = path.join(ROOT, path.normalize(p));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('404'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    srv.listen(APP_PORT, () => resolve(srv));
  });
}

const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const app = await staticServer();
  const api = await mock.start(API_PORT);
  const chromePath = process.env.CHROME_PATH || (fs.existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined);
  const args = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'];
  if (process.env.FAKE_VIDEO) args.push('--use-file-for-fake-video-capture=' + process.env.FAKE_VIDEO);
  const browser = await chromium.launch({ executablePath: chromePath, args });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 1280 }, permissions: ['camera'] });
    await ctx.addInitScript(({ API }) => {
      if (!localStorage.getItem('pb.settings')) {
        localStorage.setItem('pb.settings', JSON.stringify({ apiUrl: API, apiToken: 'TEST-TOKEN', countdown: 1, betweenShots: 0.3, printEnabled: true,
          autoFullscreen: false, eventTitle: 'Rina & Dimas', eventDate: '20 · 07 · 2027' }));
      }
      window.__prints = 0; window.print = () => { window.__prints++; };
    }, { API });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    const waitText = (sel, re, t = 15000) => page.waitForFunction(([s, r]) => new RegExp(r).test(document.querySelector(s).textContent), [sel, re.source], { timeout: t }).catch(() => {});

    await page.goto(BASE);
    await page.waitForFunction(() => window.Cam && Cam.ready, null, { timeout: 15000 }).catch(() => {});
    ok('kamera menyala (fake device)', await page.evaluate(() => Cam.ready));
    ok('teks layar awal terisi', (await page.textContent('#a-title')) === 'Rina & Dimas');
    await page.screenshot({ path: path.join(OUT, '01-attract.png') });

    // sesi photo strip (3 foto)
    await page.click('#scr-attract');
    await page.waitForSelector('#scr-frames.active');
    await page.waitForFunction(() => [...document.querySelectorAll('#frame-grid img')].every((i) => i.complete && i.naturalWidth > 0));
    await page.waitForTimeout(500);
    ok('3 bingkai bawaan tampil', (await page.$$('#frame-grid .frame-card')).length === 3);
    ok('thumbnail tidak keluar kartu', !(await page.evaluate(() => [...document.querySelectorAll('.frame-card')].some((c) => { const r = c.getBoundingClientRect(), i = c.querySelector('img').getBoundingClientRect(); return i.bottom > r.bottom || i.top < r.top; }))));
    await page.click('#frame-grid .frame-card:nth-child(2)');
    await page.click('#btn-shoot');
    await page.waitForSelector('#scr-review.active', { timeout: 20000 });
    await page.click('#btn-save');
    await page.waitForSelector('#scr-result.active');
    await waitText('#result-status', /Drive ✓/);
    ok('upload sampai Drive (mock)', /Drive ✓/.test(await page.textContent('#result-status')));
    await page.screenshot({ path: path.join(OUT, '02-result.png') });
    const guest = await page.getAttribute('#result-qr', 'title');
    ok('QR berisi link tamu', /\?s=[0-9A-Z]{10}&a=/.test(guest || ''), guest);
    ok('POST text/plain tanpa preflight CORS', api.state.log.some((l) => l.startsWith('POST content-type=text/plain')) && !api.state.log.some((l) => l.startsWith('PREFLIGHT')));
    const strip = fs.readdirSync(api.outDir).find((f) => f.includes('_Photo Strip.'));
    const meta = strip ? await sharp(path.join(api.outDir, strip)).metadata() : {};
    ok('output strip PNG 600×1800', meta.format === 'png' && meta.width === 600 && meta.height === 1800, `${meta.format} ${meta.width}x${meta.height}`);

    // cetak
    await page.click('#btn-print');
    await page.waitForFunction(() => window.__prints > 0, null, { timeout: 5000 }).catch(() => {});
    const pr = await page.evaluate(() => ({ n: window.__prints, css: document.querySelector('#page-style').textContent, w: document.querySelector('#print-img').naturalWidth, h: document.querySelector('#print-img').naturalHeight }));
    ok('cetak: dialog + kanvas postcard 300 dpi', pr.n === 1 && /100mm 148mm/.test(pr.css) && pr.w === 1181 && pr.h === 1748, JSON.stringify(pr));
    await page.click('#btn-print'); await page.waitForTimeout(400);
    ok('batas cetak per sesi', (await page.evaluate(() => window.__prints)) === 1);

    // halaman tamu di HP
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const gp = await phone.newPage();
    gp.on('pageerror', (e) => errors.push('guest pageerror: ' + e.message));
    await gp.goto(guest);
    await gp.waitForFunction(() => !document.querySelector('#g-img').hidden && document.querySelector('#g-img').naturalWidth > 0, null, { timeout: 40000 }).catch(() => {});
    const g = await gp.evaluate(() => ({ msg: document.querySelector('#g-msg').textContent, title: document.querySelector('#g-title').textContent, img: document.querySelector('#g-img').naturalWidth }));
    ok('halaman tamu menampilkan foto', g.img > 0 && /siap/.test(g.msg) && g.title === 'Rina & Dimas', JSON.stringify(g));
    await gp.screenshot({ path: path.join(OUT, '03-guest.png'), fullPage: true });
    await phone.close();

    // API mati → antre → pulih
    await page.click('#btn-done');
    api.state.down = true;
    await page.click('#scr-attract');
    await page.click('#frame-grid .frame-card:nth-child(1)');
    await page.click('#btn-shoot');
    await page.waitForSelector('#scr-review.active', { timeout: 20000 });
    await page.click('#btn-save');
    await waitText('#result-status', /tertunda/, 20000);
    ok('API mati → foto aman, status tertunda', /tertunda/.test(await page.textContent('#result-status')));
    api.state.down = false;
    await page.evaluate(() => retryAll());
    await waitText('#result-status', /Drive ✓/);
    ok('antrean terkirim setelah API pulih', /Drive ✓/.test(await page.textContent('#result-status')));

    // admin + PIN
    await page.click('#btn-done');
    for (let i = 0; i < 5; i++) await page.click('#hotspot');
    for (const k of '9999') await page.click(`#keypad [data-k="${k}"]`);
    await page.waitForTimeout(300);
    ok('PIN salah ditolak', await page.isHidden('#admin'));
    for (const k of '1234') await page.click(`#keypad [data-k="${k}"]`);
    await page.waitForSelector('#admin:not([hidden])');
    ok('PIN 1234 membuka admin', true);
    await page.click('#admin-nav [data-tab="cloud"]');
    await page.click('#api-test');
    await waitText('#api-result', /Terhubung/, 8000);
    ok('Tes koneksi berhasil', /Terhubung/.test(await page.textContent('#api-result')));

    // bingkai kustom
    await page.click('#admin-nav [data-tab="frames"]');
    await page.setInputFiles('#frame-file', path.join(FIX, 'frame-green.png'));
    await page.waitForSelector('#new-frame-save', { timeout: 10000 }).catch(() => {});
    ok('bingkai kotak hijau: 2 kotak terdeteksi', /2 kotak foto/.test(await page.textContent('#frame-import')));
    await page.click('#new-frame-save'); await page.waitForTimeout(400);
    await page.setInputFiles('#frame-file', path.join(FIX, 'frame-alpha.png'));
    await page.waitForSelector('#new-frame-save', { timeout: 10000 }).catch(() => {});
    ok('bingkai PNG transparan: 3 kotak terdeteksi', /3 kotak foto/.test(await page.textContent('#frame-import')));
    await page.click('#new-frame-save'); await page.waitForTimeout(400);
    ok('2 bingkai kustom tersimpan', (await page.$$('#frame-list .frame-row')).length === 5);
    await page.click('#admin-nav [data-tab="system"]');
    await page.waitForTimeout(300);
    ok('Admin › Sistem menampilkan log', (await page.textContent('#err-log')).length > 0);
    await page.click('[data-action="admin-close"]');

    // sesi dengan bingkai kotak hijau → cek keying
    await page.click('#scr-attract');
    const cards = await page.$$('#frame-grid .frame-card');
    await cards[3].click();
    await page.click('#btn-shoot');
    await page.waitForSelector('#scr-review.active', { timeout: 20000 });
    const prev = await page.textContent('#result-code');
    await page.click('#btn-save');
    await page.waitForFunction((pc) => document.querySelector('#scr-result.active') && document.querySelector('#result-code').textContent !== pc
      && /Drive ✓/.test(document.querySelector('#result-status').textContent), prev, { timeout: 15000 }).catch(() => {});
    const cf = fs.readdirSync(api.outDir).find((f) => f.includes('frame-green'));
    if (cf) {
      const { data, info } = await sharp(path.join(api.outDir, cf)).raw().toBuffer({ resolveWithObject: true });
      const px = (x, y) => { const i = (y * info.width + x) * info.channels; return [data[i], data[i + 1], data[i + 2]]; };
      let green = 0; for (let y = 100; y < 1560; y += 9) for (let x = 100; x < 1100; x += 9) { const [r, gg, b] = px(x, y); if (gg > 200 && r < 80 && b < 80) green++; }
      ok('kotak hijau terganti foto (0 piksel hijau tersisa)', green === 0, 'hijau=' + green);
      const leaf = px(1080, 1650);
      ok('daun hijau dekorasi tetap utuh', leaf[1] > 120 && leaf[1] > leaf[0] + 40, 'px=' + leaf);
    } else ok('output bingkai kustom ada', false);

    // landscape
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.click('#btn-done');
    await page.click('#scr-attract');
    await page.click('#frame-grid .frame-card:nth-child(2)');
    await page.waitForTimeout(300);
    const st = await page.evaluate(() => ({ btn: document.querySelector('#btn-shoot').getBoundingClientRect().bottom, vh: innerHeight }));
    ok('layout landscape muat di layar', st.btn <= st.vh, JSON.stringify(st));

    // file hilang → pesan diagnosa (bukan layar kosong)
    const bare = await browser.newContext();
    const bp = await bare.newPage();
    await bp.route('**/app.js', (r) => r.fulfill({ status: 404, body: '' }));
    await bp.goto(BASE); await bp.waitForTimeout(3300);
    ok('app.js hilang → panel diagnosa tampil', await bp.isVisible('#boot-error'));
    await bare.close();
  } catch (e) {
    ok('tes berjalan tanpa crash', false, e.message);
  } finally {
    const unexpected = errors.filter((e) => !/ERR_CONNECTION_RESET|ERR_EMPTY_RESPONSE|ERR_FILE_NOT_FOUND/.test(e));
    ok('tidak ada error JS tak terduga', unexpected.length === 0, unexpected.slice(0, 5).join(' | '));
    await browser.close(); app.close(); api.server.close();
    console.log(results.join('\n'));
    const fails = results.filter((r) => r.startsWith('FAIL')).length;
    console.log(`\n${results.length - fails}/${results.length} lolos`);
    process.exit(fails ? 1 : 0);
  }
})();
