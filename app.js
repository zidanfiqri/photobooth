/* =====================================================================
   PHOTOBOOTH v1.0 — kiosk tamu, panel admin, halaman download tamu
   Vanilla JS, tanpa build step. Hosting: file statis + HTTPS.
   ===================================================================== */
'use strict';
window.PB_BOOTED = true; // dibaca watchdog di index.html

const VERSION = '1.0.1';

/* ---- log error: tampil di Admin › Sistem (tablet tidak punya devtools) ---- */
const ErrLog = [];
function logErr(msg) {
  ErrLog.unshift(`${new Date().toLocaleTimeString('id-ID')}  ${String(msg).slice(0, 300)}`);
  if (ErrLog.length > 30) ErrLog.length = 30;
}
addEventListener('error', (e) => logErr((e.message || 'error') + (e.filename ? ` @${e.filename.split('/').pop()}:${e.lineno}` : '')));
addEventListener('unhandledrejection', (e) => logErr('promise: ' + ((e.reason && (e.reason.message || e.reason)) || 'unknown')));
// Opsional: isi URL Web App Apps Script (…/exec) sebelum deploy → link QR lebih pendek
// dan tablet baru langsung terhubung. Boleh dikosongkan (atur dari panel admin).
const BAKED_API_URL = '';

/* ---------------------------------------------------------------- utils */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ID_ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // tanpa I, L, O, U
const ID_RE = /^[0-9A-Z]{8,16}$/;

function uid(n = 10) {
  const b = crypto.getRandomValues(new Uint8Array(n));
  let s = '';
  for (const x of b) s += ID_ALPHA[x & 31];
  return s;
}
const pad = (n) => String(n).padStart(2, '0');
function stamp(d = new Date()) {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}
function fmtDT(ts) { const d = new Date(ts); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtBytes(n) {
  if (n == null || isNaN(n)) return '-';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(0) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(2) + ' GB';
}
const fmtCode = (id) => String(id || '').replace(/^(.{5})(.+)$/, '$1-$2');
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(',')[1] || '');
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(blob);
  });
}
function b64ToBlob(b64, mime) {
  const bin = atob(b64); const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Blob([u8], { type: mime });
}
function canvasToBlob(c, type = 'image/png', q) {
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Gagal membuat gambar'))), type, q));
}
function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Gagal memuat gambar')); i.src = src; });
}
function withTimeout(p, ms, msg = 'Timeout') {
  let t;
  return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error(msg)), ms); })]).finally(() => clearTimeout(t));
}
function downloadBlob(blob, name) {
  const a = document.createElement('a'); const u = URL.createObjectURL(blob);
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 60000);
}
let toastTimer;
function toast(msg, ms = 2800) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function srcSize(src) { return { w: src.videoWidth || src.naturalWidth || src.width || 0, h: src.videoHeight || src.naturalHeight || src.height || 0 }; }
function scaleCanvas(src, maxH) {
  const { w, h } = srcSize(src); const r = Math.min(1, maxH / h);
  const c = makeCanvas(Math.max(1, Math.round(w * r)), Math.max(1, Math.round(h * r)));
  const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}
