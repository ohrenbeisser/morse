/**
 * CW-Dilettant Service Worker
 * Ermöglicht Offline-Funktionalität der PWA
 */

const CACHE_NAME = 'cw-dilettant-v24';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/router.js',
    '/js/morse.js',
    '/js/koch.js',
    '/js/zusatz.js',
    '/js/erkennen.js',
    '/js/geben.js',
    '/js/scope.js',
    '/js/phonetic.js',
    '/js/speaker.js',
    '/data/zusatzlektionen.json',
    '/lib/fonts/MaterialIcons-Regular.woff2',
    '/lib/fonts/roboto-300.woff2',
    '/lib/fonts/roboto-400.woff2',
    '/lib/fonts/roboto-500.woff2',
    '/lib/fonts/roboto-700.woff2',
    '/lib/fonts/RobotoMono-Regular.woff2',
    '/icons/icon-72.png',
    '/icons/icon-96.png',
    '/icons/icon-128.png',
    '/icons/icon-144.png',
    '/icons/icon-152.png',
    '/icons/icon-192.png',
    '/icons/icon-384.png',
    '/icons/icon-512.png'
];

// Installation - Cache alle statischen Assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching app shell');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[ServiceWorker] Skip waiting');
                return self.skipWaiting();
            })
    );
});

// Aktivierung - Lösche alte Caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[ServiceWorker] Claiming clients');
                return self.clients.claim();
            })
    );
});

// Fetch - Cache-First Strategie für statische Assets
self.addEventListener('fetch', (event) => {
    // Nur GET-Requests cachen
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Wenn im Cache, direkt zurückgeben
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Sonst vom Netzwerk holen und cachen
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Nur erfolgreiche Responses cachen
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Response klonen (kann nur einmal gelesen werden)
                        const responseToCache = networkResponse.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline-Fallback für HTML-Seiten
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Nachricht empfangen (z.B. für Cache-Update)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    // Cache komplett löschen
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    console.log('[ServiceWorker] Clearing cache:', cacheName);
                    return caches.delete(cacheName);
                })
            );
        }).then(() => {
            console.log('[ServiceWorker] All caches cleared');
            // Client informieren
            if (event.source) {
                event.source.postMessage({ type: 'CACHE_CLEARED' });
            }
        });
    }
});
