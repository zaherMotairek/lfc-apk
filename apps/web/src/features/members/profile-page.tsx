import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { resolveMediaUrl } from '../../lib/media-url';

type ProfileResponse = {
  id: string;
  username?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string | null;
  phoneNumber?: string | null;
  favoritePlayer?: string | null;
  olscId?: string | null;
  lfcId?: string | null;
  platformAccountStatus: string;
  level: number;
  xp: number;
  coins: number;
  currentWinningStreak: number;
  longestWinningStreak: number;
  roles: string[];
  achievements: Array<{
    code: string;
    name: string;
    description: string;
    icon?: string | null;
    unlockedAt: string;
  }>;
  memberships: Array<{
    officialMemberId: string;
    seasonLabel: string;
    status: string;
  }>;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

const ACHIEVEMENT_ICONS: Record<string, string> = {
  KING_OF_THE_KOP: '👑',
  PREDICTION_MASTER: '🎯',
};

function resolveLoginUsername(profile: ProfileResponse): string {
  if (profile.username?.trim()) {
    return profile.username.trim();
  }
  if (profile.email.endsWith('@users.olsc.local')) {
    return profile.email.replace('@users.olsc.local', '');
  }
  const local = profile.email.split('@')[0];
  return local || profile.email;
}

function displayName(profile: ProfileResponse | null, fallbackUsername?: string | null) {
  if (profile?.firstName.trim() || profile?.lastName.trim()) {
    return `${profile.firstName} ${profile.lastName}`.trim();
  }
  if (profile) {
    return resolveLoginUsername(profile);
  }
  return fallbackUsername ?? 'Member';
}

function formatRoleLabel(role: string) {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ProfilePage() {
  const { accessToken, user } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    favoritePlayer: '',
    olscId: '',
    lfcId: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await apiRequest<ProfileResponse>('/users/me', { token: accessToken });
        if (!cancelled) {
          setProfile(result);
          setForm({
            firstName: result.firstName,
            lastName: result.lastName,
            phoneNumber: result.phoneNumber ?? '',
            favoritePlayer: result.favoritePlayer ?? '',
            olscId: result.olscId ?? '',
            lfcId: result.lfcId ?? '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>('/users/me', {
        method: 'PUT',
        token: accessToken,
        body: form,
      });
      setMessage(result.message);
      const refreshed = await apiRequest<ProfileResponse>('/users/me', { token: accessToken });
      setProfile(refreshed);
      setForm({
        firstName: refreshed.firstName,
        lastName: refreshed.lastName,
        phoneNumber: refreshed.phoneNumber ?? '',
        favoritePlayer: refreshed.favoritePlayer ?? '',
        olscId: refreshed.olscId ?? '',
        lfcId: refreshed.lfcId ?? '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordMessage(null);

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      const result = await apiRequest<{ message: string }>('/users/me/password', {
        method: 'PUT',
        token: accessToken,
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
      });
      setPasswordMessage(result.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function onAvatarChange(file: File | null) {
    if (!file || !accessToken) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const body = new FormData();
      body.append('avatar', file);

      const response = await fetch(`${API_URL}/users/me/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'Avatar upload failed');

      setMessage(data.message);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: data.avatarUrl } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Avatar upload failed');
    } finally {
      setLoading(false);
    }
  }

  const activeMembership =
    profile?.memberships.find((item) => item.status === 'ACTIVE') ?? profile?.memberships[0];

  const loginUsername = profile ? resolveLoginUsername(profile) : user?.username ?? '';
  const memberRoles = profile?.roles?.filter((role) => role !== 'MEMBER') ?? [];

  const initials = `${profile?.firstName?.charAt(0) ?? user?.firstName?.charAt(0) ?? loginUsername.charAt(0) ?? ''}${profile?.lastName?.charAt(0) ?? user?.lastName?.charAt(0) ?? ''}`;

  return (
    <section className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Your Kop identity, login details, stats, and membership info."
      />

      {profile && (!profile.firstName.trim() || !profile.lastName.trim()) ? (
        <div className="rounded-2xl border border-lfc-red/25 bg-lfc-red/[0.06] px-5 py-4 text-sm text-ink">
          <p className="font-semibold text-lfc-red">Complete your profile</p>
          <p className="mt-1 text-black/60">
            Add your first name, last name, and optionally your OLSC / LFC member IDs below — like your
            official membership details.
          </p>
        </div>
      ) : null}

      {/* Hero card with avatar */}
      <div className="kop-card overflow-hidden">
        <div className="kop-gradient-hero px-6 py-8 text-white">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/15 text-2xl font-bold">
                {profile?.avatarUrl ? (
                  <img
                    src={resolveMediaUrl(profile.avatarUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials || '?'
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">Signed in as</p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                {displayName(profile, user?.username)}
              </h2>
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 ring-1 ring-white/20">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/60">Username</span>
                <span className="font-mono text-base font-bold text-white">@{loginUsername}</span>
              </div>
              {memberRoles.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {memberRoles.map((role) => (
                    <span
                      key={role}
                      className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white/85"
                    >
                      {formatRoleLabel(role)}
                    </span>
                  ))}
                </div>
              ) : null}
              {activeMembership ? (
                <p className="mt-3 text-sm text-white/70">
                  Official member · {activeMembership.officialMemberId} · {activeMembership.seasonLabel}
                </p>
              ) : (
                <p className="mt-3 text-sm text-white/70">
                  {[
                    profile?.olscId ? `OLSC ${profile.olscId}` : null,
                    profile?.lfcId ? `ALLRED ${profile.lfcId}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'Complete your profile and add OLSC / LFC IDs to match the roster'}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-px bg-black/5 sm:grid-cols-2">
          <div className="bg-surface px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-black/40">Login username</p>
            <p className="mt-1 font-mono text-lg font-bold text-ink">@{loginUsername}</p>
            <p className="mt-1 text-xs text-black/45">Use this on the sign-in page — not your email address.</p>
          </div>
          <div className="bg-surface px-6 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-black/40">Account status</p>
            <p className="mt-1 text-lg font-bold capitalize text-ink">
              {profile?.platformAccountStatus?.toLowerCase() ?? 'active'}
            </p>
            <p className="mt-1 text-xs text-black/45">Keep your password updated in the section below.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b border-black/5 px-6 py-4">
          <label className="avatar-upload-btn">
            📷 Change photo
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="text-xs text-black/40">JPEG, PNG or WebP · max 2 MB</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
          {[
            { label: 'Prediction streak', value: profile?.currentWinningStreak ?? 0 },
            { label: 'Best streak', value: profile?.longestWinningStreak ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="stat-pill">
              <div className="stat-pill-label">{stat.label}</div>
              <div className="stat-pill-value">{stat.value}</div>
            </div>
          ))}
        </div>

        {profile && profile.longestWinningStreak > 0 ? (
          <p className="border-t border-black/5 px-6 py-3 text-xs text-black/45">
            Longest winning streak: {profile.longestWinningStreak} match
            {profile.longestWinningStreak !== 1 ? 'es' : ''}
          </p>
        ) : null}
      </div>

      <div className="kop-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">Membership</h3>
            <p className="mt-1 text-sm text-black/50">
              {activeMembership
                ? `${activeMembership.officialMemberId} · ${activeMembership.seasonLabel}`
                : 'Membership is detected automatically when your OLSC / LFC ID matches the official Excel roster.'}
            </p>
          </div>
          <span className={`kop-badge ${activeMembership?.status === 'ACTIVE' ? 'kop-badge-green' : 'kop-badge-red'}`}>
            {activeMembership?.status ?? 'NONE'}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/app/membership-card" className="kop-btn-primary !px-4 !py-2 !text-sm">
            Open my card
          </Link>
          <Link to="/membership" className="kop-btn-secondary !px-4 !py-2 !text-sm">
            How it works
          </Link>
        </div>
      </div>

      {/* Achievements */}
      <div className="kop-card p-6">
        <h3 className="font-bold text-ink">Achievements</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {(profile?.achievements ?? []).map((achievement) => (
            <span key={achievement.code} className="achievement-badge" title={achievement.description}>
              {ACHIEVEMENT_ICONS[achievement.code] ?? '🏅'} {achievement.name}
            </span>
          ))}
          {profile && profile.achievements.length === 0 ? (
            <p className="text-sm text-black/45">Play Match Hub to unlock achievements.</p>
          ) : null}
        </div>
      </div>

      {/* Edit form */}
      <div className="kop-card p-6">
        <h3 className="mb-4 font-bold text-ink">Edit details</h3>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          {(
            [
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['phoneNumber', 'Phone number'],
              ['favoritePlayer', 'Favorite Liverpool player'],
              ['olscId', 'OLSC ID'],
              ['lfcId', 'ALLRED SUPPORT ID'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-medium">
              {label}
              <input
                className="kop-input"
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                required={key === 'firstName' || key === 'lastName'}
              />
            </label>
          ))}
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="kop-btn-primary">
              {loading ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-sm text-lfc-red">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-4 rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
            {message}
          </div>
        ) : null}
      </div>

      <div className="kop-card p-6">
        <h3 className="mb-1 font-bold text-ink">Change password</h3>
        <p className="mb-4 text-sm text-black/50">
          Update your login password. Works for members and admin accounts.
        </p>
        <form onSubmit={onPasswordSubmit} className="grid max-w-md gap-4">
          <label className="block text-sm font-medium">
            Current password
            <input
              className="kop-input"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              required
              autoComplete="current-password"
            />
          </label>
          <label className="block text-sm font-medium">
            New password
            <input
              className="kop-input"
              type="password"
              minLength={8}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
              }
              required
              autoComplete="new-password"
            />
          </label>
          <label className="block text-sm font-medium">
            Confirm new password
            <input
              className="kop-input"
              type="password"
              minLength={8}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
              }
              required
              autoComplete="new-password"
            />
          </label>
          <div>
            <button type="submit" disabled={passwordLoading} className="kop-btn-primary">
              {passwordLoading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>

        {passwordError ? (
          <div className="mt-4 rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-sm text-lfc-red">
            {passwordError}
          </div>
        ) : null}
        {passwordMessage ? (
          <div className="mt-4 rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
            {passwordMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
}
