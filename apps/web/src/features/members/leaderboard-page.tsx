import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { useContent } from '../content/content-provider';

type LeaderboardResponse = {
  type: string;
  items: Array<{
    rank: number;
    fullName: string;
    totalPoints: number;
    predictionCount: number;
    accuracyRate: number;
  }>;
};

export function LeaderboardPage() {
  const leaderboardTitle = useContent('member.leaderboard.title', 'Leaderboard');
  const leaderboardSubtitle = useContent(
    'member.leaderboard.subtitle',
    'Overall ranking after Liverpool prediction scoring. Every match can change the order.',
  );
  const { accessToken } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['leaderboard-overall'],
    queryFn: () =>
      apiRequest<LeaderboardResponse>('/leaderboards/overall', {
        token: accessToken,
      }),
  });

  return (
    <section className="space-y-6">
      <div>
        <div className="leaderboard-hero">
          <div>
            <p className="kop-badge-gold">Season Race</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl">{leaderboardTitle}</h1>
            <p className="mt-2 max-w-2xl text-black/60">{leaderboardSubtitle}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="stat-pill">
              <div className="stat-pill-label">Ranked Members</div>
              <div className="stat-pill-value">{data?.items?.length ?? 0}</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-label">Leader Points</div>
              <div className="stat-pill-value">{data?.items?.[0]?.totalPoints ?? 0}</div>
            </div>
            <div className="stat-pill">
              <div className="stat-pill-label">Top Accuracy</div>
              <div className="stat-pill-value">{data?.items?.[0]?.accuracyRate ?? 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p className="text-[#c8102e]">Unable to load leaderboard.</p> : null}

      {data?.items?.length ? (
        <div className="grid gap-4 md:grid-cols-3">
          {data.items.slice(0, 3).map((item, index) => (
            <article
              key={`${item.rank}-${item.fullName}`}
              className={`leaderboard-podium ${index === 0 ? 'leaderboard-podium-first' : ''}`}
            >
              <div className="leaderboard-podium-rank">#{item.rank}</div>
              <h2 className="mt-4 text-xl font-extrabold text-ink">{item.fullName}</h2>
              <p className="mt-2 text-sm text-black/50">{item.predictionCount} predictions scored</p>
              <div className="mt-6 flex items-end justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                    Points
                  </div>
                  <div className="mt-1 text-3xl font-extrabold text-lfc-red">{item.totalPoints}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                    Accuracy
                  </div>
                  <div className="mt-1 text-2xl font-bold text-ink">{item.accuracyRate}%</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 md:hidden">
        {(data?.items ?? []).map((item) => (
          <article
            key={`${item.rank}-${item.fullName}-mobile`}
            className={`rounded-[1.75rem] border border-black/5 bg-white p-4 shadow-[0_10px_30px_rgba(16,20,24,0.06)] ${
              item.rank <= 3 ? 'bg-gradient-to-br from-[#fff8e5] via-white to-white' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className={`leaderboard-rank-pill ${item.rank === 1 ? 'leaderboard-rank-pill-first' : ''}`}>
                  #{item.rank}
                </span>
                <div className="mt-3 text-base font-extrabold text-ink">{item.fullName}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/35">Points</div>
                <div className="mt-1 text-2xl font-extrabold text-lfc-red">{item.totalPoints}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="stat-pill !p-3">
                <div className="stat-pill-label">Predictions</div>
                <div className="stat-pill-value !text-xl">{item.predictionCount}</div>
              </div>
              <div className="stat-pill !p-3">
                <div className="stat-pill-label">Accuracy</div>
                <div className="stat-pill-value !text-xl">{item.accuracyRate}%</div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-black/5 bg-white shadow-[0_20px_60px_rgba(16,20,24,0.08)] md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-black/10 bg-gradient-to-r from-black/[0.04] to-lfc-red/[0.04]">
            <tr>
              <th className="px-4 py-3">Rank</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Predictions</th>
              <th className="px-4 py-3">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {(data?.items ?? []).map((item) => (
              <tr
                key={`${item.rank}-${item.fullName}`}
                className={`border-b border-black/5 transition hover:bg-black/[0.02] ${
                  item.rank <= 3 ? 'bg-gold/5' : ''
                }`}
              >
                <td className="px-4 py-4 font-semibold">
                  <span className={`leaderboard-rank-pill ${item.rank === 1 ? 'leaderboard-rank-pill-first' : ''}`}>
                    #{item.rank}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="font-semibold text-ink">{item.fullName}</div>
                </td>
                <td className="px-4 py-4 font-bold text-lfc-red">{item.totalPoints}</td>
                <td className="px-4 py-4">{item.predictionCount}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-black/[0.04] px-3 py-1 font-semibold">
                    {item.accuracyRate}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!isLoading && !data?.items?.length ? (
        <p className="text-black/50">No ranked members yet. Scores appear after match scoring.</p>
      ) : null}
    </section>
  );
}