/** Tombol dua-ketuk (tanpa dialog confirm bawaan browser). */
function confirmTap(btn, fn, label = 'Yakin? ketuk lagi') {
  let armed = false; let t;
  const orig = btn.textContent;
  btn.onclick = async () => {
    if (!armed) { armed = true; btn.textContent = label; t = setTimeout(() => { armed = false; btn.textContent = orig; }, 3000); return; }
    clearTimeout(t); armed = false; btn.textContent = orig; await fn();
  };
}
function hexA(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return `rgba(176,141,87,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ------------------------------------------------------------- settings */
const DEFAULTS = {
  eventSubtitle: 'The Wedding of', eventTitle: 'Nama & Nama', eventDate: 'DD · MM · YYYY',
  footerText: 'Terima kasih atas doa & kehadirannya', ctaText: 'Sentuh untuk mulai', accent: '#b08d57', folderName: '',
  cameraId: '', camRes: '1920x1080', mirrorPreview: true, mirrorOutput: true, zoom: 1, useImageCapture: false, screenFlash: false,
  countdown: 3, betweenShots: 1.5, retakes: 1, idleReset: 60, sound: true, outFormat: 'png', jpegQuality: 0.92, autoFullscreen: true,
  disabledFrames: [], apiUrl: '', apiToken: '', guestBaseUrl: '', showGalleryQR: false, galleryUrl: '',
  printEnabled: false, autoPrint: false, maxPrints: 1, paper: 'postcard', pin: '1234',
};
const Settings = {
  d: {},
  load() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('pb.settings') || '{}') || {}; } catch (e) { saved = {}; }
    this.d = Object.assign({}, DEFAULTS, saved);
    if (!Array.isArray(this.d.disabledFrames)) this.d.disabledFrames = [];
    if (!this.d.apiUrl && BAKED_API_URL) this.d.apiUrl = BAKED_API_URL;
    return this.d;
  },
  save() { try { localStorage.setItem('pb.settings', JSON.stringify(this.d)); } catch (e) { console.warn(e); } },
  set(k, v) { this.d[k] = v; this.save(); },
};
const S = () => Settings.d;
const folderName = () => (S().folderName || `${S().eventTitle} — ${S().eventDate}`).trim();

/* ------------------------------------------------------------ IndexedDB */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('photobooth', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('frames')) db.createObjectStore('frames', { keyPath: 'id' });
      };
      r.onsuccess = () => { this.db = r.result; res(this.db); };
      r.onerror = () => rej(r.error);
    });
  },
  store(name, mode = 'readonly') { return this.db.transaction(name, mode).objectStore(name); },
  wrap(req) { return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); }); },
  put(name, v) { return this.wrap(this.store(name, 'readwrite').put(v)); },
  get(name, k) { return this.wrap(this.store(name).get(k)); },
  del(name, k) { return this.wrap(this.store(name, 'readwrite').delete(k)); },
  async all(name) { if (!this.db) return []; return this.wrap(this.store(name).getAll()); },
  /** baca-ubah-tulis dalam satu transaksi (hindari menimpa status terbaru) */
  patch(name, k, fn) {
    return new Promise((res, rej) => {
      const st = this.store(name, 'readwrite'); const g = st.get(k);
      g.onsuccess = () => { const v = g.result; if (!v) { res(null); return; } fn(v); const p = st.put(v); p.onsuccess = () => res(v); p.onerror = () => rej(p.error); };
      g.onerror = () => rej(g.error);
    });
  },
};

/* ---------------------------------------------------------------- sound */
const Sound = {
  ctx: null,
  unlock() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  },
  beep(freq = 880, dur = 0.12, vol = 0.16) {
    if (!S().sound || !this.ctx) return;
    const t = this.ctx.currentTime; const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination); o.start(t); o.stop(t + dur + 0.02);
  },
  shutter() {
    if (!S().sound || !this.ctx) return;
    const len = Math.floor(this.ctx.sampleRate * 0.09); const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const ch = buf.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const src = this.ctx.createBufferSource(); const g = this.ctx.createGain(); g.gain.value = 0.35;
    src.buffer = buf; src.connect(g).connect(this.ctx.destination); src.start();
  },
};

/* --------------------------------------------------------------- camera */
const Cam = {
  stream: null, track: null, ic: null, ready: false, error: null, starting: null,
  start() {
    if (this.starting) return this.starting;
    this.starting = this._start().finally(() => { this.starting = null; });
    return this.starting;
  },
  async _start() {
    this.stop();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { this.fail(new Error('Browser tidak mendukung kamera (wajib HTTPS)')); return; }
    const [w, h] = String(S().camRes || '1920x1080').split('x').map(Number);
    const base = { width: { ideal: w }, height: { ideal: h }, frameRate: { ideal: 30 } };
    const tries = [];
    if (S().cameraId) tries.push({ ...base, deviceId: { exact: S().cameraId } });
    tries.push({ ...base, facingMode: 'user' }, base, true);
    let lastErr = null;
    for (const video of tries) {
      try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video }); break; }
      catch (e) { lastErr = e; if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) break; }
    }
    if (!this.stream) { this.fail(lastErr); return; }
    this.track = this.stream.getVideoTracks()[0];
    const st = (this.track.getSettings && this.track.getSettings()) || {};
    if (S().cameraId && st.deviceId && st.deviceId !== S().cameraId) toast('Kamera pilihan tidak ditemukan — memakai kamera default', 4000);
    this.track.addEventListener('ended', () => { this.ready = false; updateStatus(); setTimeout(() => this.start(), 1500); });
    this.ic = null;
    if ('ImageCapture' in window) { try { this.ic = new ImageCapture(this.track); } catch (e) { this.ic = null; } }
    for (const v of $$('video.cam')) { v.srcObject = this.stream; v.play().catch(() => {}); }
    this.ready = true; this.error = null; updateStatus(); applyCamStyle();
  },
  stop() {
    if (this.stream) this.stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* noop */ } });
    this.stream = null; this.track = null; this.ic = null; this.ready = false;
  },
  fail(e) {
    this.ready = false; this.error = e; console.error('Camera error', e); updateStatus();
    logErr('kamera: ' + ((e && (e.name + ' ' + (e.message || ''))) || e));
    const m = e && e.name === 'NotAllowedError'
      ? 'Izin kamera ditolak. Chrome › ikon gembok › Izin situs › Kamera: Izinkan.'
      : `Kamera tidak bisa dibuka: ${(e && (e.message || e.name)) || e}`;
    toast(m, 6000); camMsg(m);
  },
  ensure() {
    if (!this.track || this.track.readyState !== 'live') { this.start(); return; }
    for (const v of $$('video.cam')) if (v.paused) v.play().catch(() => {});
  },
  info() {
    const s = (this.track && this.track.getSettings && this.track.getSettings()) || {};
    return { label: (this.track && this.track.label) || '-', w: s.width, h: s.height, fps: s.frameRate ? Math.round(s.frameRate) : '-' };
  },
  async devices() { try { return (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput'); } catch (e) { return []; } },
};
function camMsg(text) { const el = $('#cam-msg'); if (!el) return; el.hidden = !text; el.textContent = text || ''; }
function applyCamStyle() {
  document.body.classList.toggle('mirror', !!S().mirrorPreview);
  document.documentElement.style.setProperty('--zoom', String(Number(S().zoom) || 1));
}

/* --------------------------------------------------------------- frames */
const INK = '#2f2924', INK2 = '#5a5047', PAPER = '#fbf8f2';
const SERIF = '"Cormorant Garamond", "Noto Serif", Georgia, serif';
const SCRIPT = '"Great Vibes", "Cormorant Garamond", cursive';
const font = (style, size, family) => `${style} ${Math.round(size)}px ${family}`;

function paperBg(ctx, w, h) {
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(w / 2, h * 0.42, Math.min(w, h) * 0.15, w / 2, h / 2, Math.max(w, h) * 0.8);
  g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, hexA(S().accent, 0.1));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
function doubleRule(ctx, inset, w, h, color, gap, lw) {
  ctx.save(); ctx.strokeStyle = color;
  ctx.lineWidth = lw; ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.lineWidth = Math.max(1, lw / 2); ctx.strokeRect(inset + gap, inset + gap, w - (inset + gap) * 2, h - (inset + gap) * 2);
  ctx.restore();
}
function ornament(ctx, cx, cy, width, color, d = 8) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = Math.max(1.5, d / 4);
  ctx.beginPath(); ctx.moveTo(cx - width / 2, cy); ctx.lineTo(cx - d * 2.4, cy); ctx.moveTo(cx + d * 2.4, cy); ctx.lineTo(cx + width / 2, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - d); ctx.lineTo(cx + d, cy); ctx.lineTo(cx, cy + d); ctx.lineTo(cx - d, cy); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - width / 2 - d * 0.8, cy, d * 0.35, 0, Math.PI * 2); ctx.arc(cx + width / 2 + d * 0.8, cy, d * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function spacedText(ctx, text, x, y, spacing) {
  if (!text) return;
  if ('letterSpacing' in ctx) { ctx.letterSpacing = spacing + 'px'; ctx.fillText(text, x + spacing / 2, y); ctx.letterSpacing = '0px'; }
  else ctx.fillText(text, x, y);
}
function fitFont(ctx, text, family, style, maxW, start, min) {
  let s = start;
  for (; s > min; s -= 2) { ctx.font = font(style, s, family); if (ctx.measureText(text).width <= maxW) break; }
  ctx.font = font(style, s, family); return s;
}
function textBlock(ctx, f, c) {
  const A = S().accent, W = f.w, maxW = W - c.pad * 2;
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  if (S().eventSubtitle) {
    ctx.fillStyle = A; fitFont(ctx, S().eventSubtitle.toUpperCase(), SERIF, '600', maxW * 0.8, c.subSize, 12);
    spacedText(ctx, S().eventSubtitle.toUpperCase(), W / 2, c.subY, c.subSize * 0.3);
  }
  ctx.fillStyle = INK; fitFont(ctx, S().eventTitle, SCRIPT, '400', maxW, c.nameSize, 24);
  ctx.fillText(S().eventTitle, W / 2, c.nameY);
  if (c.ornY) ornament(ctx, W / 2, c.ornY, c.ornW, A, c.ornD);
  if (S().eventDate) { ctx.fillStyle = INK2; ctx.font = font('500', c.dateSize, SERIF); spacedText(ctx, S().eventDate, W / 2, c.dateY, c.dateSize * 0.22); }
  if (S().footerText && c.footY) { ctx.fillStyle = A; fitFont(ctx, S().footerText, SERIF, 'italic 400', maxW, c.footSize, 12); ctx.fillText(S().footerText, W / 2, c.footY); }
  ctx.restore();
}
function photoBorder(ctx, s, off, color, lw) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.strokeRect(s.x - off, s.y - off, s.w + off * 2, s.h + off * 2); ctx.restore(); }

const BUILTIN = [
  {
    id: 'classic', name: 'Klasik', w: 1200, h: 1800,
    slots: [{ x: 100, y: 100, w: 1000, h: 1250 }],
    bg(ctx, f) { paperBg(ctx, f.w, f.h); },
    fg(ctx, f) {
      const A = S().accent; doubleRule(ctx, 30, f.w, f.h, A, 10, 2.5); photoBorder(ctx, f.slots[0], 14, A, 2);
      textBlock(ctx, f, { pad: 110, subY: 1462, subSize: 34, nameY: 1600, nameSize: 132, ornY: 1650, ornW: 420, ornD: 8, dateY: 1716, dateSize: 40 });
    },
  },
  {
    id: 'strip3', name: 'Photo Strip', w: 600, h: 1800,
    slots: [40, 450, 860].map((y) => ({ x: 40, y, w: 520, h: 390 })),
    bg(ctx, f) { paperBg(ctx, f.w, f.h); },
    fg(ctx, f) {
      const A = S().accent; doubleRule(ctx, 14, f.w, f.h, A, 7, 2);
      textBlock(ctx, f, { pad: 46, subY: 1352, subSize: 22, nameY: 1462, nameSize: 92, ornY: 1508, ornW: 250, ornD: 6, dateY: 1572, dateSize: 28, footY: 1690, footSize: 24 });
    },
  },
  {
    id: 'grid4', name: 'Kolase', w: 1200, h: 1800,
    slots: [[70, 70], [612, 70], [70, 785], [612, 785]].map(([x, y]) => ({ x, y, w: 518, h: 691 })),
    bg(ctx, f) { paperBg(ctx, f.w, f.h); },
    fg(ctx, f) {
      const A = S().accent; doubleRule(ctx, 30, f.w, f.h, A, 10, 2.5);
      textBlock(ctx, f, { pad: 110, subY: 1550, subSize: 28, nameY: 1664, nameSize: 112, dateY: 1726, dateSize: 34 });
    },
  },
];
let CUSTOM = [];
async function loadCustomFrames() {
  try { CUSTOM = (await DB.all('frames')).sort((a, b) => a.created - b.created).map((f) => ({ ...f, custom: true })); }
  catch (e) { CUSTOM = []; }
}
const allFrames = () => [...BUILTIN, ...CUSTOM];
const enabledFrames = () => allFrames().filter((f) => !S().disabledFrames.includes(f.id));

/** gambar sumber ke dalam kotak (crop tengah / cover), opsional cermin & zoom */
function drawCover(ctx, src, slot, mirror, zoom = 1) {
  const { w: sw, h: sh } = srcSize(src); if (!sw || !sh) return;
  const ar = slot.w / slot.h; let cw = sw, ch = sh;
  if (sw / sh > ar) cw = sh * ar; else ch = sw / ar;
  cw /= zoom; ch /= zoom;
  const cx = (sw - cw) / 2, cy = (sh - ch) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(slot.x, slot.y, slot.w, slot.h); ctx.clip();
  if (mirror) { ctx.translate(slot.x + slot.w, slot.y); ctx.scale(-1, 1); ctx.drawImage(src, cx, cy, cw, ch, 0, 0, slot.w, slot.h); }
  else ctx.drawImage(src, cx, cy, cw, ch, slot.x, slot.y, slot.w, slot.h);
  ctx.restore();
}
function drawPlaceholder(ctx, s) {
  ctx.save(); ctx.beginPath(); ctx.rect(s.x, s.y, s.w, s.h); ctx.clip();
  const g = ctx.createLinearGradient(s.x, s.y, s.x, s.y + s.h); g.addColorStop(0, '#efe7db'); g.addColorStop(1, '#d9cbb6');
  ctx.fillStyle = g; ctx.fillRect(s.x, s.y, s.w, s.h);
  const r = Math.min(s.w, s.h) * 0.15, cx = s.x + s.w / 2, cy = s.y + s.h * 0.44;
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, s.y + s.h * 0.98, r * 2.3, r * 2.1, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.restore();
}
const overlayCache = new Map();
async function overlayBitmap(f) {
  if (overlayCache.has(f.id)) return overlayCache.get(f.id);
  const bmp = await createImageBitmap(f.overlay); overlayCache.set(f.id, bmp); return bmp;
}
async function renderFrame(f, shots, { zoom = 1, mirror = S().mirrorOutput, placeholder = false } = {}) {
  const c = makeCanvas(f.w, f.h); const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  if (f.custom) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, f.w, f.h); } else f.bg(ctx, f);
  f.slots.forEach((s, i) => {
    const shot = shots && shots[i];
    if (shot) drawCover(ctx, shot, s, mirror, zoom); else if (placeholder) drawPlaceholder(ctx, s);
  });
  if (f.custom) ctx.drawImage(await overlayBitmap(f), 0, 0, f.w, f.h); else f.fg(ctx, f);
  return c;
}
const thumbCache = new Map();
const themeKey = () => [S().eventSubtitle, S().eventTitle, S().eventDate, S().footerText, S().accent].join('|');
async function frameThumb(f) {
  const key = f.id + '|' + themeKey();
  if (thumbCache.has(key)) return thumbCache.get(key);
  const c = await renderFrame(f, null, { placeholder: true });
  const url = URL.createObjectURL(await canvasToBlob(scaleCanvas(c, 560), 'image/jpeg', 0.86));
  thumbCache.set(key, url); return url;
}
function invalidateThumbs() { for (const u of thumbCache.values()) URL.revokeObjectURL(u); thumbCache.clear(); }

/* ------ import bingkai kustom: PNG transparan ATAU kotak hijau #00FF00 ------ */
function components(mask, W, H, minArea) {
  const N = W * H; const labels = new Int32Array(N); const queue = new Int32Array(N);
  const kept = []; let next = 1;
  for (let start = 0; start < N; start++) {
    if (!mask[start] || labels[start]) continue;
    let head = 0, tail = 0; queue[tail++] = start; labels[start] = next;
    let x0 = W, y0 = H, x1 = 0, y1 = 0, area = 0;
    while (head < tail) {
      const i = queue[head++]; const x = i % W, y = (i / W) | 0; area++;
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && mask[i - 1] && !labels[i - 1]) { labels[i - 1] = next; queue[tail++] = i - 1; }
      if (x < W - 1 && mask[i + 1] && !labels[i + 1]) { labels[i + 1] = next; queue[tail++] = i + 1; }
      if (y > 0 && mask[i - W] && !labels[i - W]) { labels[i - W] = next; queue[tail++] = i - W; }
      if (y < H - 1 && mask[i + W] && !labels[i + W]) { labels[i + W] = next; queue[tail++] = i + W; }
    }
    if (area >= minArea && (x1 - x0) >= W * 0.06 && (y1 - y0) >= H * 0.04) kept.push({ label: next, x0, y0, x1, y1, area });
    next++;
  }
  return { labels, kept };
}
function sortSlots(slots, H) {
  const rows = [];
  for (const s of slots.slice().sort((a, b) => a.y - b.y)) {
    const row = rows.find((r) => Math.abs(r[0].y - s.y) < H * 0.06);
    if (row) row.push(s); else rows.push([s]);
  }
  return rows.flatMap((r) => r.sort((a, b) => a.x - b.x));
}
async function importFrame(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    const W = img.naturalWidth, H = img.naturalHeight, N = W * H;
    if (W < 300 || H < 300) throw new Error('Gambar terlalu kecil (minimal 300 px).');
    if (N > 16e6) throw new Error('Gambar terlalu besar (maks ±16 MP). Pakai 1200×1800 px.');
    const c = makeCanvas(W, H); const ctx = c.getContext('2d', { willReadFrequently: true }); ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, W, H); const px = data.data;
    const mask = new Uint8Array(N);
    let holes = 0;
    for (let i = 0, p = 3; i < N; i++, p += 4) if (px[p] < 128) { mask[i] = 1; holes++; }
    let mode = 'alpha';
    if (holes < N * 0.01) {
      mode = 'chroma'; holes = 0;
      for (let i = 0, p = 0; i < N; i++, p += 4) {
        const r = px[p], g = px[p + 1], b = px[p + 2];
        // hanya hijau "layar hijau" (#00FF00 ± kompresi) — hijau daun/dekorasi tidak ikut
        mask[i] = g >= 200 && r <= 100 && b <= 100 && g - Math.max(r, b) >= 120 ? 1 : 0; holes += mask[i];
      }
      if (holes < N * 0.01) throw new Error('Area foto tidak ditemukan. Pakai kotak hijau #00FF00 atau PNG dengan lubang transparan.');
    }
    const { labels, kept } = components(mask, W, H, Math.max(400, N * 0.004));
    if (!kept.length) throw new Error('Area foto tidak terdeteksi (terlalu kecil?).');
    if (kept.length > 8) throw new Error(`Terdeteksi ${kept.length} area — maksimal 8.`);
    if (mode === 'chroma') {
      const keep = new Set(kept.map((k) => k.label));
      for (let i = 0; i < N; i++) if (labels[i] && keep.has(labels[i])) px[i * 4 + 3] = 0;
      for (const k of kept) { // bersihkan pinggiran hijau (anti-alias) di sekitar kotak
        const x0 = Math.max(0, k.x0 - 4), x1 = Math.min(W - 1, k.x1 + 4), y0 = Math.max(0, k.y0 - 4), y1 = Math.min(H - 1, k.y1 + 4);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const p = (y * W + x) * 4; const r = px[p], g = px[p + 1], b = px[p + 2]; const ex = g - Math.max(r, b);
          if (ex > 30) { px[p + 3] = Math.min(px[p + 3], clamp(255 - ex * 3, 0, 255)); px[p + 1] = Math.max(r, b); }
        }
      }
      ctx.putImageData(data, 0, 0);
    }
    const g = Math.max(2, Math.round(Math.max(W, H) * 0.003));
    const slots = sortSlots(kept.map((k) => {
      const x = Math.max(0, k.x0 - g), y = Math.max(0, k.y0 - g);
      return { x, y, w: Math.min(W, k.x1 + 1 + g) - x, h: Math.min(H, k.y1 + 1 + g) - y };
    }), H);
    const overlay = await canvasToBlob(c, 'image/png');
    return { id: 'c_' + uid(6), name: (file.name || 'Bingkai').replace(/\.[^.]+$/, '').slice(0, 30), w: W, h: H, slots, overlay, mode, created: Date.now() };
  } finally { URL.revokeObjectURL(url); }
}

/* ---------------------------------------------------------- QR & links */
function renderQR(el, text) {
  try {
    const qr = qrcode(0, 'M'); qr.addData(text); qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true }); el.title = text;
  } catch (e) { console.error(e); el.textContent = 'QR gagal dibuat'; }
}
function guestUrl(id) {
  let base = (S().guestBaseUrl || '').trim() || (location.origin + location.pathname);
  base = base.replace(/index\.html?$/, '');
  const u = new URL(base); u.search = ''; u.hash = ''; u.searchParams.set('s', id);
  const api = (S().apiUrl || '').trim();
  if (api && api !== BAKED_API_URL) {
    const m = api.match(/^https:\/\/script\.google\.com\/macros\/s\/([\w-]+)\/exec\/?$/);
    if (m) u.searchParams.set('d', m[1]); else u.searchParams.set('a', api);
  }
  return u.toString();
}
function apiFromParams(p) {
  const d = p.get('d'); if (d && /^[\w-]{20,140}$/.test(d)) return `https://script.google.com/macros/s/${d}/exec`;
  const a = p.get('a'); if (a && /^(https:\/\/script\.google\.com\/|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/)/.test(a)) return a;
  return BAKED_API_URL || '';
}

