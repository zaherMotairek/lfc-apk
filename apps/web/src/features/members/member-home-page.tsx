import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { QuickActionCard } from '../../components/ui/quick-action-card';
import { useContent } from '../content/content-provider';

export function MemberHomePage() {
  const welcomeLabel = useContent('member.home.welcome', 'Welcome back');
  const homeSubtitle = useContent(
    'member.home.subtitle',
    'Your weekly home for Liverpool match predictions, community events, and your official digital membership identity.',
  );
  const { user } = useAuth();

  return (
    <section>
      {/* Welcome banner */}
      <div className="kop-gradient-hero mb-8 overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-lfc-red/20 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/70">{welcomeLabel}</p>
            <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75">{homeSubtitle}</p>
          </div>
          <Link
            to="/app/membership-card"
            className="rounded-2xl bg-white/15 px-5 py-4 text-center backdrop-blur transition hover:bg-white/20"
          >
            <div className="text-2xl">🎫</div>
            <div className="mt-1 text-xs font-bold">My Card</div>
          </Link>
        </div>
      </div>

      {/* Quick actions grid */}
      <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-black/40">
        Quick Access
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          to="/app/matches"
          title="Match Hub"
          description="Predict before kickoff and earn points."
          accent="red"
          icon="⚽"
        />
        <QuickActionCard
          to="/app/membership-card"
          title="My card"
          description="QR membership card for events."
          icon="🎫"
        />
        <QuickActionCard
          to="/app/leaderboard"
          title="Leaderboard"
          description="See who leads the Kop this season."
          icon="🏆"
        />
        <QuickActionCard
          to="/app/community"
          title="Community Feed"
          description="Events, achievements, and club updates."
          icon="📣"
        />
        <QuickActionCard
          to="/app/profile"
          title="My Profile"
          description="Avatar, stats, XP, and membership."
          icon="👤"
        />
        <QuickActionCard
          to="/newsletter"
          title="Newsletter"
          description="Read RedLeb Dispatch as a PDF."
          accent="dark"
          icon="🗞️"
        />
      </div>
    </section>
  );
}
