self.addEventListener('install', (event) => {
  // Prêt pour activer dès que possible.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open('triply-v1');
      const cached = await cache.match(req);
      if (cached) return cached;

      try {
        const res = await fetch(req);
        if (res && res.ok) {
          cache.put(req, res.clone());
        }
        return res;
      } catch {
        // Fallback : si rien en cache, on renvoie l’erreur réseau.
        throw new Error('Network error and no cached response available');
      }
    })()
  );
});

