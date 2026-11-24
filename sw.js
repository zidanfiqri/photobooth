/* Service worker: aplikasi tetap bisa dibuka walau internet venue putus.
   Naikkan CACHE (mis. pb-v2) setiap kali kamu deploy versi baru. */
const CACHE = 'pb-v1.0.1';
const SHELL = [
  './', './index.html', './app.js', './vendor/qrcode.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './fonts/great-vibes-latin-400-normal.woff2',
  './fonts/cormorant-garamond-latin-400-normal.woff2', './fonts/cormorant-garamond-latin-500-normal.woff2',
  './fonts/cormorant-garamond-latin-600-normal.woff2', './fonts/cormorant-garamond-latin-400-italic.woff2',
  './fonts/cormorant-garamond-latin-500-italic.woff2',
  './fonts/jost-latin-400-normal.woff2', './fonts/jost-latin-500-normal.woff2', './fonts/jost-latin-600-normal.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Apps Script & Drive selalu lewat jaringan
  // Navigasi (termasuk halaman tamu ?s=…) → kunci cache './'
  const key = req.mode === 'navigate' ? new Request(new URL('./', self.registration.scope).href) : req;
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const hit = await cache.match(key, { ignoreSearch: req.mode === 'navigate' });
    const net = fetch(req).then((res) => { if (res && res.ok) cache.put(key, res.clone()); return res; }).catch(() => hit);
    return hit || net; // stale-while-revalidate
  }));
});
