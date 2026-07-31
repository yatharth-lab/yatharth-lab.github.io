const CACHE_NAME = "vivah-sutra-v9";

const ASSETS = [
  "/Marriage/",
  "/Marriage/index.html",
  "/Marriage/styles.css",
  "/Marriage/script.js",
  "/Marriage/manifest.json",
  "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js"
];

// Install
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", e => {

  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);

  // Always try network first for app files
  if (
    url.pathname.endsWith("index.html") ||
    url.pathname.endsWith("script.js") ||
    url.pathname.endsWith("styles.css") ||
    url.pathname.endsWith("manifest.json")
  ) {

    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );

    return;
  }

  // Cache First for everything else
  e.respondWith(
    caches.match(e.request).then(cache => {

      if (cache) return cache;

      return fetch(e.request).then(res => {

        if (res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, copy));
        }

        return res;

      });

    })
  );

});