/* ------------------------------------------------- API (Apps Script) */
async function apiPost(body, timeout = 30000) {
  const url = (S().apiUrl || '').trim();
  if (!url) throw new Error('URL Apps Script belum diisi');
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    // body string → Content-Type text/plain → tanpa preflight CORS (wajib untuk Apps Script)
    const r = await fetch(url, { method: 'POST', body: JSON.stringify({ ...body, token: S().apiToken }), signal: ctrl.signal, redirect: 'follow' });
    const text = await r.text();
    try { return JSON.parse(text); } catch (e) { throw new Error('Respon bukan JSON — cek deployment: Who has access = Anyone'); }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Timeout — koneksi lambat');
    if (e instanceof TypeError) throw new Error('Tidak bisa terhubung (cek URL / internet)');
    throw e;
  } finally { clearTimeout(t); }
}
async function apiGet(base, params, timeout = 25000) {
  const u = new URL(base); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeout);
  try { const r = await fetch(u.toString(), { signal: ctrl.signal, redirect: 'follow' }); return JSON.parse(await r.text()); }
  finally { clearTimeout(t); }
}

/* ------------------------------------------------- antrean upload */
const ACTIVE = ['pending', 'uploading', 'error', 'local'];
const Uploader = {
  busy: false, subs: new Set(),
  on(fn) { this.subs.add(fn); },
  emit(r) { for (const f of this.subs) { try { f(r); } catch (e) { console.warn(e); } } },
  start() {
    setInterval(() => this.kick(), 20000);
    addEventListener('online', () => { this.kick(); updateStatus(); });
    addEventListener('offline', () => updateStatus());
    this.kick();
  },
  async kick() {
    if (this.busy || !S().apiUrl || !DB.db || !navigator.onLine) return;
    this.busy = true;
    try {
      for (let guard = 0; guard < 1000; guard++) {
        const now = Date.now();
        const next = (await DB.all('photos')).filter((r) => ACTIVE.includes(r.status) && (r.nextTry || 0) <= now).sort((a, b) => a.created - b.created)[0];
        if (!next) break;
        await this.one(next);
      }
    } catch (e) { console.warn('uploader', e); }
    finally { this.busy = false; updateStatus(); }
  },
  async one(rec) {
    let r = await DB.patch('photos', rec.id, (x) => { x.status = 'uploading'; }); this.emit(r);
    try {
      const data = await blobToBase64(rec.blob);
      const res = await apiPost({ action: 'upload', id: rec.id, folder: rec.folder, eventTitle: rec.eventTitle, frame: rec.frameName || rec.frameId, stamp: rec.stamp, mime: rec.mime, data }, 180000);
      if (!res || !res.ok) throw new Error((res && res.error) || 'Upload gagal');
      r = await DB.patch('photos', rec.id, (x) => { x.status = 'done'; x.fileId = res.fileId || ''; x.error = ''; x.uploadedAt = Date.now(); });
    } catch (e) {
      const msg = String((e && e.message) || e);
      logErr(`upload ${rec.id}: ${msg}`);
      r = await DB.patch('photos', rec.id, (x) => {
        x.tries = (x.tries || 0) + 1; x.status = 'error'; x.error = msg;
        x.nextTry = Date.now() + (msg === 'unauthorized' ? 600000 : Math.min(300000, 8000 * 2 ** Math.min(x.tries - 1, 6)));
      });
    }
    this.emit(r);
  },
};
async function counts() {
  const all = await DB.all('photos').catch(() => []);
  const t0 = new Date(); t0.setHours(0, 0, 0, 0);
  const c = { total: all.length, done: 0, pending: 0, error: 0, local: 0, prints: 0, today: 0, bytes: 0, lastError: '' };
  for (const r of all) {
    if (r.status === 'done') c.done++; else if (r.status === 'error') { c.error++; c.lastError = r.error || c.lastError; }
    else if (r.status === 'local') c.local++; else c.pending++;
    c.prints += r.printed || 0; if (r.created >= +t0) c.today++; c.bytes += r.size || 0;
  }
  return c;
}
let statusTimer;
function updateStatus() {
  clearTimeout(statusTimer);
  statusTimer = setTimeout(async () => {
    $('#st-cam').className = 'dot ' + (Cam.ready ? 'ok' : 'bad');
    const c = await counts(); const q = c.pending + c.error + (S().apiUrl ? c.local : 0);
    const cl = $('#st-cloud');
    if (!S().apiUrl) cl.className = 'dot'; else if (!navigator.onLine || c.error) cl.className = 'dot bad'; else if (q) cl.className = 'dot warn'; else cl.className = 'dot ok';
    $('#st-queue').textContent = q ? `${q} antre` : '';
  }, 250);
}

