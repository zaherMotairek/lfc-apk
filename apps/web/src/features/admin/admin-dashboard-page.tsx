import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { useContent, useContentBundle } from '../content/content-provider';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { ADMIN_QUICK_LINK_SPECS } from '../../components/layout/nav-config';

type Dashboard = {
  members: {
    total: number;
    activeMemberships: number;
    pendingInvites: number;
    inactive30Days?: number;
  };
  applications?: { pending: number };
  predictions: { total: number };
  matches: { upcoming: number };
  events: { total: number };
};

const PREVIEW_LINKS = [
  { to: '/app', labelKey: 'nav.member.home', fallback: 'Member Home' },
  { to: '/app/matches', labelKey: 'nav.member.matchHub', fallback: 'Match Hub' },
  { to: '/app/leaderboard', labelKey: 'nav.member.leaderboard', fallback: 'Leaderboard' },
  { to: '/app/community', labelKey: 'nav.member.community', fallback: 'Community Feed' },
  { to: '/app/hall-of-fame', labelKey: 'nav.member.hall', fallback: 'Hall of Fame' },
  { to: '/news', labelKey: 'nav.public.news', fallback: 'Public News' },
] as const;

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const bundle = useContentBundle();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiRequest<Dashboard>('/admin/dashboard', { token: accessToken }),
  });

  const eyebrow = useContent('admin.dashboard.eyebrow', 'Admin');
  const title = useContent('admin.dashboard.title', 'Dashboard');
  const description = useContent(
    'admin.dashboard.description',
    'Committee control center — all tools are in the sidebar and below.',
  );
  const loadingText = useContent('admin.dashboard.loading', 'Loading stats...');
  const errorText = useContent('admin.dashboard.error', 'Unable to load dashboard.');
  const quickHeading = useContent('admin.dashboard.quickHeading', 'Quick access — all admin tools');
  const previewTitle = useContent('admin.dashboard.preview.title', 'Member app preview');
  const previewBody = useContent(
    'admin.dashboard.preview.body',
    'Test the member experience the same way supporters will see it.',
  );

  const statMembersLabel = useContent('admin.dashboard.stat.members.label', 'Members');
  const statMembersHint = useContent(
    'admin.dashboard.stat.members.hint',
    '{active} active · {invited} invited',
  );
  const statApplicationsLabel = useContent('admin.dashboard.stat.applications.label', 'Applications');
  const statApplicationsHint = useContent('admin.dashboard.stat.applications.hint', 'Pending review');
  const statInactiveLabel = useContent('admin.dashboard.stat.inactive.label', 'Inactive 30d');
  const statInactiveHint = useContent('admin.dashboard.stat.inactive.hint', 'No recent login');
  const statPredictionsLabel = useContent('admin.dashboard.stat.predictions.label', 'Predictions');
  const statPredictionsHint = useContent('admin.dashboard.stat.predictions.hint', 'Total submitted');
  const statMatchesLabel = useContent('admin.dashboard.stat.matches.label', 'Upcoming matches');
  const statMatchesHint = useContent('admin.dashboard.stat.matches.hint', 'Open for predictions');
  const statEventsLabel = useContent('admin.dashboard.stat.events.label', 'Events');
  const statEventsHint = useContent('admin.dashboard.stat.events.hint', 'Community events');

  const stats = data
    ? [
        {
          key: 'members',
          label: statMembersLabel,
          value: data.members.total,
          hint: statMembersHint
            .replace('{active}', String(data.members.activeMemberships))
            .replace('{invited}', String(data.members.pendingInvites)),
        },
        {
          key: 'applications',
          label: statApplicationsLabel,
          value: data.applications?.pending ?? 0,
          hint: statApplicationsHint,
        },
        {
          key: 'inactive',
          label: statInactiveLabel,
          value: data.members.inactive30Days ?? 0,
          hint: statInactiveHint,
        },
        {
          key: 'predictions',
          label: statPredictionsLabel,
          value: data.predictions.total,
          hint: statPredictionsHint,
        },
        {
          key: 'matches',
          label: statMatchesLabel,
          value: data.matches.upcoming,
          hint: statMatchesHint,
        },
        {
          key: 'events',
          label: statEventsLabel,
          value: data.events.total,
          hint: statEventsHint,
        },
      ]
    : [];

  return (
    <section className="space-y-8">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />

      {isLoading ? <p className="text-black/50">{loadingText}</p> : null}
      {error ? <p className="text-lfc-red">{errorText}</p> : null}

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat) => (
            <div key={stat.key} className="kop-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-black/40">{stat.label}</div>
              <div className="mt-2 text-3xl font-extrabold">{stat.value}</div>
              <p className="mt-1 text-xs text-black/50">{stat.hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-bold">{quickHeading}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_QUICK_LINK_SPECS.map((link) => (
            <Link key={link.to} to={link.to} className="kop-card kop-card-hover block p-5">
              <div className="font-bold text-lfc-red">
                {bundle[link.labelKey] ?? link.defaultLabel}
              </div>
              <p className="mt-1 text-sm text-black/55">{bundle[link.descKey] ?? link.defaultDesc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="kop-card p-6">
        <h2 className="mb-3 font-bold">{previewTitle}</h2>
        <p className="mb-4 text-sm text-black/55">{previewBody}</p>
        <div className="flex flex-wrap gap-2">
          {PREVIEW_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="kop-btn-secondary !py-2 !text-xs">
              {bundle[link.labelKey] ?? link.fallback}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
