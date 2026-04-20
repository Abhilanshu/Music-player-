const CACHE_NAME = 'muse-static-v1';
const AUDIO_CACHE = 'muse-audio-vault-v1';
const API_CACHE = 'muse-api-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Audio Vault (MP3/M4A streams)
  // If the request is for an audio file (typically contains .mp3 or .m4a or is from saavncdn audio subdomains)
  if (url.href.includes('.mp3') || url.href.includes('.m4a') || url.hostname.includes('aac.saavncdn.com')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        try {
          const networkResponse = await fetch(request);
          // Cache successful streams
          if (networkResponse.status === 200 || networkResponse.status === 206) {
            // Need to clone before putting in cache
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          console.error('Audio fetch failed (Offline Mode)', error);
          throw error;
        }
      })
    );
    return;
  }

  // 2. API Requests (JioSaavn API)
  if (url.hostname.includes('jiosaavn-api')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          // Network first for APIs
          const networkResponse = await fetch(request);
          if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          // Fallback to cache if offline
          const cachedResponse = await cache.match(request);
          if (cachedResponse) return cachedResponse;
          throw error;
        }
      })
    );
    return;
  }

  // 3. Images (Covers)
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return cachedResponse || fetch(request).then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // 4. Default Static Assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      return cachedResponse || fetch(request);
    })
  );
});
