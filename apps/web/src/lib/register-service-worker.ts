/**
 * Register the PWA service worker in production (or when VITE_ENABLE_SW=true).
 * Do not unregister on every page load — that breaks web push subscriptions.
 */
export function registerAppServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  const enabled =
    import.meta.env.PROD || String(import.meta.env.VITE_ENABLE_SW ?? '').toLowerCase() === 'true';
  if (!enabled) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              void registration.update();
            }
          });
        });
      })
      .catch(() => undefined);
  });
}
