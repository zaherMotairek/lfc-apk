/* RedLeb Hub PWA — push + offline shell. Bump CACHE when offline assets change. */
const CACHE = 'redleb-static-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/pwa-192.svg'])).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title || 'RedLeb Hub';
  const body = data.body || 'You have a new notification.';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/pwa-192.svg',
      data: { url: data.url || '/app/notifications' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) || '/app/notifications';
  event.waitUntil(clients.openWindow(target));
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(OFFLINE_URL);
      if (cached) return cached;
      return fetch(OFFLINE_URL);
    }),
  );
});
