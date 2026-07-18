const CACHE_NAME = 'vivah-sutra-v8';
const ASSETS_TO_CACHE = [
    '/Marriage/',
    '/Marriage/index.html',
    '/Marriage/styles.css',
    '/Marriage/script.js',
    '/Marriage/manifest.json',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js'
];

// Install - Cache all assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Caching assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch((err) => console.log('Cache error:', err))
    );
    self.skipWaiting();
});

// Activate - Delete old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch - Cache first, then network
self.addEventListener('fetch', (event) => {
    // Skip IndexedDB requests
    if (event.request.url.includes('indexedDB') || 
        event.request.url.includes('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached response if found
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Check if valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone and cache the new response
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Offline fallback
                        if (event.request.mode === 'navigate') {
                            return caches.match('/Marriage/index.html');
                        }
                    });
            })
    );
});