/* ------------------------------------------------------------- print */
const PAPERS = { postcard: [100, 148], '4x6': [101.6, 152.4], a6: [105, 148], a4: [210, 297] };
function fitInto(ctx, img, x, y, w, h) {
  const { w: iw, h: ih } = srcSize(img); const ar = iw / ih, box = w / h; let dw, dh;
  const cover = Math.abs(ar - box) / box < 0.04; // beda rasio kecil → isi penuh (tanpa tepi putih)
  if ((ar > box) === cover) { dh = h; dw = h * ar; } else { dw = w; dh = w / ar; }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); ctx.restore();
}
async function printRecord(rec) {
  if (!rec) return;
  const max = Number(S().maxPrints) || 0;
  if (max && (rec.printed || 0) >= max) { toast('Batas cetak untuk foto ini sudah tercapai'); return; }
  try {
    const bmp = await createImageBitmap(rec.blob);
    const [pw, ph] = PAPERS[S().paper] || PAPERS.postcard;
    const W = Math.round((pw / 25.4) * 300), H = Math.round((ph / 25.4) * 300);
    const c = makeCanvas(W, H); const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingQuality = 'high';
    const ar = bmp.width / bmp.height;
    if (ar < 0.45) { // strip 2×6 → dua strip berdampingan, potong tengah
      fitInto(ctx, bmp, 0, 0, W / 2, H); fitInto(ctx, bmp, W / 2, 0, W / 2, H);
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.setLineDash([14, 14]); ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, 40); ctx.moveTo(W / 2, H - 40); ctx.lineTo(W / 2, H); ctx.stroke();
    } else if (ar > 1.05) { ctx.save(); ctx.translate(W, 0); ctx.rotate(Math.PI / 2); fitInto(ctx, bmp, 0, 0, H, W); ctx.restore(); }
    else fitInto(ctx, bmp, 0, 0, W, H);
    if (bmp.close) bmp.close();
    const url = URL.createObjectURL(await canvasToBlob(c, 'image/jpeg', 0.95));
    $('#page-style').textContent = `@media print{@page{size:${pw}mm ${ph}mm;margin:0}#print-img{width:${pw}mm;height:${ph}mm}}`;
    const img = $('#print-img');
    await new Promise((r) => { img.onload = r; img.onerror = r; img.src = url; });
    await sleep(80);
    await DB.patch('photos', rec.id, (x) => { x.printed = (x.printed || 0) + 1; });
    window.print();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  } catch (e) { console.error(e); toast('Gagal menyiapkan cetak: ' + (e.message || e)); }
}

/* ===================================================== KIOSK FLOW */
const UI = { screen: 'attract', idleTimer: null, resultTimer: null };
const Session = { frame: null, shots: [], retakesLeft: 0, id: '', token: null, running: false, canvas: null, zoom: 1, record: null };

