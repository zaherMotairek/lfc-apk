import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { ADMIN_QUICK_LINKS } from '../../components/layout/nav-config';

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

export function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiRequest<Dashboard>('/admin/dashboard', { token: accessToken }),
  });

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Committee control center — all tools are in the sidebar and below."
      />

      {isLoading ? <p className="text-black/50">Loading stats...</p> : null}
      {error ? <p className="text-lfc-red">Unable to load dashboard.</p> : null}

      {data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: 'Members',
              value: data.members.total,
              hint: `${data.members.activeMemberships} active · ${data.members.pendingInvites} invited`,
            },
            {
              label: 'Applications',
              value: data.applications?.pending ?? 0,
              hint: 'Pending review',
            },
            {
              label: 'Inactive 30d',
              value: data.members.inactive30Days ?? 0,
              hint: 'No recent login',
            },
            { label: 'Predictions', value: data.predictions.total, hint: 'Total submitted' },
            { label: 'Upcoming matches', value: data.matches.upcoming, hint: 'Open for predictions' },
            { label: 'Events', value: data.events.total, hint: 'Community events' },
          ].map((stat) => (
            <div key={stat.label} className="kop-card p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-black/40">
                {stat.label}
              </div>
              <div className="mt-2 text-3xl font-extrabold">{stat.value}</div>
              <p className="mt-1 text-xs text-black/50">{stat.hint}</p>
            </div>
          ))}
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-bold">Quick access — all admin tools</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ADMIN_QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="kop-card kop-card-hover block p-5"
            >
              <div className="font-bold text-lfc-red">{link.label}</div>
              <p className="mt-1 text-sm text-black/55">{link.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="kop-card p-6">
        <h2 className="mb-3 font-bold">Member app preview</h2>
        <p className="mb-4 text-sm text-black/55">
          Test the member experience the same way supporters will see it.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { to: '/app', label: 'Member Home' },
            { to: '/app/matches', label: 'Match Hub' },
            { to: '/app/leaderboard', label: 'Leaderboard' },
            { to: '/app/community', label: 'Community Feed' },
            { to: '/app/hall-of-fame', label: 'Hall of Fame' },
            { to: '/news', label: 'Public News' },
          ].map((link) => (
            <Link key={link.to} to={link.to} className="kop-btn-secondary !py-2 !text-xs">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
