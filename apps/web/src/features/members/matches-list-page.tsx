import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { teamCrestLabel } from '../../lib/team-labels';
import { PageHeader } from '../../components/ui/page-header';
import { useContent } from '../content/content-provider';

type MatchItem = {
  id: string;
  opponent: string;
  competition: string;
  matchDate: string;
  status: string;
  homeTeamName: string;
  awayTeamName: string;
  predictionClosesAt?: string;
  predictionsOpen?: boolean;
  _count: { predictions: number };
};

function isPredictionsOpen(match: MatchItem) {
  if (typeof match.predictionsOpen === 'boolean') return match.predictionsOpen;
  if (match.status !== 'UPCOMING') return false;
  if (!match.predictionClosesAt) return true;
  return Date.now() < new Date(match.predictionClosesAt).getTime();
}

function displayStatus(match: MatchItem) {
  if (match.status === 'LIVE') return 'AWAITING RESULT';
  if (match.status === 'UPCOMING' && !isPredictionsOpen(match)) return 'CLOSED';
  return match.status;
}

function statusTone(status: string) {
  if (status === 'AWAITING RESULT') return 'kop-badge-gold';
  if (status === 'UPCOMING') return 'kop-badge-green';
  if (status === 'CLOSED') return 'kop-badge-red';
  if (status === 'FINISHED') return 'kop-badge';
  return 'kop-badge-red';
}

function formatKickoff(date: string) {
  return new Date(date).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MatchesListPage() {
  const matchesTitle = useContent('member.matches.title', 'Choose a match');
  const matchesDescription = useContent(
    'member.matches.description',
    'Tap a fixture, set your score, and submit your prediction before kickoff.',
  );
  const location = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['matches'],
    queryFn: () => apiRequest<MatchItem[]>('/matches'),
  });

  const sorted = useMemo(() => {
    const items = [...(data ?? [])];
    const rank = (match: MatchItem) => {
      if (match.status === 'LIVE') return 3;
      const status = displayStatus(match);
      if (status === 'UPCOMING') return 1;
      if (status === 'CLOSED') return 2;
      if (status === 'FINISHED') return 3;
      return 4;
    };
    return items.sort((a, b) => {
      const byStatus = rank(a) - rank(b);
      if (byStatus !== 0) return byStatus;
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
    });
  }, [data]);

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Match Hub"
        title={matchesTitle}
        description={matchesDescription}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="kop-card animate-pulse p-5">
              <div className="h-6 w-2/3 rounded bg-black/5" />
              <div className="mt-3 h-4 w-1/2 rounded bg-black/5" />
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          {error instanceof Error ? error.message : 'Unable to load matches.'}
        </div>
      ) : null}

      <div className="space-y-3">
        {sorted.map((match) => {
          const open = isPredictionsOpen(match) || match.status === 'LIVE';
          const label = displayStatus(match);
          return (
            <Link
              key={match.id}
              to={`/app/matches/${match.id}`}
              state={{ from: `${location.pathname}${location.search}` }}
              className="match-pick-card"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={statusTone(label)}>{label}</span>
                <span className="kop-badge">{match.competition}</span>
              </div>

              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="min-w-0 text-left">
                  <div className="match-pick-crest">{teamCrestLabel(match.homeTeamName)}</div>
                  <div className="mt-2 truncate text-sm font-extrabold text-ink">{match.homeTeamName}</div>
                </div>
                <div className="text-center">
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-black/35">VS</div>
                  <div className="mt-2 text-[11px] font-semibold text-black/45">{formatKickoff(match.matchDate)}</div>
                </div>
                <div className="min-w-0 text-right">
                  <div className="match-pick-crest ml-auto">{teamCrestLabel(match.awayTeamName)}</div>
                  <div className="mt-2 truncate text-sm font-extrabold text-ink">{match.awayTeamName}</div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/5 pt-4">
                <div className="text-xs text-black/45">
                  {match._count.predictions} community prediction{match._count.predictions === 1 ? '' : 's'}
                </div>
                <span className={open ? 'kop-btn-primary !px-4 !py-2 !text-xs' : 'kop-btn-secondary !px-4 !py-2 !text-xs'}>
                  {open ? 'Predict now' : match.status === 'FINISHED' ? 'View result' : 'View match'}
                </span>
              </div>
            </Link>
          );
        })}

        {!isLoading && !sorted.length ? (
          <p className="text-black/50">No matches yet. Committee will create the next one.</p>
        ) : null}
      </div>
    </section>
  );
}