function show(name) {
  $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + name));
  UI.screen = name; $('#hotspot').hidden = name !== 'attract'; armIdle();
}
function armIdle() {
  clearTimeout(UI.idleTimer);
  if (!$('#admin').hidden) return;
  if (UI.screen === 'review') UI.idleTimer = setTimeout(() => { if ($('#admin').hidden && UI.screen === 'review') saveSession(); }, 45000);
  else if (UI.screen === 'frames' || (UI.screen === 'capture' && !Session.running)) UI.idleTimer = setTimeout(() => { if ($('#admin').hidden) goHome(); }, 90000);
}
function goHome() {
  Session.token = null; Session.running = false;
  clearInterval(UI.resultTimer); clearTimeout(UI.idleTimer); $('#countdown').textContent = '';
  show('attract'); renderAttract();
}
let recentUrls = [];
async function renderAttract() {
  $('#a-sub').textContent = S().eventSubtitle; $('#a-title').textContent = S().eventTitle;
  $('#a-date').textContent = S().eventDate; $('#a-cta').textContent = S().ctaText;
  const gq = $('#gallery-qr'); const showG = !!(S().showGalleryQR && S().galleryUrl);
  gq.hidden = !showG; if (showG) renderQR($('#gallery-qr-code'), S().galleryUrl);
  recentUrls.forEach((u) => URL.revokeObjectURL(u)); recentUrls = [];
  const box = $('#recent'); box.innerHTML = '';
  const recent = (await DB.all('photos').catch(() => [])).sort((a, b) => b.created - a.created).slice(0, 5);
  const tilt = [-6, 4, -2, 5, -4];
  recent.forEach((r, i) => {
    if (!r.thumb) return; const u = URL.createObjectURL(r.thumb); recentUrls.push(u);
    const im = document.createElement('img'); im.src = u; im.alt = ''; im.style.setProperty('--r', tilt[i] + 'deg'); box.appendChild(im);
  });
}
function goFullscreen() {
  if (!S().autoFullscreen || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
}
function startFlow() {
  Sound.unlock(); goFullscreen(); WakeLock.req(); Cam.ensure();
  const frames = enabledFrames();
  if (!frames.length) { toast('Belum ada bingkai aktif — buka panel admin'); return; }
  if (frames.length === 1) { startSession(frames[0]); return; }
  renderFrameGrid(); show('frames');
}
function renderFrameGrid() {
  const grid = $('#frame-grid'); grid.innerHTML = '';
  for (const f of enabledFrames()) {
    const b = document.createElement('button'); b.className = 'frame-card'; b.type = 'button';
    b.innerHTML = `<div class="thumb"><img alt=""></div><b>${esc(f.name)}</b><span>${f.slots.length} foto</span>`;
    b.onclick = () => startSession(f); grid.appendChild(b);
    frameThumb(f).then((u) => { $('img', b).src = u; }).catch(console.error);
  }
}
function startSession(frame) {
  Object.assign(Session, { frame, shots: [], retakesLeft: Number(S().retakes) || 0, id: uid(10), token: uid(6), running: false, canvas: null, zoom: Number(S().zoom) || 1, record: null });
  prepareCapture(); show('capture'); Cam.ensure();
}
function prepareCapture() {
  const n = Session.frame.slots.length;
  $('#cap-step').textContent = n > 1 ? `${n} foto — siapkan ${n} gaya!` : '1 foto';
  $('#countdown').textContent = ''; $('#btn-shoot').hidden = false; $('#btn-shoot').disabled = false;
  camMsg(Cam.ready ? '' : (Cam.error ? 'Kamera belum siap — panggil operator' : 'Menyalakan kamera…'));
  renderShotStrip(); setStageFor(0);
}
function setStageFor(i) { const s = Session.frame.slots[clamp(i, 0, Session.frame.slots.length - 1)]; sizeStage($('#stage'), s.w / s.h); }
function sizeStage(el, ar) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const maxW = vw * 0.9, maxH = Math.max(220, vh - 390);
  let w = maxW, h = w / ar; if (h > maxH) { h = maxH; w = h * ar; }
  el.style.width = Math.round(w) + 'px'; el.style.height = Math.round(h) + 'px';
}
function renderShotStrip() {
  const box = $('#shots'); box.innerHTML = '';
  Session.frame.slots.forEach((s, i) => {
    const shot = Session.shots[i];
    if (shot) {
      const c = makeCanvas(Math.round(168 * s.w / s.h), 168); drawCover(c.getContext('2d'), shot, { x: 0, y: 0, w: c.width, h: c.height }, S().mirrorOutput, Session.zoom);
      c.style.width = Math.round(84 * s.w / s.h) + 'px'; box.appendChild(c);
    } else { const d = document.createElement('div'); d.className = 'ph'; d.style.aspectRatio = `${s.w}/${s.h}`; d.textContent = i + 1; box.appendChild(d); }
  });
}
function alive(tok) { if (Session.token !== tok) throw new Error('aborted'); }
async function waitAlive(ms, tok) { const end = Date.now() + ms; while (Date.now() < end) { alive(tok); await sleep(Math.min(100, end - Date.now())); } alive(tok); }
async function countdown(sec, tok) {
  const el = $('#countdown');
  for (let i = sec; i >= 1; i--) {
    alive(tok); el.textContent = i; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    Sound.beep(i === 1 ? 1175 : 880); await waitAlive(1000, tok);
  }
  el.textContent = '';
}
async function takeShot() {
  const flash = $('#flash');
  if (S().screenFlash) { flash.classList.remove('blink'); flash.classList.add('on'); await sleep(380); }
  let shot = null;
  if (S().useImageCapture && Cam.ic) {
    try { shot = await createImageBitmap(await withTimeout(Cam.ic.takePhoto(), 6000)); }
    catch (e) { console.warn('takePhoto gagal → pakai frame video', e); }
  }
  if (!shot) {
    const v = $('#cam-main'); const { w, h } = srcSize(v);
    if (!w || !h) { flash.classList.remove('on'); throw new Error('Kamera belum mengirim gambar'); }
    shot = makeCanvas(w, h); shot.getContext('2d').drawImage(v, 0, 0, w, h);
  }
  Sound.shutter(); flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('blink');
  return shot;
}
async function runShots() {
  if (Session.running) return;
  if (!Cam.ready) { toast('Kamera belum siap'); Cam.ensure(); return; }
  Sound.unlock(); const tok = Session.token; Session.running = true; clearTimeout(UI.idleTimer);
  $('#btn-shoot').hidden = true;
  const n = Session.frame.slots.length;
  try {
    for (let i = Session.shots.length; i < n; i++) {
      alive(tok); setStageFor(i);
      $('#cap-step').textContent = n > 1 ? `Foto ${i + 1} dari ${n}` : 'Senyum!';
      await countdown(Number(S().countdown) || 3, tok);
      const shot = await takeShot(); alive(tok);
      Session.shots[i] = shot; renderShotStrip();
      if (i < n - 1) { $('#cap-step').textContent = 'Ganti gaya!'; await waitAlive((Number(S().betweenShots) || 1.5) * 1000, tok); }
    }
    Session.running = false; await toReview();
  } catch (e) {
    if (Session.token === tok) Session.running = false;
    $('#countdown').textContent = '';
    if (e && e.message === 'aborted') return;
    console.error(e); toast('Gagal mengambil foto: ' + (e.message || e), 4000);
    $('#btn-shoot').hidden = false; armIdle();
  }
}
function cancelSession() { goHome(); }
async function toReview() {
  const c = await renderFrame(Session.frame, Session.shots, { zoom: Session.zoom });
  Session.canvas = c;
  const url = URL.createObjectURL(await canvasToBlob(scaleCanvas(c, 1400), 'image/jpeg', 0.9));
  const img = $('#review-img'); if (img.dataset.url) URL.revokeObjectURL(img.dataset.url); img.dataset.url = url; img.src = url;
  const rb = $('#btn-retake'); rb.hidden = Session.retakesLeft <= 0; rb.textContent = `Ulangi (${Session.retakesLeft}×)`;
  $('#btn-save').disabled = false;
  show('review');
}
function retake() {
  if (Session.retakesLeft <= 0) return;
  Session.retakesLeft--; Session.shots = []; Session.token = uid(6); prepareCapture(); show('capture');
}
async function saveSession() {
  if (!Session.canvas || Session.record) return;
  const btn = $('#btn-save'); btn.disabled = true;
  try {
    const mime = S().outFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await canvasToBlob(Session.canvas, mime, mime === 'image/jpeg' ? Number(S().jpegQuality) || 0.92 : undefined);
    const thumb = await canvasToBlob(scaleCanvas(Session.canvas, 640), 'image/jpeg', 0.84);
    const rec = {
      id: Session.id, folder: folderName(), eventTitle: S().eventTitle, created: Date.now(), stamp: stamp(),
      frameId: Session.frame.id, frameName: Session.frame.name, mime, size: blob.size, blob, thumb,
      status: S().apiUrl ? 'pending' : 'local', tries: 0, nextTry: 0, fileId: '', error: '', printed: 0,
    };
    await DB.put('photos', rec);
    Session.record = rec; showResult(rec); Uploader.kick();
    if (S().printEnabled && S().autoPrint) setTimeout(async () => printRecord(await DB.get('photos', rec.id)), 700);
  } catch (e) { console.error(e); toast('Gagal menyimpan foto: ' + (e.message || e), 5000); btn.disabled = false; }
}
function showResult(rec) {
  const img = $('#result-img'); if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
  const url = URL.createObjectURL(rec.thumb); img.dataset.url = url; img.src = url;
  const cloud = !!S().apiUrl;
  $('#result-qr-card').hidden = !cloud;
  $('#result-title').textContent = cloud ? 'Scan untuk ambil fotomu' : 'Foto tersimpan';
  if (cloud) renderQR($('#result-qr'), guestUrl(rec.id));
  $('#result-code').textContent = fmtCode(rec.id);
  $('#btn-print').hidden = !S().printEnabled;
  updateResultStatus(rec); show('result'); startResultTimer();
}
function updateResultStatus(r) {
  const el = $('#result-status'); if (!r) return;
  let cls = '', t = '';
  switch (r.status) {
    case 'done': cls = 'ok'; t = 'Tersimpan di Google Drive ✓'; break;
    case 'uploading': t = 'Mengunggah ke Google Drive…'; break;
    case 'pending': if (navigator.onLine) t = 'Menunggu giliran upload…'; else { cls = 'warn'; t = 'Offline — foto aman di tablet & diunggah otomatis saat online. QR tetap berlaku.'; } break;
    case 'error': cls = 'warn'; t = 'Upload tertunda — dicoba lagi otomatis. QR tetap berlaku, buka linknya sebentar lagi.'; break;
    case 'local': cls = 'warn'; t = 'Google Drive belum diatur — foto disimpan di tablet.'; break;
    default: t = '';
  }
  el.className = 'up-status ' + cls; el.textContent = t;
}
function startResultTimer() {
  clearInterval(UI.resultTimer); let left = Number(S().idleReset) || 60; const el = $('#result-timer');
  const tick = () => { el.textContent = `Kembali ke awal dalam ${left} dtk`; if (left-- <= 0) { clearInterval(UI.resultTimer); if ($('#admin').hidden) goHome(); } };
  tick(); UI.resultTimer = setInterval(tick, 1000);
}
function onUploadEvent(r) {
  if (!r) return;
  if (UI.screen === 'result' && Session.record && r.id === Session.record.id) updateResultStatus(r);
  if (!$('#admin').hidden && Admin.current === 'cloud') renderQueueStats();
}

