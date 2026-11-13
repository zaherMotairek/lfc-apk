import { useContent } from '../content/content-provider';
import { useLanguage } from '../content/language-provider';

export function OfflinePage() {
  const { lang } = useLanguage();
  const ribbon = useContent('offline.ribbon', 'OLSC Lebanon · RedLeb Hub');
  const title = useContent('offline.title', "You're offline");
  const body = useContent(
    'offline.body',
    'RedLeb Hub needs a connection for live scores, events, and your membership tools. Check mobile data or Wi‑Fi, then try again.',
  );
  const retry = useContent('offline.retry', 'Try again');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 py-12 text-center text-white">
      <div className="mb-4 grid h-[4.5rem] w-[4.5rem] place-items-center rounded-2xl bg-white/5 shadow-[0_8px_32px_rgba(200,16,46,0.25)]">
        <img src="/pwa-192.svg" alt="" className="h-12 w-12" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-white/45">{ribbon}</p>
      <h1 className="mt-2 text-3xl font-extrabold text-lfc-red">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">{body}</p>
      <button
        type="button"
        className="kop-btn-primary mt-6"
        onClick={() => {
          window.location.href = lang === 'ar' ? '/?lang=ar' : '/';
        }}
      >
        {retry}
      </button>
    </div>
  );
}
