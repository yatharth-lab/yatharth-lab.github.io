/* =========================================================
   GAYATRI CHETNA KENDRA
   SERVICE WORKER
   Offline / PWA Support
========================================================= */

const CACHE_NAME =
  "gayatri-chetna-show-all-v99";


/*
  सिर्फ अपनी application की files cache होंगी।
  GitHub API या private repository data को
  Service Worker cache में नहीं रखा जा रहा,
  क्योंकि registration data और photos
  IndexedDB में save हो रहे हैं।
*/

const APP_FILES = [

  "./",

  "./show-all.html",

  "./show-all.js",

  "./sw.js",

  "./logo.png"

];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
  "install",
  event => {

    event.waitUntil(

      caches.open(
        CACHE_NAME
      )
      .then(
        cache =>
          cache.addAll(
            APP_FILES
          )
      )
      .then(
        () =>
          self.skipWaiting()
      )

    );

  }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      caches.keys()
        .then(
          cacheNames => {

            return Promise.all(

              cacheNames
                .filter(
                  name =>
                    name !== CACHE_NAME
                )
                .map(
                  name =>
                    caches.delete(
                      name
                    )
                )

            );

          }
        )
        .then(
          () =>
            self.clients.claim()
        )

    );

  }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
      सिर्फ GET requests
    */

    if (
      request.method !== "GET"
    ) {

      return;

    }


    const url =
      new URL(
        request.url
      );


    /*
      GitHub API को Service Worker
      cache से handle नहीं करना।

      Fresh online data के लिए
      browser सीधे GitHub API को request करेगा।

      Offline data show-all.js की
      IndexedDB से आएगा।
    */

    if (
      url.hostname ===
      "api.github.com"
    ) {

      return;

    }


    /*
      Cross-origin requests को
      भी cache नहीं करना।

      इससे private image/API की
      authentication Service Worker
      cache में नहीं जाएगी।
    */

    if (
      url.origin !==
      self.location.origin
    ) {

      return;

    }


    /*
      Application files:

      Cache First
      ↓
      Cache में है तो तुरंत load
      ↓
      नहीं है तो network
      ↓
      successful response cache
    */

    event.respondWith(

      caches.match(
        request
      )
      .then(
        cachedResponse => {

          if (
            cachedResponse
          ) {

            return cachedResponse;

          }


          return fetch(
            request
          )
          .then(
            networkResponse => {

              /*
                Invalid response को
                cache नहीं करना।
              */

              if (
                !networkResponse ||
                networkResponse.status !== 200 ||
                networkResponse.type !==
                  "basic"
              ) {

                return networkResponse;

              }


              const responseClone =
                networkResponse.clone();


              caches.open(
                CACHE_NAME
              )
              .then(
                cache =>
                  cache.put(
                    request,
                    responseClone
                  )
              );


              return networkResponse;

            }
          );

        }
      )

    );

  }
);


/* =========================================================
   MESSAGE
========================================================= */

self.addEventListener(
  "message",
  event => {

    if (
      event.data ===
      "SKIP_WAITING"
    ) {

      self.skipWaiting();

    }

  }
);
