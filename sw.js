/* ============================================================
   MEGA POWER AI — service worker (offline-ready PWA)
   App shell cached; AI APIs pass through untouched.
   ============================================================ */
'use strict';
const CACHE = 'megapowerai-v2';
const SHELL = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/core.js', './js/md.js', './js/zip.js', './js/ai.js', './js/auth.js',
  './js/media.js', './js/chat.js', './js/code.js', './js/projects.js',
  './js/github.js', './js/settings.js',
  './assets/icons/icon-192.png', './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png', './assets/icons/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // AI APIs / images: straight to network
  if (e.request.method !== 'GET') return;

  // navigation: network first, cache fallback (offline app)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then((r) => { caches.open(CACHE).then((c) => c.put('./index.html', r.clone())); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }
  // assets: cache first, refresh in background
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
      return r;
    }).catch(() => hit))
  );
});
