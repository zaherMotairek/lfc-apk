import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../auth/auth-context';

type CmsPage = {
  title: string;
  sections: Array<{
    type: string;
    title?: string | null;
    subtitle?: string | null;
    content?: {
      primaryButtonLabel?: string;
    } | null;
  }>;
};

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  publishedAt?: string | null;
};

type EventItem = {
  id: string;
  title: string;
  location: string;
  startDateTime: string;
  registeredCount: number;
  capacity?: number | null;
  isPast?: boolean;
};

export function HomePage() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const cmsQuery = useQuery({
    queryKey: ['cms-page', 'HOME'],
    queryFn: () => apiRequest<CmsPage>('/cms/pages/HOME'),
  });

  const newsQuery = useQuery({
    queryKey: ['public-news'],
    queryFn: () => apiRequest<NewsItem[]>('/news'),
  });

  const eventsQuery = useQuery({
    queryKey: ['public-events'],
    queryFn: () => apiRequest<EventItem[]>('/events'),
  });

  const hero = cmsQuery.data?.sections.find((section) => section.type === 'HERO');

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.04]" />
        <div className="kop-container relative grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="kop-badge-red mb-4">Official Liverpool Supporters Club · Lebanon</p>
            <h1 className="mb-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-6xl">
              {hero?.title ?? 'OLSC Lebanon'}
            </h1>
            <p className="mb-8 max-w-xl text-lg leading-relaxed text-black/60">
              {hero?.subtitle ??
                'Your community hub for match predictions, events, news, and official digital membership.'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/membership" className="kop-btn-primary">
                {hero?.content?.primaryButtonLabel ?? 'Membership Info'}
              </Link>
              <Link
                to={isAuthenticated ? '/app' : '/login'}
                state={
                  isAuthenticated
                    ? undefined
                    : { from: { pathname: location.pathname, search: location.search } }
                }
                className="kop-btn-secondary"
              >
                {isAuthenticated ? 'Open Member App' : 'Member Login'}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="kop-gradient-hero rounded-3xl p-8 text-white shadow-2xl shadow-lfc-red/25 md:p-10">
              <div className="mb-6 flex items-center gap-2">
                <span className="kop-badge bg-white/15 !text-white/90">Kop Platform</span>
                <span className="text-xs text-white/50">Members only</span>
              </div>
              <h2 className="text-2xl font-extrabold leading-snug md:text-3xl">
                Match Hub · Digital Card · Community Feed
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/75">
                Predict scores, climb the leaderboard, register for watch parties, and carry your
                official membership card — all in one place.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
                {[
                  { n: '⚽', l: 'Predictions' },
                  { n: '🏆', l: 'Leaderboard' },
                  { n: '🎫', l: 'Member Card' },
                ].map((item) => (
                  <div key={item.l} className="text-center">
                    <div className="text-2xl">{item.n}</div>
                    <div className="mt-1 text-[11px] font-semibold text-white/60">{item.l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-3xl bg-lfc-red/20" />
          </div>
        </div>
      </section>

      {/* Quick features strip */}
      <section className="border-y border-black/5 bg-paper/75 py-10 backdrop-blur-sm">
        <div className="kop-container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: '📰', title: 'Club News', desc: 'Official announcements', to: '/news' },
            { icon: '🗞️', title: 'Newsletter', desc: 'Read the PDF issues', to: '/newsletter' },
            { icon: '📅', title: 'Events', desc: 'Watch parties & meetups', to: '/events' },
            { icon: '🤝', title: 'Membership', desc: 'How to join OLSC', to: '/membership' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="kop-card kop-card-hover flex items-center gap-4 p-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lfc-red/10 text-xl">
                {item.icon}
              </div>
              <div>
                <div className="font-bold">{item.title}</div>
                <div className="text-sm text-black/50">{item.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* News + Events feed preview */}
      <section className="kop-container py-16">
        <div className="mb-10 text-center">
          <p className="kop-badge-green mb-3">Stay Connected</p>
          <h2 className="kop-section-title">Latest from the Kop</h2>
          <p className="mx-auto mt-3 max-w-xl text-black/55">
            News, events, and updates from your supporters club — the same spirit as a live community
            feed, built for OLSC Lebanon.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="kop-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">Latest News</h3>
              <Link to="/news" className="text-sm font-semibold text-lfc-red hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {(newsQuery.data ?? []).slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.slug}`}
                  state={{ from: `${location.pathname}${location.search}` }}
                  className="group block rounded-xl border border-black/5 p-4 transition hover:border-lfc-red/20 hover:bg-lfc-red/[0.02]"
                >
                  <div className="font-semibold group-hover:text-lfc-red">{item.title}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-black/55">
                    {item.excerpt ?? 'Read the full article'}
                  </p>
                  {item.publishedAt ? (
                    <p className="mt-2 text-xs text-black/35">
                      {new Date(item.publishedAt).toLocaleDateString()}
                    </p>
                  ) : null}
                </Link>
              ))}
              {!newsQuery.data?.length ? (
                <p className="py-8 text-center text-sm text-black/40">No published news yet.</p>
              ) : null}
            </div>
          </div>

          <div className="kop-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold">Upcoming Events</h3>
              <Link to="/events" className="text-sm font-semibold text-lfc-red hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {(eventsQuery.data ?? []).filter((item) => !item.isPast).slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to={`/events/${item.id}`}
                  state={{ from: `${location.pathname}${location.search}` }}
                  className="group block rounded-xl border border-black/5 p-4 transition hover:border-pitch/20 hover:bg-pitch/[0.03]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold group-hover:text-pitch">{item.title}</div>
                      <p className="mt-1 text-sm text-black/55">{item.location}</p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-pitch/10 px-3 py-2 text-center">
                      <div className="text-xs font-bold uppercase text-pitch">
                        {new Date(item.startDateTime).toLocaleString('en', { month: 'short' })}
                      </div>
                      <div className="text-lg font-extrabold leading-none text-pitch">
                        {new Date(item.startDateTime).getDate()}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-black/40">
                    {item.registeredCount}
                    {item.capacity ? ` / ${item.capacity}` : ''} registered
                  </p>
                </Link>
              ))}
              {!eventsQuery.data?.some((item) => !item.isPast) ? (
                <p className="py-8 text-center text-sm text-black/40">No upcoming events yet.</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="kop-container pb-20">
        <div className="kop-gradient-dark rounded-3xl px-8 py-12 text-center text-white md:px-16">
          <h2 className="text-3xl font-extrabold">Ready to join the Kop?</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/60">
            Official membership is managed by the OLSC Lebanon committee. Already a member? Log in
            to access the full platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/membership" className="kop-btn-primary">
              Learn about membership
            </Link>
                        <Link
              to={isAuthenticated ? '/app' : '/login'}
              state={
                isAuthenticated
                  ? undefined
                  : { from: { pathname: location.pathname, search: location.search } }
              }
              className="kop-btn bg-white/10 text-white hover:bg-white/15"
            >
              {isAuthenticated ? 'Open Member App' : 'Member Login'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
