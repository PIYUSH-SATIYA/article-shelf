// Minimal service worker for PWA installability
// All requests (including Web Share Target) pass straight through to the app
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // Network-only: let the browser handle everything normally
});
