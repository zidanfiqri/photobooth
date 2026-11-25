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
      window.__share = null;
      Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async (d) => {
        const f = (d && d.files && d.files[0]) || null;
        window.__share = { n: (d.files || []).length, name: f && f.name, type: f && f.type, text: d.text || '' };
      } });
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
    ok('review: tombol “Tambah atribut” tampil', await page.isVisible('#btn-decor'));
    const dl1 = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await page.click('#btn-save');
    await page.waitForSelector('#scr-result.active');
    const d1 = await dl1;
    ok('otomatis tersimpan ke galeri perangkat (unduhan)', !!d1 && /^Photobooth-\d{8}-\d{6}-[0-9A-Z]{10}\.png$/.test(d1.suggestedFilename()), d1 && d1.suggestedFilename());
    ok('hasil: “Tersimpan di galeri”, tombol Cetak & Bagikan tampil', /Tersimpan di galeri/.test(await page.textContent('#result-saved')) && await page.isVisible('#btn-print') && await page.isVisible('#btn-share'));
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
    ok('batas cetak per sesi (pop-up)', (await page.evaluate(() => window.__prints)) === 1 && /Batas cetak/.test(await page.textContent('#dlg-title')) && await page.isVisible('#dialog'));
    await page.click('#dlg-actions button');

    // bagikan: share sheet (stub) lalu fallback QR/link
    await page.click('#btn-share');
    await page.waitForFunction(() => window.__share, null, { timeout: 3000 }).catch(() => {});
    const sh = await page.evaluate(() => window.__share);
    ok('Bagikan → share sheet menerima file foto + link', !!sh && sh.n === 1 && sh.type === 'image/png' && /^Photobooth-/.test(sh.name) && /\?s=/.test(sh.text), JSON.stringify(sh));
    await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false }));
    await page.click('#btn-share');
    await page.waitForSelector('#dialog:not([hidden])');
    ok('Bagikan (tanpa share sheet) → pop-up QR & salin link', /Bagikan foto/.test(await page.textContent('#dlg-title')) && await page.isVisible('#dlg-qr svg'));
    await page.click('#dlg-actions button:last-child');
    await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true }));

    // printer belum tersambung → pop-up
    await page.evaluate(() => Settings.set('printEnabled', false));
    await page.click('#btn-print');
    await page.waitForSelector('#dialog:not([hidden])');
    ok('printer mati → pop-up “Printer tidak tersambung”', /Printer tidak tersambung/.test(await page.textContent('#dlg-title')));
    await page.screenshot({ path: path.join(OUT, '05-printer-popup.png') });
    await page.click('#dlg-actions button');
    await page.evaluate(() => Settings.set('printEnabled', true));

    // halaman tamu di HP
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    const gp = await phone.newPage();
    gp.on('pageerror', (e) => errors.push('guest pageerror: ' + e.message));
    await gp.goto(guest);
    await gp.waitForFunction(() => !document.querySelector('#g-img').hidden && document.querySelector('#g-img').naturalWidth > 0, null, { timeout: 40000 }).catch(() => {});
    const g = await gp.evaluate(() => ({ msg: document.querySelector('#g-msg').textContent, title: document.querySelector('#g-title').textContent, img: document.querySelector('#g-img').naturalWidth }));
    ok('halaman tamu menampilkan foto', g.img > 0 && /siap/.test(g.msg) && g.title === 'Rina & Dimas', JSON.stringify(g));
    await gp.screenshot({ path: path.join(OUT, '03-guest.png'), fullPage: true });
    let gd = null;
    for (let i = 0; i < 3 && !gd; i++) { const p = gp.waitForEvent('download', { timeout: 5000 }).catch(() => null); await gp.click('#g-save'); gd = await p; }
    ok('tamu: “Simpan ke Galeri” mengunduh file asli', !!gd && /\.png$/.test(gd.suggestedFilename()) && await gp.isVisible('#g-share'), gd && gd.suggestedFilename());
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
    ok('tema default: Klasik → Elegan, Strip → Lucu, Kolase → Floral', await page.evaluate(() => BUILTIN.map(frameTheme).join() === 'elegan,lucu,floral'));
    await page.setInputFiles('#sticker-file', path.join(FIX, 'frame-alpha.png'));
    await page.waitForSelector('#sticker-list .stk-admin-item', { timeout: 8000 }).catch(() => {});
    ok('atribut kustom (PNG) tersimpan', (await page.$$('#sticker-list .stk-admin-item')).length === 1);
    await page.selectOption('#frame-list .frame-row:nth-child(1) [data-theme]', 'floral');
    ok('tema atribut per bingkai bisa diganti', await page.evaluate(() => frameTheme(BUILTIN[0]) === 'floral'));
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

    // halaman atribut (portrait 800×1280 ≈ Xiaomi Pad 5)
    await page.click('#btn-done');
    await page.click('#scr-attract');
    await page.click('#frame-grid .frame-card:nth-child(1)');
    await page.click('#btn-shoot');
    await page.waitForSelector('#scr-review.active', { timeout: 20000 });
    await page.click('#btn-decor');
    await page.waitForSelector('#scr-decor.active');
    await page.waitForFunction(() => { const im = [...document.querySelectorAll('#decor-tray img')]; return im.length > 0 && im.every((i) => i.complete && i.naturalWidth > 0); }, null, { timeout: 10000 }).catch(() => {});
    const tabs = await page.$$eval('#decor-tabs [data-pack]', (bs) => bs.map((b) => b.dataset.pack));
    ok('paket sesuai tema bingkai tampil pertama + tab Kustom', tabs[0] === 'floral' && tabs.includes('elegan') && tabs.includes('teks') && tabs.includes('kustom'), tabs.join(','));
    await page.click('#decor-tabs [data-pack="elegan"]');
    await page.click('#decor-tray [data-stk="heart_gold"]');
    await page.waitForSelector('#decor-layer .stk.sel');
    const c0 = await page.$eval('#decor-layer .stk.sel', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const x0 = await page.evaluate(() => Session.stickers[0].x);
    await page.mouse.move(c0.x, c0.y); await page.mouse.down(); await page.mouse.move(c0.x + 60, c0.y + 30, { steps: 6 }); await page.mouse.up();
    const x1 = await page.evaluate(() => Session.stickers[0].x);
    ok('atribut bisa digeser', x1 > x0 + 40, `${x0.toFixed(0)}→${x1.toFixed(0)}`);
    const h0 = await page.$eval('#decor-layer .stk.sel .stk-h', (el) => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    const w0 = await page.evaluate(() => Session.stickers[0].w);
    await page.mouse.move(h0.x, h0.y); await page.mouse.down(); await page.mouse.move(h0.x + 50, h0.y + 12, { steps: 6 }); await page.mouse.up();
    const t1 = await page.evaluate(() => ({ w: Session.stickers[0].w, rot: Session.stickers[0].rot }));
    ok('tarik ↻: ubah ukuran & putar', t1.w > w0 * 1.1 && Math.abs(t1.rot) > 0.05, JSON.stringify(t1));
    const pin = await page.evaluate(() => {
      const st = document.querySelector('#decor-stage'); let el = document.querySelector('#decor-layer .stk.sel');
      const r = el.getBoundingClientRect(), cx = r.x + r.width / 2, cy = r.y + r.height / 2, w0 = Session.stickers[Session.sel].w;
      const ev = (type, id, x, y, t) => (t || st).dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true, pointerType: 'touch' }));
      ev('pointerdown', 11, cx - 10, cy, el); el = document.querySelector('#decor-layer .stk.sel');
      ev('pointerdown', 12, cx + 10, cy, el); ev('pointermove', 12, cx + 40, cy); ev('pointerup', 12, cx + 40, cy); ev('pointerup', 11, cx - 10, cy);
      return { w0, w1: Session.stickers[Session.sel].w };
    });
    ok('cubit 2 jari memperbesar atribut', pin.w1 > pin.w0 * 1.5, JSON.stringify(pin));
    await page.click('#decor-tabs [data-pack="teks"]');
    await page.click('#decor-tray [data-stk="t_sah"]');
    ok('stiker teks ditambahkan', (await page.$$('#decor-layer .stk')).length === 2);
    await page.click('#decor-undo');
    ok('urungkan', (await page.$$('#decor-layer .stk')).length === 1);
    await page.click('#decor-tray [data-stk="t_married"]');
    await page.click('#decor-flip');
    ok('balik (flip) atribut', await page.evaluate(() => Session.stickers[Session.sel].flip === true));
    await page.click('#decor-tabs [data-pack="kustom"]');
    await page.click('#decor-tray [data-stk]');
    ok('atribut kustom bisa dipakai', (await page.$$('#decor-layer .stk')).length === 3);
    const lay = await page.evaluate(() => { const s = document.querySelector('#decor-stage').getBoundingClientRect(), b = document.querySelector('#decor-save').getBoundingClientRect(); return { stage: [Math.round(s.width), Math.round(s.height), Math.round(s.bottom)], save: Math.round(b.bottom), vh: innerHeight }; });
    ok('halaman atribut muat di layar (portrait)', lay.save <= lay.vh && lay.stage[2] <= lay.vh && lay.stage[0] > 300, JSON.stringify(lay));
    await page.evaluate(() => { Session.sel = -1; renderStickers(); });
    await page.screenshot({ path: path.join(OUT, '04-decor.png') });
    await page.click('#decor-back');
    await page.waitForSelector('#scr-review.active');
    ok('kembali ke review: atribut tetap ada', /Atribut \(3\)/.test(await page.textContent('#btn-decor')));
    const dl2 = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
    await page.click('#btn-save');
    await page.waitForSelector('#scr-result.active');
    await dl2;
    const diff = await page.evaluate(async () => {
      const rec = await DB.get('photos', Session.record.id); const base = Session.canvas;
      const bmp = await createImageBitmap(rec.blob); const a = makeCanvas(base.width, base.height); a.getContext('2d').drawImage(bmp, 0, 0);
      const A = a.getContext('2d').getImageData(0, 0, a.width, a.height).data, B = base.getContext('2d').getImageData(0, 0, base.width, base.height).data;
      let n = 0; for (let i = 0; i < A.length; i += 16) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 60) n++;
      return { n, stickers: rec.stickers, w: bmp.width, h: bmp.height };
    });
    ok('atribut tergambar di file akhir resolusi penuh', diff.n > 3000 && diff.stickers === 3 && diff.w === 1200 && diff.h === 1800, JSON.stringify(diff));
    await page.screenshot({ path: path.join(OUT, '06-result-decor.png') });

    // tanpa Drive → teks “galeri”, bukan “tablet”
    await page.evaluate(() => Settings.set('apiToken', ''));
    await page.click('#btn-done');
    await page.click('#scr-attract');
    await page.click('#frame-grid .frame-card:nth-child(2)');
    await page.click('#btn-shoot');
    await page.waitForSelector('#scr-review.active', { timeout: 20000 });
    await page.click('#btn-save');
    await page.waitForSelector('#scr-result.active');
    const loc = (await page.textContent('#result-status')) + ' | ' + (await page.textContent('#result-saved'));
    ok('tanpa Drive: “tersimpan di galeri”, tanpa kata “tablet”', /tersimpan di galeri/.test(loc) && !/tablet/i.test(loc) && await page.isHidden('#result-qr-card'), loc);
    await page.evaluate(() => Settings.set('apiToken', 'TEST-TOKEN'));
    const src = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    ok('tidak ada teks “disimpan/aman di tablet”', !/(disimpan|tersimpan|aman) di tablet|Galeri tablet|dari tablet/i.test(src));
    ok('URL Web App bawaan → link tamu pendek (?s= saja) & halaman tamu memakai URL bawaan', await page.evaluate(() => {
      const old = Settings.d.apiUrl; Settings.d.apiUrl = BAKED_API_URL; const u = guestUrl('ABCDE12345'); Settings.d.apiUrl = old;
      return /^https?:\/\/[^?]+\?s=ABCDE12345$/.test(u) && apiFromParams(new URLSearchParams('s=ABCDE12345')) === BAKED_API_URL && /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(BAKED_API_URL);
    }));

    // link setup sekali-ketuk
    const sctx = await browser.newContext({ permissions: ['camera'] });
    const sp = await sctx.newPage();
    sp.on('pageerror', (e) => errors.push('setup pageerror: ' + e.message));
    await sp.goto(BASE + '#setup=' + Buffer.from(JSON.stringify({ u: API, t: 'TEST-TOKEN' })).toString('base64url'));
    await sp.waitForFunction(() => /Tersambung/.test(document.querySelector('#toast').textContent), null, { timeout: 15000 }).catch(() => {});
    const su = await sp.evaluate(() => ({ u: Settings.d.apiUrl, t: Settings.d.apiToken === 'TEST-TOKEN', hash: location.hash, toast: document.querySelector('#toast').textContent }));
    ok('link #setup= → URL & token tersimpan, hash dihapus, ping ✓', su.u === API && su.t && su.hash === '' && /Tersambung/.test(su.toast), JSON.stringify(su));
    await sctx.close();

    // landscape
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.click('#btn-done');
    await page.click('#scr-attract');
    await page.click('#frame-grid .frame-card:nth-child(2)');
    await page.waitForTimeout(300);
    const st = await page.evaluate(() => ({ btn: document.querySelector('#btn-shoot').getBoundingClientRect().bottom, vh: innerHeight }));
    ok('layout landscape muat di layar', st.btn <= st.vh, JSON.stringify(st));
    await page.click('#btn-shoot');
    await page.waitForSelector('#scr-review.active', { timeout: 20000 });
    await page.click('#btn-decor');
    await page.waitForSelector('#scr-decor.active');
    await page.click('#decor-tabs [data-pack="lucu"]');
    await page.click('#decor-tray [data-stk="heart_glasses"]');
    await page.waitForTimeout(300);
    const ls = await page.evaluate(() => { const s = document.querySelector('#decor-stage').getBoundingClientRect(), b = document.querySelector('#decor-save').getBoundingClientRect(), t = document.querySelector('#decor-tray').getBoundingClientRect(); return { stage: [Math.round(s.left), Math.round(s.right), Math.round(s.bottom)], tray: Math.round(t.left), save: Math.round(b.bottom), vw: innerWidth, vh: innerHeight }; });
    ok('halaman atribut landscape: foto & panel berdampingan, muat', ls.stage[1] <= ls.tray && ls.save <= ls.vh && ls.stage[2] <= ls.vh, JSON.stringify(ls));
    await page.screenshot({ path: path.join(OUT, '07-decor-landscape.png') });
    await page.click('#decor-back');

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
