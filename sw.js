const CACHE_NAME = 'kodfejto-cache-v2';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // A Firestore/Firebase hívásokat mindig a hálózatról kérjük, sosem cache-elve
  if (event.request.url.includes('firestore.googleapis.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('gstatic.com/firebasejs')) {
    return;
  }

  // Network-first: mindig a legfrissebb verziót próbáljuk betölteni, ha van net.
  // Csak akkor esünk vissza a mentett (cache-elt) verzióra, ha nincs internet-kapcsolat.
  // Így egy appfrissítés azonnal érvényesül, nem kell "lefelé húzós" frissítés vagy törlés.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
