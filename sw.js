// ============================================================
// sw.js — minimal offline app-shell cache for the Nexus PWA.
// Strategy: cache-first for same-origin files, network passthrough
// for everything else (CDN libraries, external links).
// ============================================================

const CACHE_NAME = 'nexus-shell-v1';

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/style.css',
  './css/components.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/utils/storage.js',
  './js/utils/helpers.js',
  './js/utils/date.js',
  './js/utils/i18n.js',
  './js/components/sidebar.js',
  './js/components/modal.js',
  './js/components/toast.js',
  './js/components/taskModal.js',
  './js/components/taskCard.js',
  './js/components/state.js',
  './js/views/dashboard.js',
  './js/views/kanban.js',
  './js/views/notes.js',
  './js/views/calendar.js',
  './js/views/settings.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let CDN requests pass through normally

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
