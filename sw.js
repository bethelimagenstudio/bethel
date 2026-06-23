/* Bethel Hair Style — service worker
   Guarda la "cáscara" de la app para que cargue rápido y abra sin conexión.
   NO intercepta las llamadas a Google (script.google.com): esas siempre van a la red. */
const CACHE = 'bethel-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Solo manejamos peticiones del mismo sitio (la app). Google y otros pasan directo.
  if (url.origin !== self.location.origin) return;
  if (e.request.method !== 'GET') return;
  // La página principal: red primero, con respaldo en caché (para tener siempre lo último).
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); return r;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // Recursos estáticos: caché primero.
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
    const copy = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return resp;
  }).catch(() => r)));
});
