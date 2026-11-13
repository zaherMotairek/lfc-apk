import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { useFeatureFlags } from '../site/use-feature-flags';

type PushConfig = {
  publicKey: string | null;
  supported: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationsPanel() {
  const { accessToken } = useAuth();
  const { pushEnabled } = useFeatureFlags();

  const configQuery = useQuery({
    queryKey: ['push-config'],
    queryFn: () => apiRequest<PushConfig>('/notifications/push/config'),
    enabled: pushEnabled,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!configQuery.data?.publicKey) {
        throw new Error('Push is not configured on the server yet (VAPID keys).');
      }
      if (!('Notification' in window)) {
        throw new Error('Notifications are not supported in this browser.');
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission denied.');
      }

      let registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(configQuery.data.publicKey),
      });
      const json = subscription.toJSON();
      return apiRequest<{ message: string }>('/notifications/push/subscribe', {
        method: 'POST',
        token: accessToken,
        body: {
          endpoint: json.endpoint,
          keys: json.keys,
        },
      });
    },
  });

  if (!pushEnabled) {
    return (
      <p className="text-xs text-black/45">
        Web push is turned off in site settings. The committee can enable it when HTTPS and VAPID keys are ready.
      </p>
    );
  }

  return (
    <div className="kop-card p-4">
      <div className="text-sm font-bold">Browser push (beta)</div>
      <p className="mt-1 text-xs text-black/55">
        Get match and event alerts on your phone. Requires HTTPS in production.
      </p>
      <button
        type="button"
        className="kop-btn-secondary mt-3 !text-xs"
        disabled={subscribeMutation.isPending || !configQuery.data?.supported}
        onClick={() => subscribeMutation.mutate()}
      >
        {configQuery.data?.supported ? 'Enable push' : 'Server not configured'}
      </button>
      {subscribeMutation.isSuccess ? (
        <p className="mt-2 text-xs text-pitch">{subscribeMutation.data.message}</p>
      ) : null}
      {subscribeMutation.error ? (
        <p className="mt-2 text-xs text-lfc-red">
          {subscribeMutation.error instanceof Error ? subscribeMutation.error.message : 'Failed'}
        </p>
      ) : null}
    </div>
  );
}
