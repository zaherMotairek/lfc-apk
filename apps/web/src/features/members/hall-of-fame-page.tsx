import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { useContent } from '../content/content-provider';

type HallOfFameResponse = {
  currentKingOfTheKop: null | {
    unlockedAt: string;
    user: { firstName: string; lastName: string; avatarUrl?: string | null };
    achievement: { name: string; description: string };
  };
  topPredictors: Array<{
    id: string;
    rank: number;
    totalPoints: number;
    user: { firstName: string; lastName: string };
  }>;
  recentAchievements: Array<{
    id: string;
    unlockedAt: string;
    user: { firstName: string; lastName: string };
    achievement: { name: string; description: string };
  }>;
};

export function HallOfFamePage() {
  const hallTitle = useContent('member.hall.title', 'Hall of Fame');
  const hallSubtitle = useContent('member.hall.subtitle', 'Prediction legends and community milestones.');
  const { data, isLoading, error } = useQuery({
    queryKey: ['hall-of-fame'],
    queryFn: () => apiRequest<HallOfFameResponse>('/hall-of-fame'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="kop-card h-40 animate-pulse" />
        <div className="kop-card h-60 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
        Unable to load Hall of Fame.
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Legends"
        title={hallTitle}
        description={hallSubtitle}
      />

      <div className="kop-gradient-hero relative overflow-hidden rounded-3xl p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 text-[120px] opacity-10">👑</div>
        <p className="kop-badge bg-white/15 !text-white/90">King of the Kop</p>
        {data.currentKingOfTheKop ? (
          <>
            <p className="mt-4 text-4xl font-extrabold">
              {data.currentKingOfTheKop.user.firstName} {data.currentKingOfTheKop.user.lastName}
            </p>
            <p className="mt-2 text-sm text-white/70">
              {data.currentKingOfTheKop.achievement.description}
            </p>
          </>
        ) : (
          <p className="mt-4 text-xl text-white/70">No king crowned yet — lead the leaderboard!</p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="kop-card p-6">
          <h2 className="text-lg font-bold">Top Predictors</h2>
          <div className="mt-4 space-y-2">
            {data.topPredictors.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between rounded-xl p-4 ${
                  item.rank === 1
                    ? 'border border-gold/30 bg-gold/10'
                    : 'border border-black/5 bg-black/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${
                      item.rank === 1 ? 'bg-gold text-white' : 'bg-black/5 text-black/50'
                    }`}
                  >
                    {item.rank}
                  </span>
                  <p className="font-semibold">
                    {item.user.firstName} {item.user.lastName}
                  </p>
                </div>
                <p className="font-extrabold text-lfc-red">{item.totalPoints} pts</p>
              </div>
            ))}
            {!data.topPredictors.length ? (
              <p className="py-6 text-center text-sm text-black/40">No rankings yet.</p>
            ) : null}
          </div>
        </div>

        <div className="kop-card p-6">
          <h2 className="text-lg font-bold">Recent Achievements</h2>
          <div className="mt-4 space-y-2">
            {data.recentAchievements.map((item) => (
              <div key={item.id} className="rounded-xl border border-black/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏅</span>
                  <p className="font-semibold">{item.achievement.name}</p>
                </div>
                <p className="mt-1 text-sm text-black/55">
                  {item.user.firstName} {item.user.lastName}
                </p>
                <p className="mt-1 text-xs text-black/35">
                  {new Date(item.unlockedAt).toLocaleString()}
                </p>
              </div>
            ))}
            {!data.recentAchievements.length ? (
              <p className="py-6 text-center text-sm text-black/40">No achievements yet.</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
