const CACHE_NAME = 'too-hungry-last-drop-v158';
const ROOT = new URL('./', self.location.href);
const SHELL = [
  '',
  'index.html',
  'game.js',
  'manifest.webmanifest',
  'assets/icons/app-icon.svg',
  'assets/icons/app-icon-192.png',
  'assets/icons/app-icon-512.png'
].map(path => new URL(path, ROOT).href);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(
    names.filter(name => name.startsWith('too-hungry-last-drop-') && name !== CACHE_NAME)
      .map(name => caches.delete(name))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || request.headers.has('range')) return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(new URL('index.html', ROOT).href))));
    return;
  }

  event.respondWith(caches.match(request).then(cached => {
    if (cached) return cached;
    return fetch(request).then(response => {
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    });
  }));
});
