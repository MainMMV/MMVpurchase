const CACHE = 'mmv-shell-v1';
const PRECACHE = ['/', '/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))),
);
self.addEventListener('activate', (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('mmv-shell-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin)
    return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(
        async () =>
          // Production assets are same-origin and contain no user data. Ignore
          // Vary: Origin, since module requests and install-time requests differ.
          (await caches.match(event.request, { ignoreVary: true })) ||
          (event.request.mode === 'navigate' ? await caches.match('/') : Response.error()),
      ),
  );
});