/* ============================================================ ADMIN */
const Admin = {
  buf: '', taps: 0, tapTimer: null, current: 'event',
  hotspot() {
    this.taps++; clearTimeout(this.tapTimer); this.tapTimer = setTimeout(() => { this.taps = 0; }, 2500);
    if (this.taps >= 5) { this.taps = 0; this.askPin(); }
  },
  askPin() { this.buf = ''; renderPinDots(); $('#pin-modal').hidden = false; },
  key(k) {
    if (k === 'x') { $('#pin-modal').hidden = true; return; }
    if (k === 'del') this.buf = this.buf.slice(0, -1); else if (this.buf.length < 8) this.buf += k;
    renderPinDots();
    const pin = String(S().pin || '1234');
    if (this.buf.length >= pin.length) {
      if (this.buf === pin) { $('#pin-modal').hidden = true; this.open(); }
      else { const b = $('#pin-box'); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); this.buf = ''; setTimeout(renderPinDots, 250); }
    }
  },
  open() { clearTimeout(UI.idleTimer); clearInterval(UI.resultTimer); $('#admin').hidden = false; fillSettings(); this.tab(this.current); },
  close() { $('#admin').hidden = true; closeSheet(); invalidateThumbs(); goHome(); },
  tab(name) {
    this.current = name;
    $$('#admin-nav [data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
    $$('.pane').forEach((p) => p.classList.toggle('active', p.dataset.pane === name));
    const fn = PANES[name]; if (fn) fn();
  },
};
function buildKeypad() {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'x'];
  $('#keypad').innerHTML = keys.map((k) => `<button type="button" data-k="${k}">${k === 'del' ? '⌫' : k === 'x' ? '✕' : k}</button>`).join('');
  $('#keypad').addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) Admin.key(b.dataset.k); });
}
function renderPinDots() {
  const n = String(S().pin || '1234').length;
  $('#pin-dots').innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < Admin.buf.length ? 'on' : ''}"></i>`).join('');
}
function fillSettings() {
  $$('#admin [data-setting]').forEach((el) => {
    const v = S()[el.dataset.setting];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? '';
  });
  $('#zoom-val').textContent = `${(Number(S().zoom) || 1).toFixed(2)}×`;
  $('#folder-input').placeholder = `${S().eventTitle} — ${S().eventDate}`;
}
function onSettingInput(el) {
  const k = el.dataset.setting; let v;
  if (el.type === 'checkbox') v = el.checked; else if ('num' in el.dataset) v = Number(el.value); else v = el.value;
  Settings.set(k, v); onSettingChanged(k);
}
function onSettingChanged(k) {
  if (['eventSubtitle', 'eventTitle', 'eventDate', 'footerText', 'ctaText', 'accent'].includes(k)) {
    applyTheme(); invalidateThumbs(); $('#folder-input').placeholder = `${S().eventTitle} — ${S().eventDate}`;
  }
  if (k === 'cameraId' || k === 'camRes') Cam.start().then(() => { fillCamSelect(); });
  if (k === 'mirrorPreview' || k === 'zoom') { applyCamStyle(); $('#zoom-val').textContent = `${(Number(S().zoom) || 1).toFixed(2)}×`; }
  if (k === 'apiUrl' || k === 'apiToken') { Settings.set('galleryUrl', ''); $('#gallery-url').textContent = ''; updateStatus(); Uploader.kick(); }
}
const stat = (v, l) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`;
const STATUS_LABEL = { done: 'Drive ✓', pending: 'antre', uploading: 'upload…', error: 'gagal', local: 'lokal' };
const PANES = {
  async event() {
    const c = await counts();
    $('#stats').innerHTML = stat(c.total, 'total foto') + stat(c.today, 'hari ini') + stat(c.done, 'di Drive') +
      stat(c.pending + c.local, 'antre') + stat(c.error, 'gagal') + stat(c.prints, 'dicetak') + stat(fmtBytes(c.bytes), 'ukuran');
  },
  camera() { fillCamSelect(); },
  frames() { renderFrameList(); },
  cloud() { renderQueueStats(); $('#gallery-url').textContent = S().galleryUrl || ''; },
  gallery() { renderGallery(); },
  system() { renderSys(); },
};
async function fillCamSelect() {
  const sel = $('#cam-select'); const devs = await Cam.devices();
  const active = Cam.track && Cam.track.getSettings ? Cam.track.getSettings().deviceId : '';
  sel.innerHTML = '<option value="">Otomatis (kamera depan)</option>' +
    devs.map((d, i) => `<option value="${esc(d.deviceId)}">${esc(d.label || 'Kamera ' + (i + 1))}${d.deviceId && d.deviceId === active ? '  • aktif' : ''}</option>`).join('');
  sel.value = devs.some((d) => d.deviceId === S().cameraId) ? S().cameraId : '';
  const i = Cam.info();
  $('#cam-info').textContent = Cam.ready ? `Aktif: ${i.label} · ${i.w}×${i.h} @${i.fps}fps · ${devs.length} kamera terdeteksi` : 'Kamera belum aktif';
}
async function camTest() {
  const v = $('#admin-stage video'); const { w, h } = srcSize(v);
  if (!w) { toast('Kamera belum siap'); return; }
  let shot = null;
  if (S().useImageCapture && Cam.ic) { try { shot = await createImageBitmap(await withTimeout(Cam.ic.takePhoto(), 6000)); } catch (e) { toast('ImageCapture gagal: ' + e.message); } }
  if (!shot) { shot = makeCanvas(w, h); shot.getContext('2d').drawImage(v, 0, 0, w, h); }
  const sz = srcSize(shot); const img = $('#cam-test-img');
  if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
  const small = scaleCanvas(shot, 700); const view = makeCanvas(small.width, small.height); // tampilkan seperti hasil akhir (cermin/zoom)
  drawCover(view.getContext('2d'), small, { x: 0, y: 0, w: view.width, h: view.height }, S().mirrorOutput, Number(S().zoom) || 1);
  const url = URL.createObjectURL(await canvasToBlob(view, 'image/jpeg', 0.86)); img.dataset.url = url; img.src = url;
  $('#cam-info').textContent = `Hasil jepret: ${sz.w} × ${sz.h} px (${((sz.w * sz.h) / 1e6).toFixed(1)} MP) · ${Cam.info().label}`;
}
async function renderFrameList() {
  const box = $('#frame-list'); box.innerHTML = '';
  for (const f of allFrames()) {
    const row = document.createElement('div'); row.className = 'frame-row';
    const on = !S().disabledFrames.includes(f.id);
    row.innerHTML = `<img alt=""><div><b>${esc(f.name)}</b><div class="muted">${f.slots.length} foto · ${f.w}×${f.h}px · ${f.custom ? 'kustom' : 'bawaan'}</div></div>` +
      `<label class="switch"><input type="checkbox" ${on ? 'checked' : ''}><i></i></label>` + (f.custom ? '<button class="btn ghost sm" type="button" data-del>Hapus</button>' : '<span></span>');
    $('input', row).onchange = (e) => {
      const set = new Set(S().disabledFrames); if (e.target.checked) set.delete(f.id); else set.add(f.id);
      Settings.set('disabledFrames', [...set]);
    };
    const del = $('[data-del]', row);
    if (del) confirmTap(del, async () => { await DB.del('frames', f.id); overlayCache.delete(f.id); await loadCustomFrames(); invalidateThumbs(); renderFrameList(); toast('Bingkai dihapus'); });
    box.appendChild(row);
    frameThumb(f).then((u) => { $('img', row).src = u; }).catch(console.error);
  }
}
async function handleFrameFile(e) {
  const file = e.target.files && e.target.files[0]; e.target.value = '';
  const out = $('#frame-import'); if (!file) return;
  out.innerHTML = '<p class="muted">Memproses gambar…</p>';
  try {
    const f = await importFrame(file); f.custom = true;
    const prev = await renderFrame(f, null, { placeholder: true }); const ctx = prev.getContext('2d');
    f.slots.forEach((s, i) => {
      ctx.save(); ctx.strokeStyle = '#d23f74'; ctx.lineWidth = Math.max(3, f.w / 300); ctx.setLineDash([16, 10]); ctx.strokeRect(s.x, s.y, s.w, s.h);
      ctx.fillStyle = '#d23f74'; ctx.font = `600 ${Math.round(Math.min(s.w, s.h) * 0.25)}px Jost, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), s.x + s.w / 2, s.y + s.h / 2); ctx.restore();
    });
    const url = URL.createObjectURL(await canvasToBlob(scaleCanvas(prev, 700), 'image/jpeg', 0.86));
    out.innerHTML = `<div class="cam-test"><img src="${url}" alt=""><div><p><b>${f.slots.length} kotak foto</b> terdeteksi (${f.mode === 'chroma' ? 'kotak hijau' : 'transparan'}) · ${f.w}×${f.h}px</p>` +
      `<label class="field" style="grid-template-columns:1fr"><span>Nama bingkai</span><input type="text" id="new-frame-name" maxlength="30" value="${esc(f.name)}"></label>` +
      '<p class="inline"><button class="btn primary sm" id="new-frame-save" type="button">Simpan bingkai</button><button class="btn ghost sm" id="new-frame-cancel" type="button">Batal</button></p></div></div>';
    $('#new-frame-save').onclick = async () => {
      f.name = $('#new-frame-name').value.trim() || f.name;
      const { custom, ...rec } = f; // eslint-disable-line no-unused-vars
      await DB.put('frames', rec); await loadCustomFrames(); invalidateThumbs(); out.innerHTML = ''; URL.revokeObjectURL(url); renderFrameList(); toast('Bingkai disimpan');
    };
    $('#new-frame-cancel').onclick = () => { overlayCache.delete(f.id); out.innerHTML = ''; URL.revokeObjectURL(url); };
  } catch (err) { out.innerHTML = `<p style="color:var(--bad)">${esc(err.message || err)}</p>`; }
}
async function testApi() {
  const out = $('#api-result'); out.textContent = 'Menghubungi…';
  try {
    const r = await apiPost({ action: 'ping', folder: folderName() }, 40000);
    if (!r.ok) throw new Error(r.error === 'unauthorized' ? 'Token salah (samakan dengan Code.gs)' : r.error);
    Settings.set('galleryUrl', r.eventPublic ? r.eventUrl || '' : '');
    out.innerHTML = `✓ Terhubung (backend v${esc(r.version || '?')}). <a href="${esc(r.eventUrl || r.rootUrl || '#')}" target="_blank" rel="noopener">Buka folder acara</a>`;
    $('#gallery-url').textContent = S().galleryUrl || '(folder acara tidak publik)';
    Uploader.kick();
  } catch (e) { out.textContent = '✗ ' + (e.message || e); }
}
async function renderQueueStats() {
  const c = await counts();
  $('#queue-stats').innerHTML = stat(c.done, 'di Drive') + stat(c.pending + (S().apiUrl ? c.local : 0), 'antre') + stat(c.error, 'gagal') +
    (c.lastError ? `<div class="stat" style="grid-column:1/-1"><span>Error terakhir</span><div class="mono">${esc(c.lastError)}</div></div>` : '');
}
async function retryAll() {
  const all = await DB.all('photos');
  for (const r of all) if (r.status !== 'done') await DB.patch('photos', r.id, (x) => { x.nextTry = 0; if (x.status === 'local' || x.status === 'error') x.status = 'pending'; });
  Uploader.kick(); toast('Upload ulang dimulai'); setTimeout(renderQueueStats, 800);
}
let galleryUrls = [];
async function renderGallery() {
  galleryUrls.forEach((u) => URL.revokeObjectURL(u)); galleryUrls = [];
  const box = $('#gal'); const all = (await DB.all('photos')).sort((a, b) => b.created - a.created);
  box.innerHTML = all.length ? '' : '<p class="muted">Belum ada foto.</p>';
  for (const r of all) {
    const b = document.createElement('button'); b.type = 'button';
    const u = r.thumb ? URL.createObjectURL(r.thumb) : ''; if (u) galleryUrls.push(u);
    b.innerHTML = `<img src="${u}" alt=""><span class="badge ${r.status}">${STATUS_LABEL[r.status] || r.status}</span><div class="t">${fmtDT(r.created)} · ${fmtCode(r.id)}</div>`;
    b.onclick = () => openPhotoSheet(r.id); box.appendChild(b);
  }
}
const fileName = (r) => `${r.id}_${r.stamp || stamp(new Date(r.created))}.${r.mime === 'image/jpeg' ? 'jpg' : 'png'}`;
async function openPhotoSheet(id) {
  const r = await DB.get('photos', id); if (!r) return;
  const u = URL.createObjectURL(r.thumb); $('#sheet').dataset.url = u;
  $('#sheet-body').innerHTML =
    `<div style="display:flex;gap:18px;flex-wrap:wrap"><img src="${u}" alt="" style="width:200px;border-radius:8px;box-shadow:var(--shadow)">` +
    `<div style="flex:1;min-width:200px"><h3 style="margin:0 0 6px;font-family:var(--serif);font-size:26px">Kode ${fmtCode(r.id)}</h3>` +
    `<p class="muted">${fmtDT(r.created)} · ${esc(r.frameName || r.frameId)} · ${fmtBytes(r.size)}<br>Status: ${STATUS_LABEL[r.status] || r.status}${r.error ? ' — ' + esc(r.error) : ''}<br>Dicetak: ${r.printed || 0}×</p>` +
    (S().apiUrl ? '<div class="qr" id="sheet-qr" style="width:170px"></div>' : '') + '</div></div>' +
    '<p class="inline" style="margin-top:16px"><button class="btn primary sm" type="button" data-x="print">Cetak</button><button class="btn ghost sm" type="button" data-x="dl">Download</button>' +
    '<button class="btn ghost sm" type="button" data-x="up">Upload ulang</button><button class="btn danger sm" type="button" data-x="del">Hapus</button></p>';
  if (S().apiUrl) renderQR($('#sheet-qr'), guestUrl(r.id));
  $('#sheet').hidden = false;
  const body = $('#sheet-body');
  $('[data-x=print]', body).onclick = async () => printRecord(await DB.get('photos', id));
  $('[data-x=dl]', body).onclick = () => downloadBlob(r.blob, fileName(r));
  $('[data-x=up]', body).onclick = async () => { await DB.patch('photos', id, (x) => { x.status = 'pending'; x.nextTry = 0; }); Uploader.kick(); toast('Masuk antrean upload'); closeSheet(); renderGallery(); };
  confirmTap($('[data-x=del]', body), async () => { await DB.del('photos', id); closeSheet(); renderGallery(); updateStatus(); toast('Foto dihapus dari tablet'); });
}
function closeSheet() { const sh = $('#sheet'); sh.hidden = true; if (sh.dataset.url) { URL.revokeObjectURL(sh.dataset.url); sh.dataset.url = ''; } }
async function downloadAll() {
  const all = (await DB.all('photos')).sort((a, b) => a.created - b.created);
  if (!all.length) { toast('Belum ada foto'); return; }
  toast(`Mengunduh ${all.length} foto… izinkan “unduh banyak file” bila diminta`, 6000);
  for (const r of all) { downloadBlob(r.blob, fileName(r)); await sleep(450); }
}
async function purgeDone() {
  const all = await DB.all('photos'); let n = 0;
  for (const r of all) if (r.status === 'done') { await DB.del('photos', r.id); n++; }
  toast(`${n} salinan lokal dihapus`); renderGallery(); updateStatus();
}
async function renderSys() {
  let est = {}; let persisted = false;
  try { est = await navigator.storage.estimate(); } catch (e) { /* noop */ }
  try { persisted = await navigator.storage.persisted(); } catch (e) { /* noop */ }
  const sw = navigator.serviceWorker && navigator.serviceWorker.controller ? 'aktif' : 'belum aktif';
  $('#sys-info').innerHTML = `Versi ${VERSION} · Penyimpanan ${fmtBytes(est.usage)} dari ${fmtBytes(est.quota)}${persisted ? ' (persisten)' : ''}<br>` +
    `Cache offline: ${sw} · Layar tetap menyala: ${WakeLock.lock ? 'aktif' : 'tidak aktif'} · Jaringan: ${navigator.onLine ? 'online' : 'OFFLINE'}<br>` +
    `Alamat: ${esc(location.origin)} · Kamera: ${Cam.ready ? esc(Cam.info().label) : 'belum aktif'}`;
  $('#err-log').textContent = ErrLog.length ? ErrLog.join('\n') : '(kosong)';
}
function savePin() {
  const v = $('#new-pin').value.trim();
  if (!/^\d{4,8}$/.test(v)) { toast('PIN harus 4–8 angka'); return; }
  Settings.set('pin', v); $('#new-pin').value = ''; toast('PIN disimpan');
}
async function forceUpdate() {
  try {
    const regs = (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) ? await navigator.serviceWorker.getRegistrations() : [];
    await Promise.all(regs.map((r) => r.unregister()));
    if (window.caches) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
  } catch (e) { console.warn(e); }
  location.reload();
}
async function printLast() {
  const all = (await DB.all('photos')).sort((a, b) => b.created - a.created);
  if (!all.length) { toast('Belum ada foto untuk dicetak'); return; }
  const r = all[0]; await DB.patch('photos', r.id, (x) => { x.printed = 0; }); // tes tidak dihitung
  printRecord(await DB.get('photos', r.id));
}

