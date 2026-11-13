import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import {
  isDatetimeLocalInPast,
  minDatetimeLocal,
  startUnchangedForMin,
} from '../../lib/datetime-local';
import { PageHeader } from '../../components/ui/page-header';
import { useConfirm } from '../../components/ui/confirm-provider';
import { EventInvitationShare } from './event-invitation-share';

type AdminEventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  capacity?: number | null;
  registrationOpen?: boolean;
  _count?: { registrations: number };
};

type EventRegistration = {
  id: string;
  status: string;
  registeredAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
};

const EMPTY_FORM = {
  title: '',
  description: '',
  location: '',
  startDateTime: '',
  capacity: '',
  registrationOpen: true,
};

function formatDate(d: string) {
  return new Date(d).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function AdminEventsPage() {
  const { accessToken } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOriginalStart, setEditOriginalStart] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const eventsQuery = useQuery({
    queryKey: ['admin-events'],
    queryFn: () => apiRequest<AdminEventItem[]>('/admin/events', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const registrationsQuery = useQuery({
    queryKey: ['admin-event-registrations', selectedEventId],
    queryFn: () =>
      apiRequest<EventRegistration[]>(`/admin/events/${selectedEventId}/registrations`, {
        token: accessToken,
      }),
    enabled: Boolean(selectedEventId && accessToken),
  });

  const selectedEvent = useMemo(
    () => eventsQuery.data?.find((e) => e.id === selectedEventId) ?? null,
    [eventsQuery.data, selectedEventId],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/admin/events/${id}`, {
        method: 'DELETE',
        token: accessToken,
      }),
    onSuccess: (res, deletedId) => {
      setMessage(res.message);
      if (selectedEventId === deletedId) setSelectedEventId(null);
      if (editingId === deletedId) closeForm();
      void queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : 'Delete failed'),
  });

  useEffect(() => {
    if (!selectedEventId && eventsQuery.data?.length) {
      setSelectedEventId(eventsQuery.data[0].id);
    }
  }, [eventsQuery.data, selectedEventId]);

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setEditOriginalStart(null);
    setForm(EMPTY_FORM);
  }

  function startCreate() {
    setEditingId(null);
    setEditOriginalStart(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setMessage(null);
  }

  function startEdit(item: AdminEventItem) {
    const startLocal = toDatetimeLocal(item.startDateTime);
    setEditingId(item.id);
    setEditOriginalStart(startLocal);
    setSelectedEventId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      location: item.location,
      startDateTime: startLocal,
      capacity: item.capacity ? String(item.capacity) : '',
      registrationOpen: item.registrationOpen ?? true,
    });
    setShowForm(true);
    setMessage(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const startUnchanged = Boolean(editingId && editOriginalStart === form.startDateTime);
    if (isDatetimeLocalInPast(form.startDateTime) && !startUnchanged) {
      setMessage('Event date must be today or later.');
      return;
    }
    setSaving(true);
    try {
      const baseBody = {
        title: form.title,
        description: form.description,
        location: form.location,
        startDateTime: new Date(form.startDateTime).toISOString(),
        capacity: form.capacity ? Number(form.capacity) : undefined,
      };
      const res = editingId
        ? await apiRequest<{ message: string }>(`/admin/events/${editingId}`, {
            method: 'PUT',
            token: accessToken,
            body: { ...baseBody, registrationOpen: form.registrationOpen },
          })
        : await apiRequest<{ message: string }>('/admin/events', {
            method: 'POST',
            token: accessToken,
            body: baseBody,
          });
      setMessage(res.message);
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['admin-events'] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    if (!registrationsQuery.data?.length || !selectedEvent) return;
    const header = ['Full Name', 'Email', 'Status', 'Guests', 'Guest names', 'Registered At'];
    const rows = registrationsQuery.data.map((r) => [
      `${r.user.firstName} ${r.user.lastName}`,
      r.user.email,
      r.status,
      String((r as { guestCount?: number }).guestCount ?? 0),
      (r as { guestNames?: string | null }).guestNames ?? '',
      new Date(r.registeredAt).toLocaleString(),
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEvent.title.replaceAll(/[^a-z0-9]+/gi, '-').toLowerCase()}-registrations.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function askDelete(item: AdminEventItem) {
    const ok = await confirm({
      title: 'Delete event',
      message: `Delete "${item.title}"? All registrations will also be deleted. This cannot be undone.`,
      danger: true,
      confirmLabel: 'Delete',
    });
    if (ok) deleteMutation.mutate(item.id);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Events"
        description="Create, edit or delete watch parties and community activities."
        action={
          <button
            type="button"
            className={showForm ? 'kop-btn-secondary' : 'kop-btn-primary'}
            onClick={() => (showForm ? closeForm() : startCreate())}
          >
            {showForm ? 'Close' : '+ New event'}
          </button>
        }
      />

      {message ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
          {message}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={onSubmit} className="kop-card grid gap-4 p-5 md:grid-cols-2">
          <h2 className="font-bold md:col-span-2">{editingId ? 'Edit event' : 'New event'}</h2>
          <label className="block text-sm font-medium md:col-span-2">
            Title
            <input className="kop-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
          </label>
          <label className="block text-sm font-medium md:col-span-2">
            Description
            <textarea className="kop-input min-h-24" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
          </label>
          <label className="block text-sm font-medium">
            Location
            <input className="kop-input" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} required />
          </label>
          <label className="block text-sm font-medium">
            Date & time
            <input
              type="datetime-local"
              className="kop-input"
              min={
                startUnchangedForMin(form.startDateTime, editOriginalStart)
                  ? undefined
                  : minDatetimeLocal()
              }
              value={form.startDateTime}
              onChange={(e) => setForm((p) => ({ ...p, startDateTime: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Capacity (optional)
            <input type="number" min={1} className="kop-input" value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))} />
          </label>
          <label className="flex items-center gap-2 self-end text-sm font-medium">
            <input
              type="checkbox"
              checked={form.registrationOpen}
              onChange={(e) => setForm((p) => ({ ...p, registrationOpen: e.target.checked }))}
            />
            Registrations open
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button type="submit" className="kop-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create event'}
            </button>
            {editingId ? (
              <button type="button" className="kop-btn-secondary" onClick={closeForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="space-y-3">
          <div>
            <h2 className="text-base font-bold">Events list</h2>
            <p className="mt-1 text-sm text-black/50">Tap an event to see registrations. Use Edit to change it.</p>
          </div>

          {eventsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="kop-card animate-pulse p-5">
                  <div className="h-4 w-2/3 rounded bg-black/5" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-black/5" />
                </div>
              ))}
            </div>
          ) : null}

          {!eventsQuery.isLoading && !eventsQuery.data?.length ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-surface px-5 py-10 text-center text-sm text-black/50">
              No events yet.
            </div>
          ) : null}

          {(eventsQuery.data ?? []).map((event) => (
            <div
              key={event.id}
              className={`kop-card overflow-hidden transition ${selectedEventId === event.id ? 'ring-2 ring-lfc-red/30' : ''}`}
            >
              <button
                type="button"
                onClick={() => setSelectedEventId(event.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-ink">{event.title}</div>
                    <div className="mt-1 text-sm text-black/55">
                      {event.location} · {formatDate(event.startDateTime)}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold text-ink">{event._count?.registrations ?? 0} registered</div>
                    <div className="text-black/45">
                      {event.capacity ? `${event.capacity} spots` : 'No limit'}
                    </div>
                  </div>
                </div>
              </button>
              <div className="flex justify-end gap-2 border-t border-black/5 px-5 py-3">
                <button
                  type="button"
                  className="kop-btn-secondary !py-1.5 !text-xs"
                  onClick={() => startEdit(event)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="kop-btn-secondary !border-lfc-red/20 !py-1.5 !text-xs !text-lfc-red hover:!bg-lfc-red/5"
                  onClick={() => askDelete(event)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="kop-card sticky top-20 h-fit space-y-4 p-5">
          {selectedEvent ? (
            <>
              <div>
                <h2 className="font-bold text-ink">{selectedEvent.title}</h2>
                <p className="mt-1 text-sm text-black/55">
                  {selectedEvent.location} · {formatDate(selectedEvent.startDateTime)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Registered', registrationsQuery.data?.filter((r) => r.status === 'REGISTERED').length ?? 0],
                  ['Waitlist', registrationsQuery.data?.filter((r) => r.status === 'WAITLISTED').length ?? 0],
                  ['Total', registrationsQuery.data?.length ?? 0],
                ].map(([label, val]) => (
                  <div key={label} className="stat-pill">
                    <div className="stat-pill-label">{label}</div>
                    <div className="stat-pill-value">{val}</div>
                  </div>
                ))}
              </div>

              <EventInvitationShare event={selectedEvent} />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="kop-btn-secondary flex-1 !py-2 !text-sm"
                  onClick={() => startEdit(selectedEvent)}
                >
                  Edit event
                </button>
                <button
                  type="button"
                  onClick={exportCsv}
                  disabled={!registrationsQuery.data?.length}
                  className="kop-btn-secondary flex-1 !py-2 !text-sm"
                >
                  Export CSV
                </button>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {(registrationsQuery.data ?? []).map((r) => (
                  <div key={r.id} className="rounded-xl border border-black/8 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold">
                          {r.user.firstName} {r.user.lastName}
                        </div>
                        <div className="text-xs text-black/45">{r.user.email}</div>
                      </div>
                      <span className="kop-badge text-[10px]">{r.status}</span>
                    </div>
                  </div>
                ))}
                {registrationsQuery.isLoading ? (
                  <p className="text-sm text-black/45">Loading…</p>
                ) : null}
                {!registrationsQuery.isLoading && !registrationsQuery.data?.length ? (
                  <p className="text-sm text-black/45">No registrations yet.</p>
                ) : null}
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-black/45">Select an event to see registrations.</p>
          )}
        </div>
      </div>
    </section>
  );
}
