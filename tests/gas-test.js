// Tes logika apps-script/Code.gs di Node (tanpa dependensi) dengan tiruan layanan Apps Script.
// Jalankan: node tests/gas-test.js
const vm = require('vm');
const fs = require('fs');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');

let nextId = 1; const files = []; const folders = [];
const iter = (arr) => { let i = 0; return { hasNext: () => i < arr.length, next: () => arr[i++] }; };
class Folder {
  constructor(name, parent) { this.id = 'fold' + (nextId++); this.name = name; this.parent = parent; this.trashed = false; this.sharing = null; folders.push(this); }
  getId() { return this.id; } getName() { return this.name; } getUrl() { return 'https://drive.google.com/drive/folders/' + this.id; } isTrashed() { return this.trashed; }
  getFoldersByName(n) { return iter(folders.filter((f) => f.parent === this && f.name === n && !f.trashed)); }
  createFolder(n) { return new Folder(n, this); }
  createFile(blob) { const f = new GFile(blob, this); files.push(f); return f; }
  setSharing(a, p) { this.sharing = [a, p]; }
}
class GFile {
  constructor(blob, folder) { this.id = 'file' + (nextId++) + 'abcdefghij'; this.blob = blob; this.folder = folder; this.desc = ''; this.trashed = false; this.sharing = null; }
  getId() { return this.id; } getUrl() { return 'https://drive.google.com/file/d/' + this.id + '/view'; } getName() { return this.blob.name; } getMimeType() { return this.blob.type; } getSize() { return this.blob.bytes.length; }
  setDescription(d) { this.desc = d; } getDescription() { return this.desc; } setSharing(a, p) { this.sharing = [a, p]; } isTrashed() { return this.trashed; }
  getBlob() { return { getContentType: () => this.blob.type, getBytes: () => this.blob.bytes }; }
}
const myDrive = new Folder('My Drive', null);
let cache = new Map(); const props = new Map();
// --- mock SpreadsheetApp (database) ---
const sheets = []; let ssCount = 0;
class MockSheet { constructor(ss, name) { this.ss = ss; this.name = name; this.rows = []; this.frozen = 0; }
  getName() { return this.name; } setName(n) { this.name = n; } getLastRow() { return this.rows.length; }
  appendRow(r) { this.rows.push(r); } setFrozenRows(n) { this.frozen = n; } getRange() { return { setFontWeight() {} }; } getParent() { return this.ss; } }
class MockSS { constructor(name) { this.id = 'ss' + (++ssCount); this.name = name; this.sheets = [new MockSheet(this, 'Sheet1')]; sheets.push(this);
    const f = new GFile({ name, type: 'application/vnd.google-apps.spreadsheet', bytes: [] }, myDrive); f.id = this.id; files.push(f); }
  getId() { return this.id; } getUrl() { return 'https://docs.google.com/spreadsheets/d/' + this.id; }
  getSheetByName(n) { return this.sheets.find((s) => s.name === n) || null; } getSheets() { return this.sheets; } }
GFile.prototype.moveTo = function (folder) { this.folder = folder; return this; };
const sandbox = {
  console,
  DriveApp: {
    Access: { ANYONE_WITH_LINK: 'ANYONE_WITH_LINK' }, Permission: { VIEW: 'VIEW' },
    getRootFolder: () => myDrive, createFolder: (n) => new Folder(n, myDrive),
    getFolderById: (id) => { const f = folders.find((x) => x.id === id); if (!f) throw new Error('not found'); return f; },
    getFileById: (id) => { const f = files.find((x) => x.id === id); if (!f) throw new Error('not found'); return f; },
    searchFiles: (q) => { const m = /^title contains '([^']+)' and trashed = false$/.exec(q); if (!m) throw new Error('bad query ' + q); return iter(files.filter((f) => !f.trashed && f.getName().startsWith(m[1]))); },
  },
  Utilities: {
    base64Decode: (s) => Array.from(Buffer.from(s, 'base64')),
    base64Encode: (b) => Buffer.from(b).toString('base64'),
    newBlob: (bytes, type, name) => ({ bytes, type, name }),
    formatDate: () => '20270720-101500',
  },
  CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) || null, put: (k, v) => cache.set(k, v) }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) || null, setProperty: (k, v) => props.set(k, v) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  Session: { getScriptTimeZone: () => 'Asia/Jakarta' },
  ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; } }) },
  Logger: { log: () => {} },
  SpreadsheetApp: { create: (n) => new MockSS(n), openById: (id) => { const s = sheets.find((x) => x.id === id); if (!s) throw new Error('no sheet'); return s; } },
};
vm.createContext(sandbox);
vm.runInContext(src + '\n;this.__api = { doPost, doGet, CONFIG };', sandbox);
const { doPost, doGet, CONFIG } = sandbox.__api;
const post = (o) => JSON.parse(doPost({ postData: { contents: typeof o === 'string' ? o : JSON.stringify(o) } }).s);
const get = (p) => JSON.parse(doGet({ parameter: p }).s);
const res = []; const ok = (n, c, x = '') => res.push(`${c ? 'PASS' : 'FAIL'}  ${n}${x ? '  — ' + x : ''}`);
const T = CONFIG.TOKEN;
const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex').toString('base64');