/* ======================================================= GUEST PAGE */
async function initGuest(params) {
  document.body.classList.add('guest'); show('guest');
  const id = String(params.get('s') || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  const api = apiFromParams(params); const msg = $('#g-msg');
  $('#g-code').textContent = fmtCode(id);
  if (!ID_RE.test(id) || !api) { $('#g-loader').hidden = true; msg.textContent = 'Link foto tidak valid.'; return; }
  for (let i = 0; i < 120; i++) {
    try {
      const r = await apiGet(api, { action: 'get', s: id });
      if (r && r.ok && r.status === 'ready' && /^[\w-]{10,}$/.test(r.fileId || '')) { showGuestPhoto(r, api, id); return; }
      if (r && r.ok === false && r.error === 'id_invalid') { $('#g-loader').hidden = true; msg.textContent = 'Link foto tidak valid.'; return; }
      msg.textContent = i < 2 ? 'Menyiapkan foto…' : 'Foto sedang diunggah dari photobooth — halaman ini akan memuat otomatis.';
    } catch (e) { msg.textContent = 'Menghubungkan… (cek koneksi internet)'; }
    await sleep(i < 20 ? 3000 : 10000);
  }
  $('#g-loader').hidden = true; msg.textContent = 'Foto belum tersedia. Coba buka link ini lagi nanti.';
}
function showGuestPhoto(r, api, id) {
  if (r.eventTitle) { $('#g-title').textContent = r.eventTitle; document.title = `${r.eventTitle} · Photobooth`; }
  let filePromise = null;
  const getFile = () => {
    if (!filePromise) {
      filePromise = apiGet(api, { action: 'img', s: id }, 90000).then((d) => {
        if (!d || !d.ok || !d.data) throw new Error((d && d.error) || 'gagal');
        const blob = b64ToBlob(d.data, d.mime || 'image/png');
        return new File([blob], d.name || `${id}.png`, { type: d.mime || 'image/png' });
      });
      filePromise.catch(() => { filePromise = null; });
    }
    return filePromise;
  };
  const img = $('#g-img'); let fellBack = false;
  img.onload = () => { $('#g-loader').hidden = true; img.hidden = false; };
  img.onerror = async () => {
    if (fellBack) { $('#g-loader').hidden = true; $('#g-msg').textContent = 'Pratinjau gagal dimuat — pakai tombol Download.'; return; }
    fellBack = true;
    try { const f = await getFile(); img.src = URL.createObjectURL(f); } catch (e) { img.onerror(); }
  };
  img.src = `https://drive.google.com/thumbnail?id=${encodeURIComponent(r.fileId)}&sz=w2000`;
  $('#g-dl').href = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(r.fileId)}`;
  $('#g-open').href = `https://drive.google.com/file/d/${encodeURIComponent(r.fileId)}/view`;
  $('#g-msg').textContent = 'Fotomu sudah siap!'; $('#g-actions').hidden = false;
  getFile().catch(() => {}); // siapkan di latar → tombol Simpan langsung responsif
  $('#g-share').onclick = async () => {
    const b = $('#g-share'); const old = b.textContent; b.disabled = true; b.textContent = 'Menyiapkan…';
    try {
      const file = await getFile();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: r.eventTitle || 'Photobooth' }); }
        catch (e) { if (e && e.name === 'NotAllowedError') downloadBlob(file, file.name); else if (!e || e.name !== 'AbortError') throw e; }
      } else downloadBlob(file, file.name);
    } catch (e) { toast('Gagal menyiapkan file — pakai tombol Download'); }
    finally { b.disabled = false; b.textContent = old; }
  };
}

