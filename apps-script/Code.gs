/**
 * PHOTOBOOTH — Backend Google Apps Script (gratis)
 * ------------------------------------------------------------------
 * Tablet mengirim foto → disimpan ke Google Drive kamu (1 folder per acara)
 * → dicatat di Google Sheet "Photobooth — Database" (1 baris per foto)
 * → file di-share "siapa saja yang punya link" → halaman tamu (QR) mengambil foto.
 *
 * PASANG (sekali saja, ±5 menit):
 *  1. Buka https://script.google.com → New project → hapus isi editor → tempel file ini.
 *  2. Ganti TOKEN di bawah dengan teks acak (samakan dengan Admin › Drive & QR › Token).
 *  3. Klik Deploy › New deployment › ikon ⚙ › Web app
 *       Execute as: Me        Who has access: Anyone
 *  4. Authorize access → pilih akun → Advanced → Go to … (unsafe) → Allow.
 *  5. Salin "Web app URL" (berakhiran /exec) → tempel di Admin › Drive & QR › URL Web App.
 *
 * UPDATE KODE: Deploy › Manage deployments › ✎ (edit) › Version: New version › Deploy.
 *              (URL tetap sama — tidak perlu ganti QR / pengaturan tablet.)
 *
 * KEAMANAN: ganti TOKEN hanya di editor Apps Script. JANGAN commit token asli ke GitHub.
 */
const CONFIG = {
  TOKEN: 'GANTI-DENGAN-TOKEN-RAHASIA',
  ROOT_FOLDER_NAME: 'Photobooth',   // folder induk di My Drive (dibuat otomatis)
  ROOT_FOLDER_ID: '',               // opsional: ID folder tertentu (dari URL folder Drive)
  SHEET_ID: '',                     // opsional: ID Google Sheet database (kosong = dibuat otomatis di folder induk)
  PUBLIC_EVENT_FOLDER: false,       // true = folder acara bisa dibuka siapa saja yang punya link (QR galeri)
  MAX_BYTES: 25 * 1024 * 1024,      // batas ukuran 1 foto
  TIME_ZONE: 'Asia/Jakarta',        // zona waktu kolom "Waktu" di database
};

const VERSION = '1.1.1';
const DB_HEADER = ['Waktu', 'Kode', 'Acara', 'Folder', 'Bingkai', 'Nama file', 'Link Drive', 'Ukuran (KB)'];
const ID_RE = /^[0-9A-Z]{8,16}$/;
const CACHE_TTL = 21600; // 6 jam (maksimum CacheService)

