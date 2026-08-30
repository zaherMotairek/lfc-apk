import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type MembershipCard = {
  fullName: string;
  officialMemberId: string | null;
  seasonLabel: string | null;
  avatarUrl?: string | null;
  cardImageUrl?: string | null;
  physicalCardUploadedAt?: string | null;
  cardNumber: string | null;
  qrCodeValue: string | null;
  qrSecureToken: string | null;
  membershipStatus: string;
  membershipBadge: 'OFFICIAL_MEMBER' | 'MATCHED_ROSTER' | 'NOT_MEMBER';
  rosterMatched: boolean;
  rosterMatch?: {
    olscId: string;
    lfcId?: string | null;
    fullName: string;
  } | null;
  issuedAt: string | null;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function badgeLabel(badge: MembershipCard['membershipBadge']) {
  if (badge === 'OFFICIAL_MEMBER') return 'Official member';
  if (badge === 'MATCHED_ROSTER') return 'Member (Excel roster)';
  return 'Not on roster yet';
}

export function MembershipCardPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const cardQuery = useQuery({
    queryKey: ['membership-card'],
    queryFn: () =>
      apiRequest<MembershipCard>('/memberships/me/card', {
        token: accessToken,
      }),
    enabled: Boolean(accessToken),
  });

  const card = cardQuery.data ?? null;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('cardImage', file);
      const response = await fetch(`${API_URL}/memberships/me/card/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message ?? 'Upload failed');
      }
      return data as { message: string; cardImageUrl: string };
    },
    onSuccess: (result) => {
      setUploadMessage(result.message);
      setUploadError(null);
      void queryClient.invalidateQueries({ queryKey: ['membership-card'] });
    },
    onError: (error) => {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      setUploadMessage(null);
    },
  });

  async function onCardImageChange(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be 5 MB or smaller.');
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    setUploadMessage(null);
    try {
      await uploadMutation.mutateAsync(file);
    } finally {
      setIsUploading(false);
    }
  }

  const busy = isUploading || uploadMutation.isPending;

  if (cardQuery.isFetching && !card) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Membership" title="My card" description="Your OLSC Lebanon membership card photo." />
        <div className="kop-card animate-pulse p-8">
          <div className="mx-auto h-48 max-w-sm rounded-3xl bg-black/5" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-xl space-y-5">
      <PageHeader
        eyebrow="Membership"
        title="My card"
        description="Take a photo or upload your physical OLSC membership card here."
      />

      {card ? (
        <div className="rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Member status</div>
              <div className="mt-1 font-semibold text-ink">{badgeLabel(card.membershipBadge)}</div>
            </div>
            {card.officialMemberId ? (
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-black/40">OLSC ID</div>
                <div className="mt-1 font-semibold text-ink">{card.officialMemberId}</div>
              </div>
            ) : null}
          </div>
          {card.rosterMatched && card.rosterMatch ? (
            <p className="mt-2 text-xs text-black/55">
              Matched in the official Excel roster as {card.rosterMatch.fullName}.
            </p>
          ) : (
            <p className="mt-2 text-xs text-black/55">
              Add your OLSC ID or LFC ID in your profile so the committee can match you with the official roster.
            </p>
          )}
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => {
          void onCardImageChange(event.target.files?.[0] ?? null);
          event.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void onCardImageChange(event.target.files?.[0] ?? null);
          event.target.value = '';
        }}
      />

      <div className="kop-card overflow-hidden">
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => fileInputRef.current?.click()}
        >
          {card?.cardImageUrl ? (
            <img
              src={card.cardImageUrl}
              alt="Your membership card"
              className="max-h-80 w-full bg-black/[0.03] object-contain"
            />
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center bg-[#f3eee6] px-5 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-dashed border-lfc-red/40 bg-white text-2xl">
                📷
              </div>
              <p className="mt-4 text-lg font-bold text-ink">Add your card photo here</p>
              <p className="mt-2 max-w-sm text-sm text-black/55">
                Tap this box to choose a picture, or use the buttons below to take a photo with your phone.
              </p>
            </div>
          )}
        </button>

        <div className="space-y-3 border-t border-black/5 p-4">
          <button
            type="button"
            className="kop-btn-primary w-full"
            disabled={busy}
            onClick={() => cameraInputRef.current?.click()}
          >
            {busy ? 'Uploading…' : 'Take a photo'}
          </button>
          <button
            type="button"
            className="kop-btn-secondary w-full"
            disabled={busy}
            onClick={() => fileInputRef.current?.click()}
          >
            {card?.cardImageUrl ? 'Replace from computer' : 'Upload from computer'}
          </button>
          {card?.physicalCardUploadedAt ? (
            <p className="text-center text-xs text-black/45">
              Last upload{' '}
              {new Date(card.physicalCardUploadedAt).toLocaleDateString('en', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          ) : null}
          {uploadMessage ? <p className="text-center text-sm text-pitch">{uploadMessage}</p> : null}
          {uploadError ? <p className="text-center text-sm text-lfc-red">{uploadError}</p> : null}
        </div>
      </div>

      {card?.qrSecureToken ? (
        <>
          <div className="kop-card px-4 py-3">
            <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Status</dt>
                <dd className="mt-1 font-semibold text-ink">{card.membershipStatus}</dd>
              </div>
              {card.officialMemberId ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Member ID</dt>
                  <dd className="mt-1 font-semibold text-ink">{card.officialMemberId}</dd>
                </div>
              ) : null}
              {card.seasonLabel ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Season</dt>
                  <dd className="mt-1 font-semibold text-ink">{card.seasonLabel}</dd>
                </div>
              ) : null}
              {card.cardNumber ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-black/40">Card no.</dt>
                  <dd className="mt-1 font-semibold text-ink">{card.cardNumber}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="membership-card-visual overflow-hidden rounded-[24px] shadow-xl shadow-lfc-red/20">
            <div className="relative bg-[linear-gradient(145deg,#c8102e_0%,#8a0b1f_45%,#101418_100%)] p-5 text-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/65">
                    OLSC Lebanon
                  </div>
                  <div className="mt-0.5 text-xs text-white/50">Official Supporters Club</div>
                </div>
                {card.seasonLabel ? (
                  <div className="rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {card.seasonLabel}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 text-sm font-extrabold ring-1 ring-white/20">
                  {card.avatarUrl ? (
                    <img src={card.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(card.fullName)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-lg font-extrabold leading-tight">{card.fullName}</div>
                  {card.officialMemberId ? (
                    <div className="mt-0.5 text-xs text-white/70">ID {card.officialMemberId}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex justify-center rounded-2xl bg-white p-3">
                <QRCodeSVG value={card.qrSecureToken} size={132} level="M" includeMargin />
              </div>
              <p className="mt-2 text-center text-[11px] text-white/55">
                Show this QR at watch parties for verification.
              </p>
            </div>
          </div>
        </>
      ) : null}

      <p className="text-center text-sm text-black/45">
        Need to update your name or OLSC / LFC ID?{' '}
        <Link to="/app/profile" className="font-semibold text-lfc-red">
          Open profile
        </Link>
      </p>
    </section>
  );
}
