const CACHE_NAME = "pae-app-shell-v2";
const BASE_PATH = new URL(self.registration.scope).pathname;
const INDEX_PATH = `${BASE_PATH}index.html`;
const APP_SHELL = [BASE_PATH, INDEX_PATH];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.pathname.startsWith(`${BASE_PATH}api/`)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(INDEX_PATH, copy));
          return response;
        })
        .catch(() => caches.match(INDEX_PATH))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => (
      cached || fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
    ))
  );
});
