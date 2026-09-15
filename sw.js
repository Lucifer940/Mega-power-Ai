/* ============================================================
   MEGA POWER AI — service worker (offline-ready PWA)
   NETWORK-FIRST for the app shell: users always get the fresh
   version after an update, cache is the offline fallback.
   AI APIs pass through untouched. Created by Umesh Chaudhary.
   ============================================================ */
'use strict';
const CACHE = 'megapowerai-v1.2';
const SHELL = [
  './', './index.html', './manifest.json',
  './css/style.css',
  './js/core.js', './js/md.js', './js/zip.js', './js/ai.js', './js/auth.js',
  './js/media.js', './js/agent.js', './js/chat.js', './js/code.js', './js/projects.js',
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

  // network first, cache fallback → app updates are never stale-mixed again
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r && r.ok) caches.open(CACHE).then((c) => c.put(e.request, r.clone()));
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: url.pathname.endsWith('/') || url.pathname.endsWith('.html') })
        .then((hit) => hit || caches.match('./index.html')))
  );
});
