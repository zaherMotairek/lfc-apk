import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../auth/auth-context';
import { EditableText } from '../cms/editable-text';
import { InlineEditToolbar } from '../cms/inline-edit-toolbar';
import { getCtaContent } from '../cms/get-cta-content';
import {
  DEFAULT_HOME_BOTTOM_CTA,
  DEFAULT_HOME_FEED_SECTION,
  DEFAULT_HOME_HERO_BADGE,
  DEFAULT_HOME_PLATFORM_CARD,
  DEFAULT_HOME_QUICK_LINKS,
  type HomePlatformStat,
  type HomeQuickLink,
} from '../cms/home-cms-defaults';
import { CmsInlineEditProvider, useCmsInlineEdit } from '../cms/use-cms-inline-edit';

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

function HomePageContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { isLoading, getSection, updateSection, updateContent } = useCmsInlineEdit();

  const newsQuery = useQuery({
    queryKey: ['public-news'],
    queryFn: () => apiRequest<NewsItem[]>('/news'),
  });

  const eventsQuery = useQuery({
    queryKey: ['public-events'],
    queryFn: () => apiRequest<EventItem[]>('/events'),
  });

  const hero = getSection('HERO');
  const heroContent = (hero?.content ?? {}) as { primaryButtonLabel?: string; heroBadge?: string };

  const platformCard = getCtaContent(getSection, 'platformCard', DEFAULT_HOME_PLATFORM_CARD);
  const quickLinks = getCtaContent(getSection, 'quickLinks', {
    items: DEFAULT_HOME_QUICK_LINKS,
  });
  const feedSection = getCtaContent(getSection, 'feedSection', DEFAULT_HOME_FEED_SECTION);
  const bottomCta = getCtaContent(getSection, 'bottomCta', DEFAULT_HOME_BOTTOM_CTA);

  const quickLinkItems = (quickLinks.items as HomeQuickLink[]) ?? DEFAULT_HOME_QUICK_LINKS;
  const platformStats = (platformCard.stats as HomePlatformStat[]) ?? DEFAULT_HOME_PLATFORM_CARD.stats;

  function updateQuickLink(index: number, patch: Partial<HomeQuickLink>) {
    const items = [...quickLinkItems];
    items[index] = { ...items[index], ...patch };
    updateContent('CTA', { items }, 'quickLinks');
  }

  function updatePlatformStat(index: number, patch: Partial<HomePlatformStat>) {
    const stats = [...platformStats];
    stats[index] = { ...stats[index], ...patch };
    updateContent('CTA', { stats }, 'platformCard');
  }

  if (isLoading) {
    return <div className="kop-container py-20 text-center text-black/50">Loading…</div>;
  }

  return (
    <div>
      <InlineEditToolbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.04]" />
        <div className="kop-container relative grid gap-12 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <EditableText
              as="p"
              className="kop-badge-red mb-4 inline-block"
              value={heroContent.heroBadge ?? DEFAULT_HOME_HERO_BADGE}
              onSave={(value) => updateContent('HERO', { heroBadge: value })}
            />
            <EditableText
              as="h1"
              className="mb-5 block text-5xl font-extrabold leading-[1.05] tracking-tight text-ink md:text-6xl"
              value={hero?.title ?? 'OLSC Lebanon'}
              onSave={(value) => updateSection('HERO', { title: value })}
            />
            <EditableText
              as="p"
              multiline
              className="mb-8 block max-w-xl text-lg leading-relaxed text-black/60"
              value={
                hero?.subtitle ??
                'Your community hub for match predictions, events, news, and official digital membership.'
              }
              onSave={(value) => updateSection('HERO', { subtitle: value })}
            />
            <div className="flex flex-wrap gap-3">
              <Link to="/membership" className="kop-btn-primary">
                <EditableText
                  as="span"
                  value={heroContent.primaryButtonLabel ?? 'Membership Info'}
                  onSave={(value) => updateContent('HERO', { primaryButtonLabel: value })}
                />
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
                <EditableText
                  as="span"
                  className="kop-badge inline-block bg-white/15 !text-white/90"
                  value={platformCard.badge as string}
                  onSave={(value) => updateContent('CTA', { badge: value }, 'platformCard')}
                />
                <EditableText
                  as="span"
                  className="text-xs text-white/50"
                  value={platformCard.badgeHint as string}
                  onSave={(value) => updateContent('CTA', { badgeHint: value }, 'platformCard')}
                />
              </div>
              <EditableText
                as="h2"
                className="block text-2xl font-extrabold leading-snug md:text-3xl"
                value={platformCard.title as string}
                onSave={(value) => updateContent('CTA', { title: value }, 'platformCard')}
              />
              <EditableText
                as="p"
                multiline
                className="mt-4 block text-sm leading-relaxed text-white/75"
                value={platformCard.body as string}
                onSave={(value) => updateContent('CTA', { body: value }, 'platformCard')}
              />
              <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
                {platformStats.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="text-center">
                    <EditableText
                      as="div"
                      className="text-2xl"
                      value={item.icon}
                      onSave={(value) => updatePlatformStat(index, { icon: value })}
                    />
                    <EditableText
                      as="div"
                      className="mt-1 block text-[11px] font-semibold text-white/60"
                      value={item.label}
                      onSave={(value) => updatePlatformStat(index, { label: value })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-3xl bg-lfc-red/20" />
          </div>
        </div>
      </section>

      <section className="border-y border-black/5 bg-paper/75 py-10 backdrop-blur-sm">
        <div className="kop-container grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinkItems.map((item, index) => (
            <Link
              key={item.to}
              to={item.to}
              className="kop-card kop-card-hover flex items-center gap-4 p-4"
            >
              <EditableText
                as="div"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lfc-red/10 text-xl"
                value={item.icon}
                onSave={(value) => updateQuickLink(index, { icon: value })}
              />
              <div>
                <EditableText
                  as="div"
                  className="font-bold"
                  value={item.title}
                  onSave={(value) => updateQuickLink(index, { title: value })}
                />
                <EditableText
                  as="div"
                  className="text-sm text-black/50"
                  value={item.description}
                  onSave={(value) => updateQuickLink(index, { description: value })}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="kop-container py-16">
        <div className="mb-10 text-center">
          <EditableText
            as="p"
            className="kop-badge-green mb-3 inline-block"
            value={feedSection.eyebrow as string}
            onSave={(value) => updateContent('CTA', { eyebrow: value }, 'feedSection')}
          />
          <EditableText
            as="h2"
            className="kop-section-title block"
            value={feedSection.heading as string}
            onSave={(value) => updateContent('CTA', { heading: value }, 'feedSection')}
          />
          <EditableText
            as="p"
            multiline
            className="mx-auto mt-3 block max-w-xl text-black/55"
            value={feedSection.body as string}
            onSave={(value) => updateContent('CTA', { body: value }, 'feedSection')}
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="kop-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <EditableText
                as="h3"
                className="text-lg font-bold"
                value={feedSection.newsHeading as string}
                onSave={(value) => updateContent('CTA', { newsHeading: value }, 'feedSection')}
              />
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
              <EditableText
                as="h3"
                className="text-lg font-bold"
                value={feedSection.eventsHeading as string}
                onSave={(value) => updateContent('CTA', { eventsHeading: value }, 'feedSection')}
              />
              <Link to="/events" className="text-sm font-semibold text-lfc-red hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-3">
              {(eventsQuery.data ?? [])
                .filter((item) => !item.isPast)
                .slice(0, 4)
                .map((item) => (
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

      <section className="kop-container pb-20">
        <div className="kop-gradient-dark rounded-3xl px-8 py-12 text-center text-white md:px-16">
          <EditableText
            as="h2"
            className="block text-3xl font-extrabold"
            value={bottomCta.title as string}
            onSave={(value) => updateContent('CTA', { title: value }, 'bottomCta')}
          />
          <EditableText
            as="p"
            multiline
            className="mx-auto mt-3 block max-w-lg text-white/60"
            value={bottomCta.body as string}
            onSave={(value) => updateContent('CTA', { body: value }, 'bottomCta')}
          />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/membership" className="kop-btn-primary">
              <EditableText
                as="span"
                value={bottomCta.primaryLabel as string}
                onSave={(value) => updateContent('CTA', { primaryLabel: value }, 'bottomCta')}
              />
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

export function HomePage() {
  return (
    <CmsInlineEditProvider pageCode="HOME">
      <HomePageContent />
    </CmsInlineEditProvider>
  );
}
