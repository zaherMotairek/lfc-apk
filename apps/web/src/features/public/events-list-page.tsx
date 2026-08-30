import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  capacity?: number | null;
  registeredCount: number;
  registrationOpen?: boolean;
  isPast?: boolean;
};

function EventCard({ item, from }: { item: EventItem; from: string }) {
  const date = new Date(item.startDateTime);
  const isPast = item.isPast === true;
  const isOpen = !isPast && item.registrationOpen !== false;

  return (
    <Link
      to={`/events/${item.id}`}
      state={{ from }}
      className={`kop-card kop-card-hover group block overflow-hidden ${isPast ? 'opacity-90' : ''}`}
    >
      <div className="flex flex-col sm:flex-row">
        <div
          className={`flex shrink-0 items-center justify-center px-6 py-5 sm:w-28 sm:flex-col ${
            isPast ? 'bg-black/[0.04]' : 'bg-pitch/10'
          }`}
        >
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ${
              isPast ? 'text-black/40' : 'text-pitch'
            }`}
          >
            {date.toLocaleDateString('en', { month: 'short' })}
          </span>
          <span
            className={`text-3xl font-extrabold leading-none ${isPast ? 'text-black/45' : 'text-pitch'}`}
          >
            {date.getDate()}
          </span>
        </div>

        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span
                className={`kop-badge mb-2 ${
                  isPast ? 'bg-black/10 text-black/55' : isOpen ? 'kop-badge-green' : 'kop-badge-red'
                }`}
              >
                {isPast ? 'Finished' : isOpen ? 'Registration open' : 'Closed'}
              </span>
              <h2
                className={`text-xl font-bold leading-snug group-hover:text-lfc-red ${
                  isPast ? 'text-black/70' : ''
                }`}
              >
                {item.title}
              </h2>
            </div>
            <span className="text-sm text-black/40">
              {item.registeredCount}
              {item.capacity ? ` / ${item.capacity}` : ''} registered
            </span>
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-black/55">
            <span>📍 {item.location}</span>
            <span>·</span>
            <span>{date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
          </p>

          <p className="mt-3 line-clamp-2 text-sm text-black/60">{item.description}</p>

          <span className="mt-4 inline-flex text-sm font-semibold text-lfc-red">
            View event details →
          </span>
        </div>
      </div>
    </Link>
  );
}

export function EventsListPage() {
  const location = useLocation();
  const from = `${location.pathname}${location.search}`;

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-events'],
    queryFn: () => apiRequest<EventItem[]>('/events'),
  });

  const { upcoming, past } = useMemo(() => {
    const items = data ?? [];
    return {
      upcoming: items.filter((item) => !item.isPast),
      past: items.filter((item) => item.isPast),
    };
  }, [data]);

  return (
    <section className="kop-container py-12 md:py-16">
      <PageHeader
        eyebrow="Events"
        title="Watch Parties & Meetups"
        description="Community gatherings, Liverpool watch parties, and official OLSC Lebanon activities."
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="kop-card animate-pulse p-6">
              <div className="flex gap-4">
                <div className="h-16 w-16 shrink-0 rounded-2xl bg-black/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/2 rounded bg-black/5" />
                  <div className="h-4 w-1/3 rounded bg-black/5" />
                  <div className="h-4 w-full rounded bg-black/5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          Unable to load events.
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="space-y-10">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink">Upcoming events</h2>
            {upcoming.length ? (
              upcoming.map((item) => <EventCard key={item.id} item={item} from={from} />)
            ) : (
              <div className="kop-card py-12 text-center">
                <div className="text-4xl">📅</div>
                <p className="mt-4 font-semibold text-ink">No upcoming events</p>
                <p className="mt-1 text-sm text-black/50">
                  Check back soon for watch parties and community meetups.
                </p>
              </div>
            )}
          </div>

          {past.length ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Past events</h2>
                <p className="mt-1 text-sm text-black/50">
                  Browse previous OLSC gatherings. Registration is closed; only admins can remove
                  an event from the archive.
                </p>
              </div>
              {past.map((item) => (
                <EventCard key={item.id} item={item} from={from} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
