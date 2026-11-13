/* Minimal service worker — push notifications (Phase 5). */
self.addEventListener('push', (event) => {
  const data = event.data?.json?.() ?? {};
  const title = data.title || 'RedLeb Hub';
  const body = data.body || 'You have a new notification.';
  event.waitUntil(self.registration.showNotification(title, { body, icon: '/pwa-192.svg' }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/app/notifications'));
});