/* ===================================================== platform glue */
const WakeLock = {
  lock: null,
  async req() {
    if (this.lock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try { this.lock = await navigator.wakeLock.request('screen'); this.lock.addEventListener('release', () => { this.lock = null; }); } catch (e) { /* noop */ }
  },
  init() {
    this.req();
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { this.req(); Cam.ensure(); Uploader.kick(); } });
  },
};
function applyTheme() { document.documentElement.style.setProperty('--accent', S().accent || DEFAULTS.accent); }
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return;
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW gagal', e));
}
async function fontsReady() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await withTimeout(Promise.all(['400 48px "Great Vibes"', '600 40px "Cormorant Garamond"', '500 40px "Cormorant Garamond"', 'italic 400 30px "Cormorant Garamond"', '500 20px "Jost"']
      .map((f) => document.fonts.load(f))), 4000);
  } catch (e) { /* lanjut dengan font cadangan */ }
}
function bindEvents() {
  $('#hotspot').addEventListener('click', (e) => { e.stopPropagation(); Admin.hotspot(); });
  $('#scr-attract').addEventListener('click', (e) => { if (e.target.closest('#gallery-qr')) return; startFlow(); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-action]'); if (!a) return;
    const act = a.dataset.action;
    if (act === 'home') goHome(); else if (act === 'cancel') cancelSession(); else if (act === 'admin-close') Admin.close(); else if (act === 'sheet-close') closeSheet();
  });
  $('#btn-shoot').addEventListener('click', runShots);
  $('#btn-retake').addEventListener('click', retake);
  $('#btn-save').addEventListener('click', saveSession);
  $('#btn-done').addEventListener('click', goHome);
  $('#btn-print').addEventListener('click', async () => { if (Session.record) printRecord(await DB.get('photos', Session.record.id)); });
  document.addEventListener('pointerdown', () => { if (UI.screen === 'result' && $('#admin').hidden) startResultTimer(); else armIdle(); }, { capture: true });
  addEventListener('resize', () => { if (UI.screen === 'capture' && Session.frame) setStageFor(Math.min(Session.shots.length, Session.frame.slots.length - 1)); });
  addEventListener('keydown', (e) => { if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) Admin.askPin(); });
  // admin
  $('#admin-nav').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) Admin.tab(b.dataset.tab); });
  $('#admin').addEventListener('change', (e) => { const el = e.target.closest('[data-setting]'); if (el) onSettingInput(el); });
  $('#admin').addEventListener('input', (e) => { const el = e.target.closest('[data-setting]'); if (el && el.type === 'range') onSettingInput(el); });
  $('#cam-refresh').addEventListener('click', () => { Cam.start().then(fillCamSelect); });
  $('#cam-test-btn').addEventListener('click', camTest);
  $('#frame-file').addEventListener('change', handleFrameFile);
  $('#token-gen').addEventListener('click', () => { const t = uid(24); Settings.set('apiToken', t); fillSettings(); toast('Token baru — salin juga ke TOKEN di Code.gs', 4500); });
  $('#api-test').addEventListener('click', testApi);
  $('#retry-all').addEventListener('click', retryAll);
  $('#print-test').addEventListener('click', printLast);
  $('#dl-all').addEventListener('click', downloadAll);
  confirmTap($('#purge-done'), purgeDone);
  $('#pin-save').addEventListener('click', savePin);
  $('#fs-btn').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); });
  $('#update-btn').addEventListener('click', forceUpdate);
  confirmTap($('#reset-settings'), () => { localStorage.removeItem('pb.settings'); location.reload(); });
  $('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
  $('#pin-modal').addEventListener('click', (e) => { if (e.target.id === 'pin-modal') $('#pin-modal').hidden = true; });
  if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
    navigator.mediaDevices.addEventListener('devicechange', () => {
      if (!$('#admin').hidden && Admin.current === 'camera') fillCamSelect();
      if (!Cam.track || Cam.track.readyState !== 'live') Cam.start();
    });
  }
}

async function main() {
  Settings.load(); applyTheme(); $('#ver').textContent = 'v' + VERSION;
  const params = new URLSearchParams(location.search);
  if (params.has('s')) { await fontsReady(); initGuest(params); return; }
  if (typeof qrcode !== 'function') { logErr('vendor/qrcode.js tidak termuat'); toast('vendor/qrcode.js tidak ditemukan — QR tidak bisa dibuat. Upload ulang folder vendor/.', 8000); }
  if (location.protocol === 'file:') setTimeout(() => toast('Mode file lokal — hanya untuk uji tampilan. QR tamu & mode offline butuh link HTTPS (Vercel).', 8000), 1200);
  registerSW();
  try { await DB.open(); } catch (e) { console.error(e); toast('Penyimpanan lokal tidak tersedia', 6000); }
  await loadCustomFrames();
  buildKeypad(); bindEvents(); applyCamStyle();
  await fontsReady();
  show('attract'); renderAttract(); updateStatus();
  Uploader.on(onUploadEvent); Uploader.start();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* noop */ }
  WakeLock.init();
  Cam.start();
}
main().catch((e) => {
  console.error(e); logErr('start: ' + ((e && e.message) || e));
  const box = document.getElementById('boot-error');
  if (box) { document.getElementById('boot-reason').textContent = 'Error saat memulai: ' + ((e && e.message) || e); box.hidden = false; }
});
