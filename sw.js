/* PetCare+ Service Worker
   Estratégia: network-first com fallback para cache.
   Sempre tenta puxar a versão mais nova; se offline, usa cache.
   Não interfere com requisições externas (Unsplash etc). */

const CACHE = 'petcare-v1';
const ASSETS = [
  './',
  './petcare.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png',
  './favicon-32.png',
  './favicon-16.png',
  './favicon.ico'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // allSettled: se algum asset faltar, não derruba a instalação inteira
      Promise.allSettled(ASSETS.map(a => c.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Só intercepta same-origin (não mexe em fotos do Unsplash etc)
  if (url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(r => r || caches.match('./petcare.html'))
      )
  );
});
