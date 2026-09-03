import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { compactTeamLabel, isLiverpoolTeamName, teamCrestLabel } from '../../lib/team-labels';

function formatWinnerLabel(value: string, homeTeamName: string, awayTeamName: string) {
  if (value === 'HOME_WIN') return `${homeTeamName} win`;
  if (value === 'AWAY_WIN') return `${awayTeamName} win`;
  if (value === 'DRAW') return 'Draw';
  return value;
}

function winnerFromScores(home: number, away: number) {
  if (home > away) return 'HOME_WIN';
  if (away > home) return 'AWAY_WIN';
  return 'DRAW';
}

function defaultPredictionForMatch(homeTeamName: string, awayTeamName: string) {
  if (isLiverpoolTeamName(homeTeamName)) {
    return {
      predictedHomeScore: 2,
      predictedAwayScore: 1,
      winnerPrediction: winnerFromScores(2, 1),
    };
  }
  if (isLiverpoolTeamName(awayTeamName)) {
    return {
      predictedHomeScore: 1,
      predictedAwayScore: 2,
      winnerPrediction: winnerFromScores(1, 2),
    };
  }
  return {
    predictedHomeScore: 2,
    predictedAwayScore: 1,
    winnerPrediction: winnerFromScores(2, 1),
  };
}

type MatchHub = {
  id: string;
  opponent: string;
  competition: string;
  stadium?: string | null;
  matchDate: string;
  status: string;
  homeTeamName: string;
  awayTeamName: string;
  isLiverpoolMatch?: boolean;
  liverpoolPlayers?: Array<{ number: number; name: string }>;
  scoring?: {
    exactScorePoints: number;
    winnerPoints: number;
    liverpoolMultiplier: number;
    firstGoalscorerPoints: number;
    cleanSheetPoints: number;
  };
  predictionClosesAt: string;
  predictionsOpen: boolean;
  countdownSeconds: number;
  liveHomeScore?: number | null;
  liveAwayScore?: number | null;
  liveGoals?: Array<{
    id: string;
    minute?: number | null;
    scorerName?: string | null;
    homeScoreAfter: number;
    awayScoreAfter: number;
    isLiverpoolGoal: boolean;
    createdAt: string;
  }>;
  communityStats: {
    predictionCount: number;
    homeWinPercentage: number;
    drawPercentage: number;
    awayWinPercentage: number;
    mostPickedWinner: string;
  };
  myPrediction: null | {
    predictedHomeScore: number;
    predictedAwayScore: number;
    winnerPrediction: string;
    firstLiverpoolGoalscorer?: string | null;
    manOfTheMatchPrediction?: string | null;
    cleanSheetPrediction?: boolean | null;
    bothTeamsToScorePrediction?: boolean | null;
    totalPoints: number;
    calculatedAt?: string | null;
  };
  result: null | {
    finalHomeScore: number;
    finalAwayScore: number;
    winningOutcome: string;
  };
};

function ScoreStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="score-stepper">
      <div className="score-stepper-label">{label}</div>
      <div className="score-stepper-controls">
        <button type="button" className="score-stepper-btn" onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Decrease ${label}`}>
          −
        </button>
        <div className="score-stepper-value">{value}</div>
        <button type="button" className="score-stepper-btn" onClick={() => onChange(Math.min(20, value + 1))} aria-label={`Increase ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

