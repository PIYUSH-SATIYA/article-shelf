// Service worker for PWA installability and Web Share Target support
const CACHE_VERSION = 'shelf-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Handle Web Share Target: when a link is shared to the app,
  // ensure we navigate to the app with the share params
  if (url.searchParams.get('action') === 'share') {
    event.respondWith(
      Response.redirect(url.pathname + url.search, 303)
    );
    return;
  }

  // For all other requests, use network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
