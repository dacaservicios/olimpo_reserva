const CACHE = 'olimpo-pwa-v1';
const OFFLINE_URL = '/instalar';

self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(CACHE).then(cache => cache.add(OFFLINE_URL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', evt => {
    evt.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network-first: intenta red, cae a caché si falla
self.addEventListener('fetch', evt => {
    if (evt.request.method !== 'GET') return;

    if (evt.request.mode === 'navigate') {
        evt.respondWith(
            fetch(evt.request).catch(() => caches.match(OFFLINE_URL))
        );
        return;
    }

    evt.respondWith(
        fetch(evt.request).catch(() => caches.match(evt.request))
    );
});
