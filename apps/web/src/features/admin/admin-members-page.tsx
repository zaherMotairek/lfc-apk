import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type MemberListItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  olscId?: string | null;
  lfcId?: string | null;
  favoritePlayer?: string | null;
  platformAccountStatus: string;
  membershipBadge: 'OFFICIAL_MEMBER' | 'MATCHED_ROSTER' | 'NOT_MEMBER';
  rosterMatch?: {
    olscId: string;
    lfcId?: string | null;
    fullName: string;
    phoneNumber?: string | null;
  } | null;
  level: number;
  xp: number;
  coins: number;
  createdAt: string;
  lastLoginAt?: string | null;
  roles: string[];
  memberships: Array<{
    id: string;
    officialMemberId: string;
    seasonLabel: string;
    status: string;
    notes?: string | null;
  }>;
};

type EditForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  favoritePlayer: string;
  olscId: string;
  lfcId: string;
  officialMemberId: string;
  seasonLabel: string;
  notes: string;
};

const emptyCreateForm = {
  firstName: '',
  lastName: '',
  email: '',
  officialMemberId: '',
  seasonLabel: '2026/27',
  phoneNumber: '',
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function getActiveMembership(member: MemberListItem) {
  return member.memberships.find((item) => item.status === 'ACTIVE') ?? member.memberships[0];
}

function badgeLabel(badge: MemberListItem['membershipBadge']) {
  if (badge === 'OFFICIAL_MEMBER') return 'Official member';
  if (badge === 'MATCHED_ROSTER') return 'Member (Excel roster)';
  return 'Not member';
}

function badgeClass(badge: MemberListItem['membershipBadge']) {
  if (badge === 'OFFICIAL_MEMBER') return 'kop-badge-green';
  if (badge === 'MATCHED_ROSTER') return 'kop-badge-gold';
  return 'kop-badge-red';
}

export function AdminMembersPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyCreateForm);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingMember, setEditingMember] = useState<MemberListItem | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [uploadingRoster, setUploadingRoster] = useState(false);

  const membersQuery = useQuery({
    queryKey: ['admin-members'],
    queryFn: () =>
      apiRequest<MemberListItem[]>('/admin/members', {
        token: accessToken,
      }),
  });

  const rosterQuery = useQuery({
    queryKey: ['admin-roster-summary'],
    queryFn: () =>
      apiRequest<{ total: number; latestImportBatch: string | null; updatedAt: string | null }>(
        '/admin/members/roster/summary',
        { token: accessToken },
      ),
  });

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (membersQuery.data ?? []).filter((member) => {
      const membership = getActiveMembership(member);
      const haystack = [
        member.firstName,
        member.lastName,
        member.email,
        member.phoneNumber ?? '',
        member.olscId ?? '',
        member.lfcId ?? '',
        membership?.officialMemberId ?? '',
        membership?.seasonLabel ?? '',
        member.platformAccountStatus,
        member.membershipBadge,
        ...(member.roles ?? []),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || haystack.includes(query);
      const matchesStatus =
        statusFilter === 'ALL' ||
        membership?.status === statusFilter ||
        member.platformAccountStatus === statusFilter ||
        member.membershipBadge === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [membersQuery.data, search, statusFilter]);

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ message: string; invitationLink?: string | null; emailSent?: boolean }>('/admin/members', {
        method: 'POST',
        token: accessToken,
        body: {
          ...form,
          sendInvitation: true,
        },
      }),
    onSuccess: (result) => {
      setFeedback(
        result.emailSent
          ? `${result.message} Invitation email sent.`
          : `${result.message}${result.invitationLink ? ` Invitation: ${result.invitationLink}` : ''}`,
      );
      setForm(emptyCreateForm);
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Failed to create member');
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editingMember || !editForm) {
        throw new Error('No member selected');
      }
      return apiRequest<{ message: string }>(`/admin/members/${editingMember.id}`, {
        method: 'PUT',
        token: accessToken,
        body: {
          firstName: editForm.firstName,
          lastName: editForm.lastName,
          email: editForm.email,
          phoneNumber: editForm.phoneNumber,
          favoritePlayer: editForm.favoritePlayer,
          olscId: editForm.olscId,
          lfcId: editForm.lfcId,
          officialMemberId: editForm.officialMemberId || undefined,
          seasonLabel: editForm.seasonLabel || undefined,
          notes: editForm.notes,
        },
      });
    },
    onSuccess: (result) => {
      setFeedback(result.message);
      setEditingMember(null);
      setEditForm(null);
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Failed to update member');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest<{ message: string }>(`/admin/members/${userId}`, {
        method: 'DELETE',
        token: accessToken,
      }),
    onSuccess: (result) => {
      setFeedback(result.message);
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : 'Failed to delete user');
    },
  });

  function openEdit(member: MemberListItem) {
    const membership = getActiveMembership(member);
    setEditingMember(member);
    setEditForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phoneNumber: member.phoneNumber ?? '',
      favoritePlayer: member.favoritePlayer ?? '',
      olscId: member.olscId ?? '',
      lfcId: member.lfcId ?? '',
      officialMemberId: membership?.officialMemberId ?? '',
      seasonLabel: membership?.seasonLabel ?? '',
      notes: membership?.notes ?? '',
    });
  }

  async function onRosterUpload(file: File | null) {
    if (!file || !accessToken) return;
    setUploadingRoster(true);
    setFeedback(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch(`${API_URL}/admin/members/roster/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? 'Roster upload failed');
      }
      setFeedback(`${data.message} Imported: ${data.imported}`);
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-roster-summary'] });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Roster upload failed');
    } finally {
      setUploadingRoster(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    createMutation.mutate();
  }

  function onEditSubmit(event: FormEvent) {
    event.preventDefault();
    updateMutation.mutate();
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="Users"
        description="Search users, upload the official OLSC Excel/CSV roster, and see who matches as a member."
        action={
          <button type="button" className="kop-btn-primary" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Close form' : 'Add user'}
          </button>
        }
      />

      <div className="kop-card space-y-3 p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Official members Excel</h2>
            <p className="mt-1 text-sm text-black/55">
              Upload a CSV export of your Excel with columns: OLSC ID, LFC ID, Name, Phone Number,
              Status.
            </p>
            <p className="mt-2 text-xs text-black/40">
              Roster loaded: {rosterQuery.data?.total ?? 0} members
              {rosterQuery.data?.updatedAt
                ? ` · last update ${new Date(rosterQuery.data.updatedAt).toLocaleString()}`
                : ''}
            </p>
          </div>
          <label className="kop-btn-secondary cursor-pointer !px-4 !py-2 !text-sm">
            {uploadingRoster ? 'Uploading...' : 'Upload CSV'}
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={uploadingRoster}
              onChange={(e) => onRosterUpload(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {showCreate ? (
        <form onSubmit={onSubmit} className="kop-card grid gap-4 p-6 md:grid-cols-2">
          {(
            [
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['email', 'Email'],
              ['officialMemberId', 'Official Member ID / OLSC ID'],
              ['seasonLabel', 'Season label'],
              ['phoneNumber', 'Phone number'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-medium">
              {label}
              <input
                className="kop-input"
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                required={key !== 'phoneNumber'}
              />
            </label>
          ))}
          <div className="md:col-span-2">
            <button type="submit" className="kop-btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create member + send invitation'}
            </button>
          </div>
        </form>
      ) : null}

      {feedback ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
          {feedback}
        </div>
      ) : null}

      <div className="kop-card space-y-4 p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">
              {filteredMembers.length} user{filteredMembers.length === 1 ? '' : 's'}
            </div>
            <p className="text-xs text-black/45">Search by name, email, phone, OLSC ID or LFC ID</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="kop-input !mt-0 min-w-[220px]"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="kop-input !mt-0"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="OFFICIAL_MEMBER">Official Member</option>
              <option value="MATCHED_ROSTER">Matched roster</option>
              <option value="NOT_MEMBER">Not member</option>
              <option value="ACTIVE">Membership ACTIVE</option>
              <option value="SUSPENDED">Membership SUSPENDED</option>
              <option value="INVITED">Account INVITED</option>
            </select>
          </div>
        </div>

        {membersQuery.isLoading ? <p className="text-sm text-black/50">Loading users...</p> : null}

        <div className="grid gap-3 md:hidden">
          {filteredMembers.map((member) => {
            const membership = getActiveMembership(member);
            return (
              <article key={member.id} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-extrabold text-ink">
                      {member.firstName} {member.lastName}
                    </div>
                    <div className="mt-1 text-sm text-black/55">{member.email}</div>
                    <div className="mt-1 text-sm text-black/55">{member.phoneNumber || 'No phone'}</div>
                  </div>
                  <span className={badgeClass(member.membershipBadge)}>
                    {badgeLabel(member.membershipBadge)}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-black/55">
                  <div>
                    <div className="font-semibold uppercase tracking-wide text-black/35">OLSC ID</div>
                    <div className="mt-1 font-semibold text-ink">
                      {member.olscId ?? membership?.officialMemberId ?? '-'}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold uppercase tracking-wide text-black/35">LFC ID</div>
                    <div className="mt-1 font-semibold text-ink">{member.lfcId ?? '-'}</div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="kop-btn-secondary !px-3 !py-2 !text-xs" onClick={() => openEdit(member)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                    onClick={() => {
                      if (window.confirm(`Delete ${member.email}?`)) {
                        deleteMutation.mutate(member.id);
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-black/10 bg-black/5">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">IDs</th>
                <th className="px-4 py-3">Member status</th>
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const membership = getActiveMembership(member);
                return (
                  <tr key={member.id} className="border-b border-black/5 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ink">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="mt-1 text-xs text-black/40">
                        {(member.roles ?? []).join(', ') || 'MEMBER'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{member.email}</div>
                      <div className="text-xs text-black/45">{member.phoneNumber || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-black/45">OLSC</div>
                      <div className="font-semibold">
                        {member.olscId ?? membership?.officialMemberId ?? '-'}
                      </div>
                      <div className="mt-2 text-xs text-black/45">LFC</div>
                      <div className="font-semibold">{member.lfcId ?? '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={badgeClass(member.membershipBadge)}>
                        {badgeLabel(member.membershipBadge)}
                      </span>
                      {member.rosterMatch ? (
                        <div className="mt-2 text-xs text-black/45">{member.rosterMatch.fullName}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">{member.platformAccountStatus}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-lfc-red/20 bg-lfc-red/5 px-3 py-1.5 text-xs font-semibold text-lfc-red"
                          onClick={() => openEdit(member)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                          onClick={() => {
                            if (window.confirm(`Delete ${member.email}? This cannot be undone.`)) {
                              deleteMutation.mutate(member.id);
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!membersQuery.isLoading && filteredMembers.length === 0 ? (
          <p className="text-sm text-black/45">No users match your search.</p>
        ) : null}
      </div>

      {editingMember && editForm ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <form
            onSubmit={onEditSubmit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl md:p-6"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-black/40">Edit user</div>
                <h2 className="mt-1 text-xl font-extrabold text-ink">
                  {editingMember.firstName} {editingMember.lastName}
                </h2>
              </div>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-black/50 hover:bg-black/5"
                onClick={() => {
                  setEditingMember(null);
                  setEditForm(null);
                }}
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {(
                [
                  ['firstName', 'First name'],
                  ['lastName', 'Last name'],
                  ['email', 'Email'],
                  ['phoneNumber', 'Phone number'],
                  ['olscId', 'OLSC ID'],
                  ['lfcId', 'ALLRED SUPPORT ID'],
                  ['officialMemberId', 'Official Member ID'],
                  ['seasonLabel', 'Season label'],
                  ['favoritePlayer', 'Favorite player'],
                  ['notes', 'Notes'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className={`block text-sm font-medium ${key === 'notes' ? 'md:col-span-2' : ''}`}>
                  {label}
                  <input
                    className="kop-input"
                    value={editForm[key]}
                    onChange={(e) => setEditForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))}
                    required={['firstName', 'lastName', 'email'].includes(key)}
                  />
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button type="submit" className="kop-btn-primary" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="kop-btn-secondary"
                onClick={() => {
                  setEditingMember(null);
                  setEditForm(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
