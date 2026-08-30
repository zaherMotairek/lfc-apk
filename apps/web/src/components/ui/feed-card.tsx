import { Link, useLocation } from 'react-router-dom';

type FeedCardProps = {
  type: string;
  title: string;  subtitle?: string;
  createdAt: string;
  link?: string;
};

const typeStyles: Record<string, { label: string; className: string }> = {
  NEWS: { label: 'News', className: 'kop-badge-red' },
  EVENT: { label: 'Event', className: 'kop-badge-green' },
  ACHIEVEMENT: { label: 'Achievement', className: 'kop-badge-gold' },
  PREDICTION: { label: 'Match', className: 'kop-badge-red' },
  MATCH_GOAL: { label: 'Goal!', className: 'kop-badge-red' },
  MATCH_GOAL_OPPONENT: { label: 'Goal', className: 'kop-badge-gold' },
  MATCH_LIVE: { label: 'Live', className: 'kop-badge-red' },
  MATCH_UPDATE: { label: 'Update', className: 'kop-badge-gold' },
  REGISTRATION: { label: 'Registration', className: 'kop-badge-green' },
};

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function FeedCard({ type, title, subtitle, createdAt, link }: FeedCardProps) {
  const location = useLocation();
  const style = typeStyles[type] ?? { label: type, className: 'kop-badge-red' };  const content = (
    <article className="kop-feed-item">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lfc-red/10 text-sm font-bold text-lfc-red">
            {style.label.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={style.className}>{style.label}</span>
              <span className="text-xs text-black/40">{formatRelativeTime(createdAt)}</span>
            </div>
            <h3 className="font-semibold leading-snug text-ink">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-black/55">{subtitle}</p> : null}
          </div>
        </div>
      </div>
    </article>
  );

  if (link) {
    const isInternal = link.startsWith('/');
    if (isInternal) {
      return (
        <Link
          to={link}
          state={{ from: `${location.pathname}${location.search}` }}
          className="block"
        >
          {content}
        </Link>
      );    }
    return (
      <a href={link} className="block" target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

export function FeedCardSkeleton() {
  return (
    <div className="kop-feed-item animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-black/5" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded bg-black/5" />
          <div className="h-4 w-3/4 rounded bg-black/5" />
          <div className="h-3 w-1/2 rounded bg-black/5" />
        </div>
      </div>
    </div>
  );
}