/* ---------------- endpoint: dipanggil tablet (POST) ---------------- */
function doPost(e) {
  let body = null;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); }
  catch (err) { return json_({ ok: false, error: 'bad_json' }); }
  if (!body || body.token !== CONFIG.TOKEN) return json_({ ok: false, error: 'unauthorized' });
  try {
    if (body.action === 'ping') return json_(ping_(body));
    if (body.action === 'upload') return json_(upload_(body));
    return json_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ---------------- endpoint: dipanggil halaman tamu (GET) ------------ */
function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    const action = p.action || (p.s ? 'get' : 'info');
    if (action === 'get') return json_(get_(p.s));
    if (action === 'img') return json_(img_(p.s));
    return json_({ ok: true, service: 'photobooth', version: VERSION });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

/* ------------------------------ aksi ------------------------------- */
function ping_(b) {
  const root = rootFolder_();
  const out = { ok: true, version: VERSION, rootUrl: root.getUrl(), sheetUrl: dbSheet_().getParent().getUrl() };
  if (b.folder) {
    const f = eventFolder_(b.folder);
    out.eventUrl = f.getUrl();
    out.eventPublic = CONFIG.PUBLIC_EVENT_FOLDER;
  }
  return out;
}

function upload_(b) {
  const id = String(b.id || '').toUpperCase();
  if (!ID_RE.test(id)) throw new Error('id_invalid');
  if (!b.data) throw new Error('no_data');
  const mime = b.mime === 'image/jpeg' ? 'image/jpeg' : 'image/png';
  const ext = mime === 'image/jpeg' ? 'jpg' : 'png';

  // Idempoten: tablet bisa mengulang upload yang sama (mis. koneksi putus saat respon)
  const existing = findFile_(id);
  if (existing) return fileInfo_(existing, { duplicate: true });

  const bytes = Utilities.base64Decode(b.data);
  if (bytes.length > CONFIG.MAX_BYTES) throw new Error('too_large');

  const folder = eventFolder_(b.folder || 'Tanpa Nama');
  const st = /^\d{8}-\d{6}$/.test(String(b.stamp || '')) ? b.stamp : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  const name = id + '_' + st + '_' + safe_(b.frame || 'foto', 24) + '.' + ext; // ID di depan → bisa dicari cepat
  const file = folder.createFile(Utilities.newBlob(bytes, mime, name));
  file.setDescription(JSON.stringify({ id: id, event: String(b.eventTitle || '').slice(0, 80), frame: String(b.frame || '').slice(0, 40) }));

  let shared = true;
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
  catch (err) { shared = false; } // akun Workspace bisa melarang share publik
  CacheService.getScriptCache().put('f:' + id, file.getId(), CACHE_TTL);
  try { // database: 1 baris per foto (gagal log tidak menggagalkan upload)
    dbSheet_().appendRow([new Date(), id, String(b.eventTitle || ''), folder.getName(), String(b.frame || ''), name, file.getUrl(), Math.round(bytes.length / 1024)]);
  } catch (err) { console.error('log database gagal', err); }
  return fileInfo_(file, { shared: shared });
}

function get_(s) {
  const id = cleanId_(s);
  if (!ID_RE.test(id)) return { ok: false, error: 'id_invalid' };
  const f = findFile_(id);
  if (!f) return { ok: true, status: 'pending' };
  return fileInfo_(f, {});
}

function img_(s) {
  const id = cleanId_(s);
  if (!ID_RE.test(id)) return { ok: false, error: 'id_invalid' };
  const f = findFile_(id);
  if (!f) return { ok: true, status: 'pending' };
  if (f.getSize() > CONFIG.MAX_BYTES) return { ok: false, error: 'too_large' };
  const blob = f.getBlob();
  return { ok: true, status: 'ready', name: f.getName(), mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/* ----------------------------- helper ------------------------------ */
function findFile_(id) {
  const cache = CacheService.getScriptCache();
  const fid = cache.get('f:' + id);
  if (fid) {
    try { const f = DriveApp.getFileById(fid); if (!f.isTrashed()) return f; } catch (err) { /* lanjut cari */ }
  }
  const it = DriveApp.searchFiles("title contains '" + id + "' and trashed = false");
  while (it.hasNext()) {
    const f = it.next();
    if (f.getName().indexOf(id + '_') === 0) { cache.put('f:' + id, f.getId(), CACHE_TTL); return f; }
  }
  return null;
}

function fileInfo_(f, extra) {
  let meta = {};
  try { meta = JSON.parse(f.getDescription() || '{}'); } catch (err) { meta = {}; }
  const id = f.getId();
  return Object.assign({
    ok: true, status: 'ready', fileId: id, name: f.getName(), mime: f.getMimeType(), size: f.getSize(),
    eventTitle: meta.event || '',
    viewUrl: 'https://drive.google.com/file/d/' + id + '/view',
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + id,
  }, extra || {});
}

function rootFolder_() {
  if (CONFIG.ROOT_FOLDER_ID) return DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('rootId');
  if (id) {
    try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (err) { /* buat ulang */ }
  }
  const it = DriveApp.getRootFolder().getFoldersByName(CONFIG.ROOT_FOLDER_NAME);
  const f = it.hasNext() ? it.next() : DriveApp.createFolder(CONFIG.ROOT_FOLDER_NAME);
  props.setProperty('rootId', f.getId());
  return f;
}

function eventFolder_(name) {
  const clean = safe_(name, 100) || 'Tanpa Nama';
  const props = PropertiesService.getScriptProperties();
  const key = 'folder:' + clean;
  const cached = props.getProperty(key);
  if (cached) {
    try { const f = DriveApp.getFolderById(cached); if (!f.isTrashed()) return f; } catch (err) { /* buat ulang */ }
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // cegah folder ganda saat upload bersamaan
  try {
    const again = props.getProperty(key);
    if (again && again !== cached) {
      try { return DriveApp.getFolderById(again); } catch (err) { /* lanjut */ }
    }
    const root = rootFolder_();
    const it = root.getFoldersByName(clean);
    const folder = it.hasNext() ? it.next() : root.createFolder(clean);
    if (CONFIG.PUBLIC_EVENT_FOLDER) {
      try { folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { /* abaikan */ }
    }
    props.setProperty(key, folder.getId());
    return folder;
  } finally {
    lock.releaseLock();
  }
}

/** Google Sheet database (sheet "Foto"). Dibuat otomatis di folder induk bila SHEET_ID kosong. */
function dbSheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = CONFIG.SHEET_ID || props.getProperty('sheetId');
  let ss = null;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; } }
  if (!ss) {
    ss = SpreadsheetApp.create('Photobooth — Database');
    try { ss.setSpreadsheetTimeZone(CONFIG.TIME_ZONE); } catch (err) { /* abaikan */ }
    DriveApp.getFileById(ss.getId()).moveTo(rootFolder_());
    props.setProperty('sheetId', ss.getId());
  }
  let sh = ss.getSheetByName('Foto');
  if (!sh) { sh = ss.getSheets()[0]; sh.setName('Foto'); }
  if (sh.getLastRow() === 0) { sh.appendRow(DB_HEADER); sh.setFrozenRows(1); sh.getRange(1, 1, 1, DB_HEADER.length).setFontWeight('bold'); }
  return sh;
}

function cleanId_(s) { return String(s || '').toUpperCase().replace(/[^0-9A-Z]/g, ''); }
function safe_(s, max) {
  return String(s || '').replace(/[\\/:*?"<>|#%\u0000-\u001f]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, max || 80);
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/** Opsional: jalankan sekali dari editor (pilih "setup" → Run) untuk memicu izin, membuat folder & database. */
function setup() {
  Logger.log('Folder Photobooth: ' + rootFolder_().getUrl());
  Logger.log('Database: ' + dbSheet_().getParent().getUrl());
}
