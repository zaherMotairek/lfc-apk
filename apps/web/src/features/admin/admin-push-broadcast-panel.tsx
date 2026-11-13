import { FormEvent, useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { useFeatureFlags } from '../site/use-feature-flags';
import { useToast } from '../../components/ui/toast-provider';

export function AdminPushBroadcastPanel() {
  const showToast = useToast();
  const { accessToken } = useAuth();
  const { pushEnabled } = useFeatureFlags();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/app/notifications');

  const broadcastMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ message: string; sent?: number; failed?: number; targeted?: number }>(
        '/admin/push/broadcast',
        {
          method: 'POST',
          token: accessToken,
          body: { title: title.trim(), body: body.trim(), url: url.trim() || undefined },
        },
      ),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      setTitle('');
      setBody('');
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Broadcast failed', 'error'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      showToast('Title and message are required.', 'error');
      return;
    }
    if (window.confirm('Send this push to all subscribed devices?')) {
      broadcastMutation.mutate();
    }
  }

  if (!pushEnabled) {
    return (
      <InfoCard>
        <p className="text-sm text-black/55">
          Enable <span className="font-mono text-xs">features.pushEnabled</span> above and configure
          VAPID keys on the server before broadcasting.
        </p>
      </InfoCard>
    );
  }

  return (
    <form onSubmit={onSubmit} className="kop-card mt-6 space-y-4 p-5">
      <h3 className="font-bold text-ink">Committee push broadcast</h3>
      <p className="text-sm text-black/50">
        Sends a web push to every member device that opted in. Also logged in the audit trail.
      </p>
      <label className="block text-sm font-medium">
        Title
        <input className="kop-input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      </label>
      <label className="block text-sm font-medium">
        Message
        <textarea
          className="kop-input mt-1 min-h-[88px]"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
        />
      </label>
      <label className="block text-sm font-medium">
        Open URL (optional)
        <input className="kop-input mt-1 font-mono text-xs" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <button type="submit" className="kop-btn-primary" disabled={broadcastMutation.isPending}>
        {broadcastMutation.isPending ? 'Sending…' : 'Send push'}
      </button>
    </form>
  );
}

function InfoCard({ children }: { children: ReactNode }) {
  return <div className="kop-card mt-6 space-y-2 p-5">{children}</div>;
}
