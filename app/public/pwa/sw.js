self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', evt => {
    if (evt.request.method !== 'GET') return;
    evt.respondWith(
        fetch(evt.request).catch(() => new Response('', { status: 503 }))
    );
});
