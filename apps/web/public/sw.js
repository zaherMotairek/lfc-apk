/* Minimal service worker — push notifications (Phase 5). */
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
    fetch(event.request).catch(() =>
      fetch('/offline.html').then((res) => res || new Response('Offline', { status: 503 })),
    ),
  );
});