export function MatchHubPage() {
  const { id = '' } = useParams();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    predictedHomeScore: 2,
    predictedAwayScore: 1,
    winnerPrediction: 'HOME_WIN' as string,
    firstLiverpoolGoalscorer: '',
    cleanSheetPrediction: null as boolean | null,
  });
  const [message, setMessage] = useState<string | null>(null);

  const hubQuery = useQuery({
    queryKey: ['match-hub', id, accessToken],
    queryFn: () => {
      if (!accessToken) {
        throw new Error('Session expired. Please log in again.');
      }
      return apiRequest<MatchHub>(`/matches/${id}`, {
        token: accessToken,
      });
    },
    enabled: Boolean(id),
    retry: 1,
    refetchInterval: (query) => (query.state.data?.status === 'LIVE' ? 10_000 : false),
  });

  useEffect(() => {
    const match = hubQuery.data;
    if (!match) {
      return;
    }

    const saved = match.myPrediction;
    if (saved) {
      setForm({
        predictedHomeScore: saved.predictedHomeScore,
        predictedAwayScore: saved.predictedAwayScore,
        winnerPrediction: winnerFromScores(saved.predictedHomeScore, saved.predictedAwayScore),
        firstLiverpoolGoalscorer: saved.firstLiverpoolGoalscorer ?? '',
        cleanSheetPrediction:
          typeof saved.cleanSheetPrediction === 'boolean' ? saved.cleanSheetPrediction : null,
      });
      return;
    }

    const defaults = defaultPredictionForMatch(match.homeTeamName, match.awayTeamName);
    setForm({
      ...defaults,
      firstLiverpoolGoalscorer: '',
      cleanSheetPrediction: null,
    });
  }, [hubQuery.data?.id, hubQuery.data?.myPrediction]);

  const submitMutation = useMutation({
    mutationFn: () => {
      const isLfc = hubQuery.data?.isLiverpoolMatch === true;
      return apiRequest<{ message: string }>('/predictions', {
        method: 'POST',
        token: accessToken,
        body: {
          matchId: id,
          predictedHomeScore: form.predictedHomeScore,
          predictedAwayScore: form.predictedAwayScore,
          winnerPrediction: form.winnerPrediction,
          ...(isLfc
            ? {
                firstLiverpoolGoalscorer: form.firstLiverpoolGoalscorer || undefined,
                cleanSheetPrediction: form.cleanSheetPrediction,
              }
            : {}),
        },
      });
    },
    onSuccess: (result) => {
      setMessage(result.message);
      queryClient.invalidateQueries({ queryKey: ['match-hub', id] });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : 'Prediction failed');
    },
  });

  const countdownLabel = useMemo(() => {
    const total = hubQuery.data?.countdownSeconds ?? 0;
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }, [hubQuery.data?.countdownSeconds]);

  function setHomeScore(next: number) {
    setForm((prev) => ({
      ...prev,
      predictedHomeScore: next,
      winnerPrediction: winnerFromScores(next, prev.predictedAwayScore),
    }));
  }

  function setAwayScore(next: number) {
    setForm((prev) => ({
      ...prev,
      predictedAwayScore: next,
      winnerPrediction: winnerFromScores(prev.predictedHomeScore, next),
    }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (hubQuery.data?.isLiverpoolMatch && typeof form.cleanSheetPrediction !== 'boolean') {
      setMessage('Choose Yes or No for Liverpool clean sheet.');
      return;
    }
    submitMutation.mutate();
  }

  if (!id) {
    return (
      <section className="space-y-4">
        <p className="text-[#c8102e]">Invalid match link.</p>
      </section>
    );
  }

  if (hubQuery.isFetching && !hubQuery.data) {
    return (
      <section className="space-y-4">
        <div className="kop-card animate-pulse space-y-4 p-6">
          <div className="h-8 w-2/3 rounded bg-black/5" />
          <div className="h-4 w-1/2 rounded bg-black/5" />
        </div>
      </section>
    );
  }

  if (hubQuery.error || !hubQuery.data) {
    return (
      <section className="space-y-4">
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          {hubQuery.error instanceof Error ? hubQuery.error.message : 'Match not found'}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="kop-btn-secondary" onClick={() => hubQuery.refetch()}>
            Retry
          </button>
          <Link to="/login" state={{ from: { pathname: `/app/matches/${id}` } }} className="kop-btn-primary">
            Log in again
          </Link>
        </div>
      </section>
    );
  }

  const match = hubQuery.data;
  const isLfc = match.isLiverpoolMatch === true;
  const scoring = match.scoring;
  const exactPts = isLfc
    ? (scoring?.exactScorePoints ?? 3) * (scoring?.liverpoolMultiplier ?? 2)
    : scoring?.exactScorePoints ?? 3;
  const winnerPts = isLfc
    ? (scoring?.winnerPoints ?? 1) * (scoring?.liverpoolMultiplier ?? 2)
    : scoring?.winnerPoints ?? 1;

  return (
    <section className="space-y-5 pb-8 md:pb-0">

      <div className="match-hub-hero !px-4 !py-5 md:!px-8 md:!py-8">
        <div className="match-hub-hero-top">
          <span className="kop-badge-red">{match.competition}</span>
          <span className="kop-badge">{match.status}</span>
          {isLfc && match.status === 'LIVE' ? <span className="live-match-badge">LIVE</span> : null}
        </div>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-center">
            <div className="match-hub-crest mx-auto">{teamCrestLabel(match.homeTeamName)}</div>
            <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-white sm:text-sm">
              {match.homeTeamName}
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-black tracking-tight text-white md:text-5xl">
              {isLfc && match.status === 'LIVE'
                ? `${match.liveHomeScore ?? 0}:${match.liveAwayScore ?? 0}`
                : 'VS'}
            </div>
            <p className="mt-2 text-[11px] text-white/65">
              {isLfc && match.status === 'LIVE' ? 'LIVE NOW' : countdownLabel}
            </p>
          </div>
          <div className="text-center">
            <div className="match-hub-crest mx-auto">{teamCrestLabel(match.awayTeamName)}</div>
            <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-white sm:text-sm">
              {match.awayTeamName}
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/60">
          {match.stadium ?? 'TBC'} · {new Date(match.matchDate).toLocaleString()}
        </p>
      </div>

      {isLfc && match.liveGoals?.length ? (
        <div className="kop-card p-4">
          <h2 className="text-base font-bold">Live timeline</h2>
          <div className="mt-3 space-y-2">
            {match.liveGoals.map((goal) => (
              <div
                key={goal.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  goal.isLiverpoolGoal ? 'bg-lfc-red/10 text-lfc-red' : 'bg-black/5 text-black/70'
                }`}
              >
                <span>{goal.isLiverpoolGoal ? '⚽' : '⚪'}</span>
                <span className="font-semibold">{goal.minute != null ? `${goal.minute}'` : '—'}</span>
                <span className="flex-1">
                  {goal.isLiverpoolGoal ? goal.scorerName ?? 'Liverpool goal' : `${match.awayTeamName} score`}
                </span>
                <span className="font-bold">
                  {goal.homeScoreAfter}–{goal.awayScoreAfter}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {match.result ? (
        <div className="kop-card overflow-hidden p-4">
          <h2 className="text-base font-bold">Final Result</h2>
          <div className="mt-3 rounded-2xl bg-ink px-5 py-4 text-center text-white">
            <div className="text-3xl font-extrabold">
              {match.result.finalHomeScore} - {match.result.finalAwayScore}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
              {formatWinnerLabel(match.result.winningOutcome, match.homeTeamName, match.awayTeamName)}
            </div>
          </div>
          {match.myPrediction?.calculatedAt ? (
            <p className="mt-3 text-sm font-semibold text-lfc-red">
              Your points: {match.myPrediction.totalPoints}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="stat-pill !p-4 !text-left">
          <div className="stat-pill-label">Predictions open?</div>
          <div className="mt-1 text-lg font-extrabold text-ink">
            {match.predictionsOpen ? 'Yes' : 'Closed'}
          </div>
        </div>
        <div className="stat-pill !p-4 !text-left">
          <div className="stat-pill-label">Community</div>
          <div className="mt-1 text-lg font-extrabold text-ink">
            {match.communityStats.predictionCount}
          </div>
        </div>
        <div className="stat-pill !p-4 !text-left">
          <div className="stat-pill-label">Most picked</div>
          <div className="mt-1 text-sm font-extrabold text-ink">
            {formatWinnerLabel(match.communityStats.mostPickedWinner, match.homeTeamName, match.awayTeamName)}
          </div>
        </div>
      </div>

      <div className="kop-card p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold">Your Prediction</h2>
            <p className="mt-1 text-sm text-black/50">
              Score + winner{isLfc ? ' + Liverpool bonus picks' : ''}.
            </p>
          </div>
          {match.myPrediction ? <span className="kop-badge-green">Saved</span> : null}
        </div>

        <div className="mb-4 rounded-2xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm text-black/65">
          <div className="font-semibold text-ink">Points this match</div>
          <ul className="mt-2 space-y-1">
            <li>Exact score: {exactPts} pt{exactPts === 1 ? '' : 's'}</li>
            <li>Correct winner: {winnerPts} pt{winnerPts === 1 ? '' : 's'}</li>
            {isLfc ? (
              <>
                <li>First Liverpool goalscorer: {scoring?.firstGoalscorerPoints ?? 1} pt</li>
                <li>Liverpool clean sheet: {scoring?.cleanSheetPoints ?? 1} pt</li>
              </>
            ) : null}
          </ul>
          {isLfc ? (
            <p className="mt-2 text-xs text-black/45">Liverpool matches pay double on score and winner.</p>
          ) : null}
        </div>

        {match.myPrediction ? (
          <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Current: {match.myPrediction.predictedHomeScore}-{match.myPrediction.predictedAwayScore} ·{' '}
            {formatWinnerLabel(
              winnerFromScores(match.myPrediction.predictedHomeScore, match.myPrediction.predictedAwayScore),
              match.homeTeamName,
              match.awayTeamName,
            )}
            {isLfc && typeof match.myPrediction.cleanSheetPrediction === 'boolean' ? (
              <> · Clean sheet: {match.myPrediction.cleanSheetPrediction ? 'Yes' : 'No'}</>
            ) : null}
          </div>
        ) : null}

        {match.predictionsOpen ? (
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                Step 1 · Final score
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <ScoreStepper
                  label={match.homeTeamName}
                  value={form.predictedHomeScore}
                  onChange={setHomeScore}
                />
                <div className="hidden pb-6 text-center text-3xl font-black text-black/20 sm:block">:</div>
                <ScoreStepper
                  label={match.awayTeamName}
                  value={form.predictedAwayScore}
                  onChange={setAwayScore}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                Step 2 · Match winner
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    ['HOME_WIN', match.homeTeamName],
                    ['DRAW', 'Draw'],
                    ['AWAY_WIN', match.awayTeamName],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    className={`winner-pick-btn ${form.winnerPrediction === value ? 'winner-pick-btn-active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, winnerPrediction: value }))}
                  >
                    {value === 'DRAW' ? label : compactTeamLabel(label)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-black/40">Auto-updates when you change the score.</p>
            </div>

            {isLfc ? (
              <div className="space-y-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-black/40">
                  Step 3 · Liverpool bonus (+1 pt each)
                </div>
                <label className="block text-sm font-medium">
                  First Liverpool goalscorer
                  <select
                    className="kop-input mt-1"
                    value={form.firstLiverpoolGoalscorer}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, firstLiverpoolGoalscorer: e.target.value }))
                    }
                  >
                    <option value="">Select a player…</option>
                    {(match.liverpoolPlayers ?? []).map((player) => (
                      <option key={player.name} value={player.name}>
                        {player.number} — {player.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <div className="text-sm font-medium">Liverpool clean sheet?</div>
                  <p className="mt-1 text-xs text-black/45">+1 pt if you pick the correct answer.</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(
                      [
                        [true, 'Yes'],
                        [false, 'No'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={label}
                        type="button"
                        className={`winner-pick-btn ${
                          form.cleanSheetPrediction === value ? 'winner-pick-btn-active' : ''
                        }`}
                        onClick={() =>
                          setForm((prev) => ({ ...prev, cleanSheetPrediction: value }))
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {message?.includes('clean sheet') ? (
                    <p className="mt-2 text-sm font-medium text-lfc-red">{message}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="border-t border-black/5 pt-6">
              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="kop-btn-primary w-full"
              >
                {submitMutation.isPending
                  ? 'Saving...'
                  : match.myPrediction
                    ? `Update ${form.predictedHomeScore}-${form.predictedAwayScore}`
                    : `Submit ${form.predictedHomeScore}-${form.predictedAwayScore}`}
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-black/60">
            Predictions are closed. Closed at {new Date(match.predictionClosesAt).toLocaleString()}.
          </p>
        )}

        {message && !message.includes('clean sheet') ? (
          <p className="mt-3 text-sm text-black/70">{message}</p>
        ) : null}
      </div>

      <div className="kop-card p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
          Community picks
        </div>
        <div className="mt-4 space-y-3">
          {[
            { label: match.homeTeamName, value: match.communityStats.homeWinPercentage },
            { label: 'Draw', value: match.communityStats.drawPercentage },
            { label: match.awayTeamName, value: match.communityStats.awayWinPercentage },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-black/60">{item.label}</span>
                <span className="font-semibold text-ink">{item.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#101418] via-lfc-red to-[#f18ca0]"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
