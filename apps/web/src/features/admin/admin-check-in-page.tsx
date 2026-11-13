import { FormEvent, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type EventRow = { id: string; title: string; startDateTime: string };

type CheckInResult = {
  result: string;
  message?: string;
  member?: { fullName: string; officialMemberId: string | null };
  attendanceMarked?: boolean;
  guests?: number;
};

export function AdminCheckInPage() {
  const { accessToken } = useAuth();
  const [eventId, setEventId] = useState('');
  const [token, setToken] = useState('');
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

  const eventsQuery = useQuery({
    queryKey: ['admin-events-checkin'],
    queryFn: () => apiRequest<EventRow[]>('/admin/events', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const checkInMutation = useMutation({
    mutationFn: () =>
      apiRequest<CheckInResult>(`/admin/events/${eventId}/check-in`, {
        method: 'POST',
        token: accessToken,
        body: { token: token.trim() },
      }),
    onSuccess: (res) => setLastResult(res),
    onError: (err) =>
      setLastResult({ result: 'ERROR', message: err instanceof Error ? err.message : 'Failed' }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eventId || !token.trim()) return;
    checkInMutation.mutate();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Events"
        title="QR check-in"
        description="Scan or paste a membership card QR token at the door. Marks attendance when the member is registered."
      />

      <form onSubmit={onSubmit} className="kop-card max-w-lg space-y-4 p-5">
        <label className="block text-sm font-medium">
          Event
          <select
            className="kop-input mt-1"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            required
          >
            <option value="">Select event…</option>
            {(eventsQuery.data ?? []).map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.startDateTime).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          QR token
          <input
            className="kop-input mt-1 font-mono text-xs"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste secure token from scanned QR"
            required
          />
        </label>
        <button type="submit" className="kop-btn-primary w-full" disabled={checkInMutation.isPending}>
          Verify & check in
        </button>
      </form>

      {lastResult ? (
        <div className="kop-card max-w-lg p-5">
          <div className="text-xs font-bold uppercase tracking-wide text-black/40">Result</div>
          <div className="mt-2 text-lg font-bold">{lastResult.result}</div>
          {lastResult.member ? (
            <p className="mt-2 text-sm text-black/70">
              {lastResult.member.fullName} · {lastResult.member.officialMemberId ?? '—'}
            </p>
          ) : null}
          {lastResult.attendanceMarked != null ? (
            <p className="mt-2 text-sm text-black/55">
              Attendance marked: {lastResult.attendanceMarked ? 'Yes' : 'No registration'}
              {typeof lastResult.guests === 'number' ? ` · guests ${lastResult.guests}` : ''}
            </p>
          ) : null}
          {lastResult.message ? <p className="mt-2 text-sm text-lfc-red">{lastResult.message}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
