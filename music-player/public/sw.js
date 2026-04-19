// Minimal Service Worker to satisfy PWA requirements
const CACHE_NAME = 'muse-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through for all requests
  event.respondWith(fetch(event.request));
});
