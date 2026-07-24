/* Service Worker d'Éclose — permet le fonctionnement hors-ligne */
const CACHE = 'eclose-v7';
const FICHIERS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

/* Installation : on met tous les fichiers de l'app en cache */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting())
  );
});

/* Activation : on supprime les anciens caches (anciennes versions) */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) =>
      Promise.all(cles.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Requêtes : "network-first" pour la navigation (avoir la dernière version),
   "cache-first" pour le reste (icônes, etc.). Toujours un repli sur le cache
   quand il n'y a pas de connexion. */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copie = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copie));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cache) => cache || fetch(req).then((res) => {
      const copie = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copie));
      return res;
    }).catch(() => cache))
  );
});
