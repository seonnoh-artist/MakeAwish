const CACHE_NAME = 'my-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './app.js',
  './libraries/p5.min.js',
  './libraries/p5.sound.min.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './data/shootingStar_bk.jpg',
  './data/star0.png',
  './data/star1.png',
  './data/star2.png',
  './data/star3.png',
  './data/star4.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        return response || fetch(event.request);
      })
  );
});