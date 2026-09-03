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

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: 'Pending',
  PAYMENT_CONFIRMED: 'Paid',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

function statusBadge(status: ApplicationStatus) {
  if (status === 'APPROVED') return 'kop-badge-green';
  if (status === 'PAYMENT_CONFIRMED') return 'kop-badge-gold';
  if (status === 'REJECTED') return 'kop-badge-red';
  return 'kop-badge';
}

function packageShort(type: PackageType) {
  return type === 'FULL' ? 'Full $25' : 'Light $10';
}

function displayOlscId(item: MembershipApplication) {
  return item.assignedOlscId ?? item.previousOlscId ?? '';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}


function whatsappLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : undefined;
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
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('PENDING');
  const [packageFilter, setPackageFilter] = useState<PackageType | 'ALL'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<MembershipApplication | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [olscDrafts, setOlscDrafts] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const applicationsQuery = useQuery({
    queryKey: ['admin-membership-applications'],
    queryFn: () =>
      apiRequest<MembershipApplication[]>(
        '/admin/membership-applications?seasonLabel=2026/27',
        { token: accessToken },
      ),
  });

  const allItems = applicationsQuery.data ?? [];

  const counts = useMemo(() => {
    return {
      total: allItems.length,
      pending: allItems.filter((item) => item.status === 'PENDING').length,
      paid: allItems.filter((item) => item.status === 'PAYMENT_CONFIRMED').length,
      approved: allItems.filter((item) => item.status === 'APPROVED').length,
      full: allItems.filter((item) => item.packageType === 'FULL').length,
      light: allItems.filter((item) => item.packageType === 'LIGHT').length,
    };
  }, [allItems]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allItems.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (packageFilter !== 'ALL' && item.packageType !== packageFilter) return false;
      if (!query) return true;
      return [
        item.fullName,
        item.email,
        item.phoneNumber,
        item.address,
        item.previousOlscId,
        item.assignedOlscId,
        item.lfcId,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [allItems, search, statusFilter, packageFilter]);

  const updateMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      status?: ApplicationStatus;
      assignedOlscId?: string;
      adminNotes?: string;
    }) =>
      apiRequest<MembershipApplication>(`/admin/membership-applications/${payload.id}`, {
        method: 'PUT',
        token: accessToken,
        body: {
          ...(payload.status ? { status: payload.status } : {}),
          ...(payload.assignedOlscId !== undefined ? { assignedOlscId: payload.assignedOlscId } : {}),
          ...(payload.adminNotes !== undefined ? { adminNotes: payload.adminNotes } : {}),
        },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-membership-applications'] });
      setOlscDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.id];
        return next;
      });
      setFeedback('Saved.');
      window.setTimeout(() => setFeedback(null), 2000);
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
      setFeedback('Deleted.');
    },
  });

  function quickStatus(id: string, status: ApplicationStatus) {
    updateMutation.mutate({ id, status });
  }

  function saveOlscId(item: MembershipApplication) {
    const draft = olscDrafts[item.id];
    if (draft === undefined) return;
    updateMutation.mutate({
      id: item.id,
      assignedOlscId: draft.trim(),
    });
  }

  function onSaveNotes(event: FormEvent) {
    event.preventDefault();
    if (!editingNotes) return;
    updateMutation.mutate({
      id: editingNotes.id,
      adminNotes: editNotes.trim(),
    });
    setEditingNotes(null);
  }

  async function exportRoster() {
    const params = new URLSearchParams({ seasonLabel: '2026/27' });
    if (statusFilter !== 'ALL') params.set('status', statusFilter);
    const result = await apiRequest<{ filename: string; content: string; count: number }>(
      `/admin/membership-applications/export/roster.csv?${params.toString()}`,
      { token: accessToken },
    );
    downloadCsv(result.filename, result.content);
  }

  function ApplicationRow({ item }: { item: MembershipApplication }) {
    const olscValue = olscDrafts[item.id] ?? displayOlscId(item);
    const expanded = expandedId === item.id;
    const wa = whatsappLink(item.phoneNumber);

    return (
      <>
        <tr className="border-b border-black/5 align-middle hover:bg-black/[0.02]">
          <td className="px-3 py-3">
            <button
              type="button"
              className="text-left"
              onClick={() => setExpandedId(expanded ? null : item.id)}
            >
              <div className="font-semibold text-ink">{item.fullName}</div>
              <div className="text-xs text-black/40">{formatDate(item.createdAt)}</div>
            </button>
          </td>
          <td className="px-3 py-3">
            <div className="font-medium">{item.phoneNumber}</div>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-lfc-red"
              >
                WhatsApp
              </a>
            ) : null}
          </td>
          <td className="px-3 py-3">
            <span className={item.packageType === 'FULL' ? 'kop-badge-red' : 'kop-badge'}>
              {item.rosterStatusCode}
            </span>
            <div className="mt-1 text-xs text-black/45">{packageShort(item.packageType)}</div>
          </td>
          <td className="px-3 py-3">
            <div className="flex min-w-[88px] items-center gap-1">
              <input
                className="kop-input !mt-0 !px-2 !py-1.5 !text-sm"
                value={olscValue}
                placeholder="ID"
                onChange={(e) =>
                  setOlscDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveOlscId(item);
                }}
              />
              {olscDrafts[item.id] !== undefined && olscDrafts[item.id] !== displayOlscId(item) ? (
                <button
                  type="button"
                  className="rounded-lg bg-lfc-red px-2 py-1.5 text-xs font-bold text-white"
                  onClick={() => saveOlscId(item)}
                >
                  OK
                </button>
              ) : null}
            </div>
          </td>
          <td className="px-3 py-3 font-semibold">{item.lfcId ?? '—'}</td>
          <td className="px-3 py-3">
            <span className={statusBadge(item.status)}>{STATUS_LABELS[item.status]}</span>
          </td>
          <td className="px-3 py-3">
            <div className="flex flex-wrap gap-1">
              {item.status === 'PENDING' ? (
                <button
                  type="button"
                  className="rounded-lg bg-amber-100 px-2 py-1 text-xs font-bold text-amber-900"
                  onClick={() => quickStatus(item.id, 'PAYMENT_CONFIRMED')}
                >
                  Mark paid
                </button>
              ) : null}
              {item.status !== 'APPROVED' ? (
                <button
                  type="button"
                  className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-900"
                  onClick={() => quickStatus(item.id, 'APPROVED')}
                >
                  Approve
                </button>
              ) : null}
              {item.status !== 'REJECTED' ? (
                <button
                  type="button"
                  className="rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold text-black/55"
                  onClick={() => quickStatus(item.id, 'REJECTED')}
                >
                  Reject
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-lg border border-black/10 px-2 py-1 text-xs font-semibold text-black/55"
                onClick={() => {
                  setEditingNotes(item);
                  setEditNotes(item.adminNotes ?? '');
                }}
              >
                Note
              </button>
            </div>
          </td>
        </tr>
        {expanded ? (
          <tr className="border-b border-black/5 bg-black/[0.02]">
            <td colSpan={7} className="px-3 py-4 text-sm text-black/65">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-black/35">Email</div>
                  <a href={`mailto:${item.email}`} className="font-medium text-ink">
                    {item.email}
                  </a>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-black/35">Address</div>
                  <div>{item.address}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-black/35">LFC member</div>
                  <div>{item.isOfficialLfcMember ? `Yes · ${item.lfcId ?? '—'}` : 'No'}</div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-black/35">Previous OLSC ID</div>
                  <div>{item.previousOlscId ?? 'New member'}</div>
                </div>
              </div>
              {item.adminNotes ? (
                <p className="mt-3 rounded-xl bg-white px-3 py-2 text-black/60">{item.adminNotes}</p>
              ) : null}
              <div className="mt-3">
                <button
                  type="button"
                  className="text-xs font-semibold text-lfc-red"
                  onClick={() => {
                    if (window.confirm(`Delete ${item.fullName}?`)) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                >
                  Delete application
                </button>
              </div>
            </td>
          </tr>
        ) : null}
      </>
    );
  }

  function ApplicationCard({ item }: { item: MembershipApplication }) {
    const olscValue = olscDrafts[item.id] ?? displayOlscId(item);
    const wa = whatsappLink(item.phoneNumber);

    return (
      <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-extrabold text-ink">{item.fullName}</div>
            <div className="mt-1 text-sm text-black/55">{item.phoneNumber}</div>
            <div className="mt-1 text-xs text-black/40">{formatDate(item.createdAt)}</div>
          </div>
          <span className={statusBadge(item.status)}>{STATUS_LABELS[item.status]}</span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-black/35">Package</div>
            <div className="font-semibold">
              {item.rosterStatusCode} · {packageShort(item.packageType)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-black/35">LFC ID</div>
            <div className="font-semibold">{item.lfcId ?? '—'}</div>
          </div>
        </div>

        <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-black/35">
          OLSC ID
          <div className="mt-1 flex gap-2">
            <input
              className="kop-input !mt-0 flex-1 !py-2 !text-sm"
              value={olscValue}
              placeholder="e.g. 042"
              onChange={(e) =>
                setOlscDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
              }
            />
            <button type="button" className="kop-btn-secondary !px-3 !py-2 !text-xs" onClick={() => saveOlscId(item)}>
              Save
            </button>
          </div>
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          {item.status === 'PENDING' ? (
            <button
              type="button"
              className="rounded-lg bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900"
              onClick={() => quickStatus(item.id, 'PAYMENT_CONFIRMED')}
            >
              Mark paid
            </button>
          ) : null}
          {item.status !== 'APPROVED' ? (
            <button
              type="button"
              className="rounded-lg bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-900"
              onClick={() => quickStatus(item.id, 'APPROVED')}
            >
              Approve
            </button>
          ) : null}
          {wa ? (
            <a href={wa} target="_blank" rel="noreferrer" className="kop-btn-secondary !px-3 !py-2 !text-xs">
              WhatsApp
            </a>
          ) : null}
          <a href={`mailto:${item.email}`} className="kop-btn-secondary !px-3 !py-2 !text-xs">
            Email
          </a>
        </div>

        <details className="mt-3 text-sm text-black/60">
          <summary className="cursor-pointer font-semibold text-ink">More details</summary>
          <p className="mt-2">{item.email}</p>
          <p className="mt-1">{item.address}</p>
          {item.adminNotes ? <p className="mt-2 rounded-xl bg-black/[0.03] p-2">{item.adminNotes}</p> : null}
        </details>
      </article>
    );
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Membership"
        title="Applications 2026/27"
        description="Form submissions arrive here automatically — mark paid, assign OLSC ID, export Excel."
        action={
          <button type="button" className="kop-btn-primary !text-sm" onClick={() => void exportRoster()}>
            Download Excel
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            ['ALL', 'All', counts.total],
            ['PENDING', 'Pending', counts.pending],
            ['PAYMENT_CONFIRMED', 'Paid', counts.paid],
            ['APPROVED', 'Approved', counts.approved],
            ['FULL', 'Full', counts.full],
            ['LIGHT', 'Light', counts.light],
          ] as const
        ).map(([key, label, count]) => {
          const isPackage = key === 'FULL' || key === 'LIGHT';
          const active = isPackage
            ? packageFilter === key && statusFilter === 'ALL'
            : statusFilter === key && packageFilter === 'ALL';
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (isPackage) {
                  setPackageFilter(key);
                  setStatusFilter('ALL');
                } else {
                  setStatusFilter(key);
                  setPackageFilter('ALL');
                }
              }}
              className={`stat-pill text-left transition ${
                active ? 'ring-2 ring-lfc-red/30 bg-lfc-red/5' : 'hover:bg-black/[0.03]'
              }`}
            >
              <div className="stat-pill-value">{count}</div>
              <div className="stat-pill-label">{label}</div>
            </button>
          );
        })}
      </div>

      <div className="kop-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <input
          className="kop-input flex-1 !mt-0"
          placeholder="Search name, phone, email, OLSC/LFC ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="text-sm text-black/45">
          {filtered.length} shown · {counts.pending} waiting for payment
        </div>
      </div>

      {feedback ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {feedback}
        </div>
      ) : null}

      {applicationsQuery.isLoading ? <p className="text-black/50">Loading…</p> : null}

      {applicationsQuery.error ? (
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          {applicationsQuery.error instanceof Error
            ? applicationsQuery.error.message
            : 'Unable to load applications.'}
        </div>
      ) : null}

      {!applicationsQuery.isLoading && filtered.length === 0 ? (
        <div className="kop-card p-8 text-center text-black/50">
          {counts.total === 0 ? (
            <>
              No applications yet. Share{' '}
              <a href="/membership/apply" className="font-semibold text-lfc-red">
                /membership/apply
              </a>
            </>
          ) : (
            'No applications match this filter.'
          )}
        </div>
      ) : null}

      <div className="grid gap-3 md:hidden">
        {filtered.map((item) => (
          <ApplicationCard key={item.id} item={item} />
        ))}
      </div>

      <div className="kop-card hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-black/[0.03]">
            <tr>
              <th className="px-3 py-3">Name</th>
              <th className="px-3 py-3">Phone</th>
              <th className="px-3 py-3">Package</th>
              <th className="px-3 py-3">OLSC ID</th>
              <th className="px-3 py-3">LFC ID</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <ApplicationRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
        <p className="border-t border-black/5 px-3 py-2 text-xs text-black/40">
          Click a name for email & address · F = Full, L = Light (same as Excel)
        </p>
      </div>

      {editingNotes ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form onSubmit={onSaveNotes} className="kop-card w-full max-w-md space-y-4 p-6">
            <div>
              <h2 className="font-bold">{editingNotes.fullName}</h2>
              <p className="text-sm text-black/50">Admin note</p>
            </div>
            <textarea
              className="kop-input min-h-28"
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Payment reference, collection date…"
            />
            <div className="flex gap-2">
              <button type="submit" className="kop-btn-primary flex-1">
                Save note
              </button>
              <button type="button" className="kop-btn-secondary flex-1" onClick={() => setEditingNotes(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
