import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

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

  const initials = `${profile?.firstName?.charAt(0) ?? user?.firstName?.charAt(0) ?? ''}${profile?.lastName?.charAt(0) ?? user?.lastName?.charAt(0) ?? ''}`;

  return (
    <section className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Manage your platform profile and track your Kop stats."
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
                  <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials || '?'
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-extrabold">
                {profile?.firstName || profile?.lastName
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : profile?.username ?? 'New member'}
              </h2>
              <p className="text-sm text-white/70">
                {profile?.username
                  ? `@${profile.username}`
                  : profile?.email?.endsWith('@users.olsc.local')
                    ? 'Username account'
                    : profile?.email}
              </p>
              {activeMembership ? (
                <p className="mt-1 text-xs text-white/55">
                  {activeMembership.officialMemberId} · {activeMembership.seasonLabel}
                </p>
              ) : (
                <p className="mt-1 text-xs text-white/55">
                  {[profile?.olscId ? `OLSC ${profile.olscId}` : null, profile?.lfcId ? `LFC ${profile.lfcId}` : null]
                    .filter(Boolean)
                    .join(' · ') || 'Add your OLSC / LFC IDs below to match the official roster'}
                </p>
              )}
            </div>
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
            { label: 'Level', value: profile?.level ?? 1 },
            { label: 'XP', value: profile?.xp ?? 0 },
            { label: 'Coins', value: profile?.coins ?? 0 },
            { label: 'Streak', value: profile?.currentWinningStreak ?? 0 },
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
              ['lfcId', 'LFC ID'],
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
    </section>
  );
}