ok('bad JSON rejected', post('{nope').error === 'bad_json');
ok('wrong token rejected', post({ token: 'x', action: 'ping' }).error === 'unauthorized');
let r = post({ token: T, action: 'ping', folder: 'Rina & Dimas — 20 · 07 · 2027' });
ok('ping creates root + event folder', r.ok && /folders\/fold/.test(r.eventUrl) && folders.filter((f) => f.name === 'Photobooth').length === 1, JSON.stringify(r));
r = post({ token: T, action: 'ping', folder: 'Rina & Dimas — 20 · 07 · 2027' });
ok('ping again reuses folders', folders.length === 3, 'folders=' + folders.map((f) => f.name).join(' | '));
ok('ping creates database sheet once, inside Photobooth folder', sheets.length === 1 && /spreadsheets\/d\/ss1/.test(r.sheetUrl) && files.find((f) => f.id === 'ss1').folder.name === 'Photobooth', r.sheetUrl);
const dbRows = () => sheets[0].getSheetByName('Foto').rows;
ok('database has header row', JSON.stringify(dbRows()[0]) === JSON.stringify(['Waktu', 'Kode', 'Acara', 'Folder', 'Bingkai', 'Nama file', 'Link Drive', 'Ukuran (KB)']));
r = post({ token: T, action: 'upload', id: 'ABCDE12345', folder: 'Rina & Dimas — 20 · 07 · 2027', eventTitle: 'Rina & Dimas', frame: 'Photo Strip', stamp: '20270720-101010', mime: 'image/png', data: png });
const f1 = files.find((f) => f.getName().startsWith('ABCDE12345'));
ok('upload saves file in event folder', r.ok && f1 && f1.folder.name === 'Rina & Dimas — 20 · 07 · 2027', JSON.stringify(r));
ok('upload logged as database row', dbRows().length === 2 && dbRows()[1][1] === 'ABCDE12345' && dbRows()[1][2] === 'Rina & Dimas' && /file\/d\//.test(dbRows()[1][6]) && dbRows()[1][4] === 'Photo Strip', JSON.stringify(dbRows()[1]));
ok('file name starts with ID, has stamp & frame', f1.getName() === 'ABCDE12345_20270720-101010_Photo Strip.png', f1.getName());
ok('file shared anyone-with-link (view)', JSON.stringify(f1.sharing) === '["ANYONE_WITH_LINK","VIEW"]' && r.shared === true);
r = post({ token: T, action: 'upload', id: 'ABCDE12345', folder: 'x', mime: 'image/png', data: png });
ok('re-upload same ID is idempotent (no extra file/row)', r.ok && r.duplicate === true && files.filter((f) => f.getName().startsWith('ABCDE12345')).length === 1 && r.fileId === f1.id && dbRows().length === 2);
r = get({ action: 'get', s: 'abcde12345' });
ok('guest get → ready + eventTitle', r.ok && r.status === 'ready' && r.fileId === f1.id && r.eventTitle === 'Rina & Dimas', JSON.stringify(r));
cache = new Map(); // simulasi cache kedaluwarsa
r = get({ s: 'ABCDE12345' });
ok('lookup works after cache expiry (Drive search)', r.status === 'ready' && r.fileId === f1.id);
ok('unknown ID → pending', get({ s: 'ZZZZZ99999' }).status === 'pending');
ok('malformed ID → id_invalid', get({ s: 'ab' }).error === 'id_invalid');
r = get({ action: 'img', s: 'ABCDE12345' });
ok('img returns original bytes', r.ok && r.data === png && r.mime === 'image/png');
r = post({ token: T, action: 'upload', id: 'JPG0000001', folder: 'Acara Kedua', stamp: 'bad', frame: 'a/b:c', mime: 'image/jpeg', data: png });
const f2 = files.find((f) => f.getName().startsWith('JPG0000001'));
ok('jpeg → .jpg, bad stamp replaced, unsafe chars cleaned', /^JPG0000001_20270720-101500_a-b-c\.jpg$/.test(f2.getName()), f2.getName());
ok('second event gets its own folder', f2.folder.name === 'Acara Kedua' && f2.folder.parent.name === 'Photobooth');
ok('invalid upload ID rejected', post({ token: T, action: 'upload', id: '../../x', data: png }).error === 'id_invalid');
ok('info endpoint', get({}).service === 'photobooth');
console.log(res.join('\n'));
const fails = res.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${res.length - fails}/${res.length} lolos`);
process.exit(fails ? 1 : 0);
