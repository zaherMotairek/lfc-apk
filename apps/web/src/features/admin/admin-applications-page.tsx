import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type ApplicationStatus = 'PENDING' | 'PAYMENT_CONFIRMED' | 'APPROVED' | 'REJECTED';
type PackageType = 'LIGHT' | 'FULL';

type MembershipApplication = {
  id: string;
  seasonLabel: string;
  fullName: string;
  email: string;
  address: string;
  phoneNumber: string;
  packageType: PackageType;
  previousOlscId?: string | null;
  isOfficialLfcMember: boolean;
  lfcId?: string | null;
  status: ApplicationStatus;
  assignedOlscId?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  rosterStatusCode: string;
  exportOlscId?: string | null;
};

const STATUS_OPTIONS: Array<{ value: ApplicationStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PAYMENT_CONFIRMED', label: 'Payment confirmed' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

function statusBadge(status: ApplicationStatus) {
  if (status === 'APPROVED') return 'kop-badge-green';
  if (status === 'PAYMENT_CONFIRMED') return 'kop-badge-gold';
  if (status === 'REJECTED') return 'kop-badge-red';
  return 'kop-badge';
}

function packageLabel(type: PackageType) {
  return type === 'FULL' ? 'Full ($25)' : 'Light ($10)';
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminApplicationsPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [editing, setEditing] = useState<MembershipApplication | null>(null);
  const [editStatus, setEditStatus] = useState<ApplicationStatus>('PENDING');
  const [editAssignedOlscId, setEditAssignedOlscId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const applicationsQuery = useQuery({
    queryKey: ['admin-membership-applications', statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ seasonLabel: '2026/27' });
      if (statusFilter !== 'ALL') {
        params.set('status', statusFilter);
      }
      return apiRequest<MembershipApplication[]>(
        `/admin/membership-applications?${params.toString()}`,
        { token: accessToken },
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      status: ApplicationStatus;
      assignedOlscId?: string;
      adminNotes?: string;
    }) =>
      apiRequest<MembershipApplication>(`/admin/membership-applications/${payload.id}`, {
        method: 'PUT',
        token: accessToken,
        body: {
          status: payload.status,
          assignedOlscId: payload.assignedOlscId,
          adminNotes: payload.adminNotes,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-membership-applications'] });
      setEditing(null);
      setFeedback('Application updated.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/admin/membership-applications/${id}`, {
        method: 'DELETE',
        token: accessToken,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-membership-applications'] });
      setFeedback('Application deleted.');
    },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (applicationsQuery.data ?? []).filter((item) => {
      if (!query) return true;
      return [
        item.fullName,
        item.email,
        item.phoneNumber,
        item.previousOlscId,
        item.assignedOlscId,
        item.lfcId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [applicationsQuery.data, search]);

  function startEdit(item: MembershipApplication) {
    setEditing(item);
    setEditStatus(item.status);
    setEditAssignedOlscId(item.assignedOlscId ?? item.previousOlscId ?? '');
    setEditNotes(item.adminNotes ?? '');
  }

  function onSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    updateMutation.mutate({
      id: editing.id,
      status: editStatus,
      assignedOlscId: editAssignedOlscId.trim() || undefined,
      adminNotes: editNotes.trim() || undefined,
    });
  }

  async function exportRoster() {
    const params = new URLSearchParams({ seasonLabel: '2026/27' });
    if (statusFilter !== 'ALL') {
      params.set('status', statusFilter);
    }
    const result = await apiRequest<{ filename: string; content: string; count: number }>(
      `/admin/membership-applications/export/roster.csv?${params.toString()}`,
      { token: accessToken },
    );
    downloadCsv(result.filename, result.content);
  }

  async function exportFull() {
    const params = new URLSearchParams({ seasonLabel: '2026/27' });
    if (statusFilter !== 'ALL') {
      params.set('status', statusFilter);
    }
    const result = await apiRequest<{ filename: string; content: string; count: number }>(
      `/admin/membership-applications/export/full.csv?${params.toString()}`,
      { token: accessToken },
    );
    downloadCsv(result.filename, result.content);
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Membership"
        title="Applications 2026/27"
        description="Online membership form submissions — review, assign OLSC IDs, and export to Excel."
        action={
          <div className="flex flex-wrap gap-2">
            <button type="button" className="kop-btn-secondary !text-sm" onClick={() => void exportFull()}>
              Export full CSV
            </button>
            <button type="button" className="kop-btn-primary !text-sm" onClick={() => void exportRoster()}>
              Export Excel roster
            </button>
          </div>
        }
      />

      <div className="kop-card flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <input
          className="kop-input md:max-w-sm"
          placeholder="Search name, email, phone, OLSC/LFC ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="kop-input md:w-56"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'ALL')}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm">
          {feedback}
        </div>
      ) : null}

      {applicationsQuery.isLoading ? (
        <p className="text-black/50">Loading applications…</p>
      ) : null}

      {applicationsQuery.error ? (
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          {applicationsQuery.error instanceof Error
            ? applicationsQuery.error.message
            : 'Unable to load applications.'}
        </div>
      ) : null}

      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="kop-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-ink">{item.fullName}</h2>
                  <span className={statusBadge(item.status)}>{item.status.replaceAll('_', ' ')}</span>
                  <span className="kop-badge">{packageLabel(item.packageType)}</span>
                </div>
                <p className="mt-2 text-sm text-black/55">
                  {item.email} · {item.phoneNumber}
                </p>
                <p className="mt-1 text-sm text-black/45">{item.address}</p>
              </div>
              <div className="text-right text-xs text-black/40">
                Submitted {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <span className="text-black/40">Previous OLSC ID</span>
                <div className="font-semibold">{item.previousOlscId ?? '—'}</div>
              </div>
              <div>
                <span className="text-black/40">Assigned OLSC ID</span>
                <div className="font-semibold">{item.assignedOlscId ?? item.exportOlscId ?? '—'}</div>
              </div>
              <div>
                <span className="text-black/40">LFC member</span>
                <div className="font-semibold">
                  {item.isOfficialLfcMember ? `Yes · ${item.lfcId ?? '—'}` : 'No'}
                </div>
              </div>
              <div>
                <span className="text-black/40">Excel status</span>
                <div className="font-semibold">{item.rosterStatusCode}</div>
              </div>
            </div>

            {item.adminNotes ? (
              <p className="mt-3 rounded-xl bg-black/[0.03] px-3 py-2 text-sm text-black/60">
                {item.adminNotes}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className="kop-btn-secondary !px-4 !py-2 !text-sm" onClick={() => startEdit(item)}>
                Review
              </button>
              <button
                type="button"
                className="rounded-xl border border-lfc-red/20 px-4 py-2 text-sm font-semibold text-lfc-red"
                onClick={() => {
                  if (window.confirm(`Delete application for ${item.fullName}?`)) {
                    deleteMutation.mutate(item.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {!applicationsQuery.isLoading && filtered.length === 0 ? (
          <div className="kop-card p-8 text-center text-black/50">
            No applications yet. Share{' '}
            <a href="/membership/apply" className="font-semibold text-lfc-red">
              /membership/apply
            </a>{' '}
            with members.
          </div>
        ) : null}
      </div>

      {editing ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={onSaveEdit} className="kop-card w-full max-w-lg space-y-4 p-6">
            <div>
              <h2 className="text-lg font-bold">{editing.fullName}</h2>
              <p className="text-sm text-black/50">{editing.email}</p>
            </div>

            <label className="block text-sm font-medium">
              Status
              <select
                className="kop-input mt-1"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ApplicationStatus)}
              >
                {STATUS_OPTIONS.filter((option) => option.value !== 'ALL').map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Assigned OLSC ID (for Excel export)
              <input
                className="kop-input mt-1"
                value={editAssignedOlscId}
                onChange={(e) => setEditAssignedOlscId(e.target.value)}
                placeholder="e.g. 042"
              />
            </label>

            <label className="block text-sm font-medium">
              Admin notes
              <textarea
                className="kop-input mt-1 min-h-24"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </label>

            <div className="flex gap-2">
              <button type="submit" disabled={updateMutation.isPending} className="kop-btn-primary flex-1">
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="kop-btn-secondary flex-1" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
