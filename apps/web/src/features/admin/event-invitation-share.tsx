import { useMemo, useState } from 'react';
import { useBrand } from '../brand/use-brand';

type EventShareProps = {
  event: {
    id: string;
    title: string;
    location: string;
    startDateTime: string;
    description?: string;
  };
};

function formatShareDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function EventInvitationShare({ event }: EventShareProps) {
  const brand = useBrand();
  const [copied, setCopied] = useState(false);

  const publicUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/events/${event.id}`;
  }, [event.id]);

  const shareText = useMemo(
    () =>
      [
        `${event.title}`,
        formatShareDate(event.startDateTime),
        event.location,
        '',
        `Join us via ${brand.siteName}:`,
        publicUrl,
      ].join('\n'),
    [event, brand.siteName, publicUrl],
  );

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function onNativeShare() {
    if (!navigator.share) {
      await onCopy();
      return;
    }
    await navigator.share({ title: event.title, text: shareText, url: publicUrl });
  }

  return (
    <div className="kop-card overflow-hidden">
      <div className="kop-gradient-hero px-5 py-4 text-white">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">Invitation</div>
        <div className="mt-1 text-lg font-extrabold leading-tight">{event.title}</div>
        <p className="mt-2 text-sm text-white/80">{formatShareDate(event.startDateTime)}</p>
        <div className="mt-1 text-sm text-white/75">{event.location}</div>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs text-black/55">
          Share this gathering on WhatsApp or Instagram — members open the link to register with guests.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="kop-btn-primary !text-xs" onClick={() => void onNativeShare()}>
            Share…
          </button>
          <button type="button" className="kop-btn-secondary !text-xs" onClick={() => void onCopy()}>
            {copied ? 'Copied!' : 'Copy text'}
          </button>
        </div>
      </div>
    </div>
  );
}
