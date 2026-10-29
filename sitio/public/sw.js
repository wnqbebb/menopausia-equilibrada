// Service worker sencillo: la app abre sin conexión. Nunca guarda en caché /api/.
const CACHE = 'me-v4-2';
const IMGS = 'me-img-v1'; // páginas de libros e imágenes: no cambian, se sirven desde el caché
const ASSETS = ['/', '/index.html', '/app.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== IMGS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/oferta') || url.pathname.startsWith('/entrega-')) return;
  if (url.origin === location.origin && /^\/(plena\/libros|plena\/img|oferta\/img|img)\//.test(url.pathname)) {
    e.respondWith(caches.open(IMGS).then((c) => c.match(e.request).then((r) => r || fetch(e.request).then((res) => { if (res && res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  if (url.origin === location.origin) {
    // Red primero (para tener siempre la última versión), caché si no hay conexión.
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
        return res;
      }).catch(() => caches.match(e.request).then((r) => r || caches.match('/index.html')))
    );
  } else if (/(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/.test(url.hostname)) {
    // Fuentes y librería QR: caché primero. (Los PDF del CDN no se guardan aquí.)
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    })));
  }
});
