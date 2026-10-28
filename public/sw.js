/* Service Worker — Jastip Center PWA
 *
 * Strategi:
 * - App shell (HTML/JS/CSS/ikon) → cache-first, agar app bisa dibuka cepat
 *   dan tetap tampil saat koneksi jelek.
 * - Request API (backend, origin berbeda) → TIDAK di-cache (network only),
 *   supaya data selalu segar dan tidak ada data basi.
 *
 * Naikkan CACHE_VERSION setiap kali build agar cache lama dibuang.
 */
const CACHE_VERSION = 'jastip-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(cache => cache.addAll(APP_SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  // Hanya tangani GET.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Request ke origin lain (backend API) → langsung ke jaringan, jangan cache.
  if (url.origin !== self.location.origin) return;

  // Navigasi halaman → network-first, fallback ke app shell (offline).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches
            .open(CACHE_VERSION)
            .then(cache => cache.put('/index.html', copy))
            .catch(() => undefined);
          return response;
        })
        .catch(() => caches.match('/index.html').then(r => r || Response.error())),
    );
    return;
  }

  // Aset statis same-origin → cache-first.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request)
        .then(response => {
          // Simpan hanya respons sukses & same-origin.
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches
              .open(CACHE_VERSION)
              .then(cache => cache.put(request, copy))
              .catch(() => undefined);
          }
          return response;
        })
        .catch(() => cached || Response.error());
    }),
  );
});
