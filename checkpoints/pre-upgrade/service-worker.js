// Sculpt v2 service worker.
// Caches only same-origin static app-shell assets. Never caches /api/*,
// never caches non-GET requests, never caches cross-origin requests, and
// never falls back to index.html for API requests (so a failed AI parse
// call surfaces as a real network error, not a stale HTML page).

const CACHE = 'sculpt-v2';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // Only GET requests are cache-eligible.
  if (req.method !== 'GET') return;

  // Never touch the API — always go straight to the network, no cache, no
  // offline HTML fallback. Let the failure surface to the caller.
  if (url.pathname.startsWith('/api/')) return;

  // Never cache cross-origin requests.
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => {
          // Only fall back to the app shell for same-origin navigations,
          // never for arbitrary same-origin GETs (e.g. would be wrong for
          // a same-origin API in the future).
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
    })
  );
});
