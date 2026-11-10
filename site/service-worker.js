const CACHE_NAME = 'too-hungry-last-drop-v168';
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

async function respondWithCachedAudioRange(request, url) {
  const match = request.headers.get('range')?.trim().match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || (!match[1] && !match[2])) return fetch(request);

  const cache = await caches.open(CACHE_NAME);
  let fullResponse = await cache.match(url.href);
  if (!fullResponse) {
    fullResponse = await fetch(url.href);
    if (!fullResponse.ok || fullResponse.type !== 'basic') return fetch(request);
    await cache.put(url.href, fullResponse.clone()).catch(() => {});
  }

  const bytes = await fullResponse.arrayBuffer();
  const length = bytes.byteLength;

  let start;
  let end;
  if (!match[1]) {
    const suffixLength = Number(match[2]);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) start = length;
    else start = Math.max(length - suffixLength, 0);
    end = length - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : length - 1;
  }

  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= length || start > end) {
    return new Response(null, {
      status: 416,
      statusText: 'Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${length}`, 'Accept-Ranges': 'bytes' }
    });
  }

  end = Math.min(end, length - 1);
  const headers = new Headers(fullResponse.headers);
  headers.delete('content-encoding');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Range', `bytes ${start}-${end}/${length}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(bytes.slice(start, end + 1), {
    status: 206,
    statusText: 'Partial Content',
    headers
  });
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.headers.has('range')) {
    if (/\.mp3$/i.test(url.pathname) && !request.headers.has('if-range')) {
      event.respondWith(respondWithCachedAudioRange(request, url));
    }
    return;
  }

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
