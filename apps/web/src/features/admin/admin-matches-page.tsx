import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { isDatetimeLocalInPast, minDatetimeLocal } from '../../lib/datetime-local';
import { PageHeader } from '../../components/ui/page-header';

type LiverpoolSquadPlayer = {
  number: number;
  name: string;
};

const LIVERPOOL_SQUAD_2025_26: LiverpoolSquadPlayer[] = [
  { number: 1, name: 'Alisson Becker' },
  { number: 25, name: 'Giorgi Mamardashvili' },
  { number: 28, name: 'Freddie Woodman' },
  { number: 2, name: 'Joe Gomez' },
  { number: 4, name: 'Virgil van Dijk' },
  { number: 5, name: 'Jeremy Jacquet' },
  { number: 6, name: 'Milos Kerkez' },
  { number: 12, name: 'Conor Bradley' },
  { number: 15, name: 'Giovanni Leoni' },
  { number: 21, name: 'Kostas Tsimikas' },
  { number: 30, name: 'Jeremie Frimpong' },
  { number: 33, name: 'Ronald Araujo' },
  { number: 47, name: 'Calvin Ramsay' },
  { number: 3, name: 'Wataru Endo' },
  { number: 7, name: 'Florian Wirtz' },
  { number: 8, name: 'Dominik Szoboszlai' },
  { number: 10, name: 'Alexis Mac Allister' },
  { number: 17, name: 'Curtis Jones' },
  { number: 19, name: 'Harvey Elliott' },
  { number: 38, name: 'Ryan Gravenberch' },
  { number: 42, name: 'Trey Nyoni' },
  { number: 43, name: 'Stefan Bajcetic' },
  { number: 53, name: 'James McConnel' },
  { number: 9, name: 'Alexander Isak' },
  { number: 14, name: 'Federico Chiesa' },
  { number: 18, name: 'Cody Gakpo' },
  { number: 22, name: 'Hugo Ekitike' },
  { number: 23, name: 'Victor Munoz' },
  { number: 73, name: 'Rio Ngumoha' },
];

function formatLiverpoolPlayerOption(player: LiverpoolSquadPlayer): string {
  return `${player.number} — ${player.name}`;
}

function isLiverpoolTeamName(name: string): boolean {
  return name.trim().toLowerCase().includes('liverpool');
}

function isLiverpoolFixture(homeTeamName: string, awayTeamName: string): boolean {
  return isLiverpoolTeamName(homeTeamName) || isLiverpoolTeamName(awayTeamName);
}

type AdminMatchItem = {
  id: string;
  opponent: string;
  competition: string;
  stadium?: string | null;
  matchDate: string;
  status: string;
  liveHomeScore: number | null;
  liveAwayScore: number | null;
  finalHomeScore: number | null;
  finalAwayScore: number | null;
  homeTeamName: string;
  awayTeamName: string;
  winningOutcome?: string | null;
  firstLiverpoolScorer?: string | null;
  manOfTheMatch?: string | null;
  cleanSheetResult?: boolean | null;
  bothTeamsToScoreResult?: boolean | null;
  predictionClosesAt?: string;
  _count?: { predictions: number };
};

type MatchPanel = 'live' | 'result';

const STATUS_GROUPS = [
  { key: 'LIVE', label: 'Live now' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'FINISHED', label: 'Finished' },
  { key: 'CANCELED', label: 'Canceled' },
] as const;

function statusBadge(status: string) {
  if (status === 'LIVE') return 'live-match-badge';
  if (status === 'UPCOMING') return 'kop-badge-green';
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

function scoreLabel(match: AdminMatchItem) {
  if (match.status === 'FINISHED' && match.finalHomeScore != null && match.finalAwayScore != null) {
    return `${match.finalHomeScore}–${match.finalAwayScore}`;
  }
  if (match.liveHomeScore != null || match.liveAwayScore != null) {
    return `${match.liveHomeScore ?? 0}–${match.liveAwayScore ?? 0}`;
  }
  return 'vs';
}

function liverpoolCleanSheet(
  homeTeamName: string,
  awayTeamName: string,
  homeScore: number,
  awayScore: number,
): boolean {
  if (isLiverpoolTeamName(homeTeamName)) return awayScore === 0;
  if (isLiverpoolTeamName(awayTeamName)) return homeScore === 0;
  return false;
}

function nextWinningOutcome(home: number, away: number) {
  if (home > away) return 'HOME_WIN';
  if (home < away) return 'AWAY_WIN';
  return 'DRAW';
}

export function AdminMatchesPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => apiRequest<AdminMatchItem[]>('/matches'),
    refetchInterval: 10_000,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createKind, setCreateKind] = useState<'liverpool' | 'other' | null>(null);
  const [panel, setPanel] = useState<MatchPanel>('live');
  const [createForm, setCreateForm] = useState({
    opponent: '',
    competition: 'Premier League',
    stadium: 'Anfield',
    homeTeamName: '',
    matchDate: '',
    predictionClosesAt: '',
    awayTeamName: '',
  });
  const [resultForm, setResultForm] = useState({
    finalHomeScore: 0,
    finalAwayScore: 0,
    winningOutcome: 'HOME_WIN',
    firstLiverpoolScorer: '',
    manOfTheMatch: '',
    cleanSheetResult: false,
    bothTeamsToScoreResult: false,
  });
  const [liveForm, setLiveForm] = useState({
    homeScore: 0,
    awayScore: 0,
    scorerName: '',
    minute: 1,
    comment: '',
    updateNote: '',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [isRecordingGoal, setIsRecordingGoal] = useState(false);
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);

  const grouped = useMemo(() => {
    const items = matches ?? [];
    return STATUS_GROUPS.map((group) => ({
      ...group,
      items: items
        .filter((match) => match.status === group.key)
        .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()),
    })).filter((group) => group.items.length > 0);
  }, [matches]);

  const selected = useMemo(
    () => matches?.find((match) => match.id === selectedId) ?? null,
    [matches, selectedId],
  );

  useEffect(() => {
    if (!matches?.length) return;
    if (selectedId && matches.some((match) => match.id === selectedId)) return;
    const live = matches.find((match) => match.status === 'LIVE');
    const upcoming = matches.find((match) => match.status === 'UPCOMING');
    setSelectedId(live?.id ?? upcoming?.id ?? matches[0].id);
  }, [matches, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setLiveForm({
      homeScore: selected.liveHomeScore ?? selected.finalHomeScore ?? 0,
      awayScore: selected.liveAwayScore ?? selected.finalAwayScore ?? 0,
      scorerName: '',
      minute: 1,
      comment: '',
      updateNote: '',
    });
    const home = selected.finalHomeScore ?? selected.liveHomeScore ?? 0;
    const away = selected.finalAwayScore ?? selected.liveAwayScore ?? 0;
    setResultForm({
      finalHomeScore: home,
      finalAwayScore: away,
      winningOutcome: selected.winningOutcome ?? nextWinningOutcome(home, away),
      firstLiverpoolScorer: selected.firstLiverpoolScorer ?? '',
      manOfTheMatch: selected.manOfTheMatch ?? '',
      cleanSheetResult:
        typeof selected.cleanSheetResult === 'boolean'
          ? selected.cleanSheetResult
          : liverpoolCleanSheet(selected.homeTeamName, selected.awayTeamName, home, away),
      bothTeamsToScoreResult: selected.bothTeamsToScoreResult ?? false,
    });
    const isLfc = isLiverpoolFixture(selected.homeTeamName, selected.awayTeamName);
    setPanel(selected.status === 'FINISHED' || !isLfc ? 'result' : 'live');
  }, [selected?.id]);

  async function refreshMatches() {
    await queryClient.invalidateQueries({ queryKey: ['matches'] });
  }

  async function deleteMatch(match: AdminMatchItem) {
    if (!window.confirm(`Delete match vs ${match.opponent}? This cannot be undone.`)) return;
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>(`/matches/${match.id}`, {
        method: 'DELETE',
        token: accessToken,
      });
      setMessage(result.message);
      if (selectedId === match.id) setSelectedId(null);
      await refreshMatches();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  const selectedIsLfc = selected
    ? isLiverpoolFixture(selected.homeTeamName, selected.awayTeamName)
    : false;

  async function createMatch(event: FormEvent) {
    event.preventDefault();
    if (!createKind) return;
    setMessage(null);
    if (
      isDatetimeLocalInPast(createForm.matchDate) ||
      isDatetimeLocalInPast(createForm.predictionClosesAt)
    ) {
      setMessage('Kick-off and predictions close must be today or later.');
      return;
    }
    const kickoffMs = new Date(createForm.matchDate).getTime();
    const closesMs = new Date(createForm.predictionClosesAt).getTime();
    if (closesMs > kickoffMs) {
      setMessage('Predictions must close at or before kick-off.');
      return;
    }
    try {
      const isLfcCreate = createKind === 'liverpool';
      const homeTeam = isLfcCreate ? 'Liverpool' : createForm.homeTeamName.trim();
      const awayTeam = isLfcCreate
        ? createForm.awayTeamName || createForm.opponent
        : createForm.awayTeamName.trim();
      const opponent = isLfcCreate ? createForm.opponent : `${homeTeam} vs ${awayTeam}`;

      const result = await apiRequest<{ message: string; matchId: string }>('/matches', {
        method: 'POST',
        token: accessToken,
        body: {
          opponent,
          competition: createForm.competition,
          stadium: createForm.stadium,
          matchDate: new Date(createForm.matchDate).toISOString(),
          predictionClosesAt: new Date(createForm.predictionClosesAt).toISOString(),
          homeTeamName: homeTeam,
          awayTeamName: awayTeam,
        },
      });
      setMessage(result.message);
      setSelectedId(result.matchId);
      setCreateKind(null);
      setCreateForm({
        opponent: '',
        competition: 'Premier League',
        stadium: 'Anfield',
        homeTeamName: '',
        matchDate: '',
        predictionClosesAt: '',
        awayTeamName: '',
      });
      await refreshMatches();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create match');
    }
  }

  function openCreateForm(kind: 'liverpool' | 'other') {
    setCreateKind(kind);
    setCreateForm({
      opponent: '',
      competition: 'Premier League',
      stadium: kind === 'liverpool' ? 'Anfield' : '',
      homeTeamName: '',
      matchDate: '',
      predictionClosesAt: '',
      awayTeamName: '',
    });
  }

  async function startLiveMatch() {
    if (!selected) return;
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>(`/matches/${selected.id}/live`, {
        method: 'PUT',
        token: accessToken,
      });
      setMessage(result.message);
      setPanel('live');
      await refreshMatches();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to start live match');
    }
  }

  async function recordGoal(isLiverpoolGoal: boolean) {
    if (!selected) {
      setMessage('Select a match first.');
      return;
    }

    setMessage(null);
    setIsRecordingGoal(true);

    const nextHome = isLiverpoolGoal ? liveForm.homeScore + 1 : liveForm.homeScore;
    const nextAway = isLiverpoolGoal ? liveForm.awayScore : liveForm.awayScore + 1;

    try {
      const result = await apiRequest<{ message: string }>(`/matches/${selected.id}/goals`, {
        method: 'POST',
        token: accessToken,
        body: {
          homeScore: nextHome,
          awayScore: nextAway,
          scorerName: liveForm.scorerName || undefined,
          minute: Number(liveForm.minute),
          isLiverpoolGoal,
          comment: liveForm.comment.trim() || undefined,
        },
      });
      setLiveForm((prev) => ({
        ...prev,
        homeScore: nextHome,
        awayScore: nextAway,
        minute: prev.minute + 1,
        scorerName: '',
        comment: '',
      }));
      setResultForm((prev) => ({
        ...prev,
        finalHomeScore: nextHome,
        finalAwayScore: nextAway,
        winningOutcome: nextWinningOutcome(nextHome, nextAway),
        cleanSheetResult: nextAway === 0,
        bothTeamsToScoreResult: nextHome > 0 && nextAway > 0,
      }));
      setMessage(result.message);
      await refreshMatches();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to record goal');
    } finally {
      setIsRecordingGoal(false);
    }
  }

  async function sendLiveUpdate(kind: 'HALF_TIME' | 'SECOND_HALF' | 'FULL_TIME' | 'COMMENT') {
    if (!selected) return;
    if (kind === 'COMMENT' && !liveForm.updateNote.trim()) {
      setMessage('Write a comment first, or tap Half-time / Second half / Full-time.');
      return;
    }

    setMessage(null);
    setIsSendingUpdate(true);
    try {
      const result = await apiRequest<{ message: string }>(`/matches/${selected.id}/updates`, {
        method: 'POST',
        token: accessToken,
        body: {
          kind,
          minute: Number(liveForm.minute) || undefined,
          comment: liveForm.updateNote.trim() || undefined,
        },
      });
      setLiveForm((prev) => ({ ...prev, updateNote: '' }));
      setMessage(result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send update');
    } finally {
      setIsSendingUpdate(false);
    }
  }

  async function saveResult(event: FormEvent) {
    event.preventDefault();
    if (!selected) return;
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>(`/matches/${selected.id}/result`, {
        method: 'PUT',
        token: accessToken,
        body: {
          finalHomeScore: Number(resultForm.finalHomeScore),
          finalAwayScore: Number(resultForm.finalAwayScore),
          winningOutcome: resultForm.winningOutcome,
          firstLiverpoolScorer: resultForm.firstLiverpoolScorer || undefined,
          manOfTheMatch: resultForm.manOfTheMatch || undefined,
          cleanSheetResult: resultForm.cleanSheetResult,
          bothTeamsToScoreResult: resultForm.bothTeamsToScoreResult,
        },
      });
      setMessage(result.message);
      await refreshMatches();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update result');
    }
  }

  async function calculateScores() {
    if (!selected) return;
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string; processedPredictions: number }>(
        '/predictions/calculate-score',
        {
          method: 'POST',
          token: accessToken,
          body: { matchId: selected.id },
        },
      );
      setMessage(`${result.message} Processed: ${result.processedPredictions}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to calculate scores');
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        eyebrow="Match Hub"
        title="Matches"
        description="Create Liverpool fixtures (double points) or other weekly matches. Pick a fixture, then start it live, record goals, or save the final result."
        action={
          <div className="flex flex-wrap gap-2">
            {createKind ? (
              <button type="button" className="kop-btn-secondary" onClick={() => setCreateKind(null)}>
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="kop-btn-primary"
                  onClick={() => openCreateForm('liverpool')}
                >
                  Add Liverpool match
                </button>
                <button
                  type="button"
                  className="kop-btn-secondary"
                  onClick={() => openCreateForm('other')}
                >
                  Add other match
                </button>
              </>
            )}
          </div>
        }
      />

      {message ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
          {message}
        </div>
      ) : null}

      {createKind ? (
        <form onSubmit={createMatch} className="kop-card grid gap-4 p-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <h2 className="text-base font-bold">
              {createKind === 'liverpool' ? 'Add Liverpool match' : 'Add other match'}
            </h2>
            <p className="mt-1 text-sm text-black/50">
              {createKind === 'liverpool'
                ? 'Double points on score & winner. Members can pick first scorer and clean sheet.'
                : 'Standard points only — exact score 3 pts, winner 1 pt.'}
            </p>
          </div>
          {createKind === 'liverpool' ? (
            <>
              <label className="block text-sm font-medium">
                Opponent
                <input
                  className="kop-input"
                  value={createForm.opponent}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      opponent: e.target.value,
                      awayTeamName: prev.awayTeamName || e.target.value,
                    }))
                  }
                  required
                  placeholder="Newcastle United"
                />
              </label>
              <label className="block text-sm font-medium">
                Away team name
                <input
                  className="kop-input"
                  value={createForm.awayTeamName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, awayTeamName: e.target.value }))}
                  placeholder="Same as opponent if empty"
                />
              </label>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium">
                Home team
                <input
                  className="kop-input"
                  value={createForm.homeTeamName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, homeTeamName: e.target.value }))}
                  required
                  placeholder="Arsenal"
                />
              </label>
              <label className="block text-sm font-medium">
                Away team
                <input
                  className="kop-input"
                  value={createForm.awayTeamName}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, awayTeamName: e.target.value }))}
                  required
                  placeholder="Chelsea"
                />
              </label>
            </>
          )}
          <label className="block text-sm font-medium">
            Competition
            <input
              className="kop-input"
              value={createForm.competition}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, competition: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Stadium
            <input
              className="kop-input"
              value={createForm.stadium}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, stadium: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium">
            Kick-off
            <input
              type="datetime-local"
              className="kop-input"
              min={minDatetimeLocal()}
              value={createForm.matchDate}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, matchDate: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Predictions close
            <input
              type="datetime-local"
              className="kop-input"
              min={minDatetimeLocal()}
              value={createForm.predictionClosesAt}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, predictionClosesAt: e.target.value }))
              }
              required
            />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="kop-btn-primary">
              {createKind === 'liverpool' ? 'Create Liverpool fixture' : 'Create match'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-black/40">Fixtures</h2>
            <p className="mt-1 text-xs text-black/45">Tap a match to edit it.</p>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-black/5" />
              ))}
            </div>
          ) : null}

          {grouped.map((group) => (
            <div key={group.key} className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-black/35">
                {group.label}
              </div>
              {group.items.map((match) => {
                const active = match.id === selectedId;
                return (
                  <div
                    key={match.id}
                    className={`rounded-2xl border transition ${
                      active
                        ? 'border-lfc-red/30 bg-lfc-red/[0.06] shadow-sm'
                        : 'border-black/10 bg-surface'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(match.id)}
                      className="w-full px-3.5 py-3 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={statusBadge(match.status)}>{match.status}</span>
                        <span className="text-xs font-bold tabular-nums text-ink">{scoreLabel(match)}</span>
                      </div>
                      <div className="mt-2 truncate text-sm font-semibold text-ink">
                        {match.homeTeamName} vs {match.awayTeamName}
                      </div>
                      <div className="mt-1 truncate text-xs text-black/45">
                        {formatKickoff(match.matchDate)}
                        {match.competition ? ` · ${match.competition}` : ''}
                      </div>
                    </button>
                    <div className="flex justify-end border-t border-black/5 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => deleteMatch(match)}
                        className="rounded-md border border-lfc-red/25 px-2.5 py-1 text-[11px] font-semibold text-lfc-red hover:bg-lfc-red/5"
                      >
                        Delete match
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {!isLoading && !matches?.length ? (
            <div className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-black/50">
              No fixtures yet. Create the first match.
            </div>
          ) : null}
        </aside>

        <div className="min-w-0">
          {selected ? (
            <div className="kop-card overflow-hidden">
              <div className="border-b border-black/5 px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={statusBadge(selected.status)}>{selected.status}</span>
                      <span className="kop-badge">{selected.competition}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold text-ink">
                      {selected.homeTeamName} vs {selected.awayTeamName}
                    </h2>
                    <p className="mt-1 text-sm text-black/50">
                      {formatKickoff(selected.matchDate)}
                      {selected.stadium ? ` · ${selected.stadium}` : ''}
                      {selected._count?.predictions != null
                        ? ` · ${selected._count.predictions} prediction${selected._count.predictions === 1 ? '' : 's'}`
                        : ''}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-black/[0.04] px-4 py-2 text-center">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-black/40">
                      Score
                    </div>
                    <div className="text-2xl font-black tabular-nums text-ink">{scoreLabel(selected)}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {selectedIsLfc ? (
                    <button
                      type="button"
                      className={panel === 'live' ? 'kop-btn-primary !px-4 !py-2 !text-xs' : 'kop-btn-secondary !px-4 !py-2 !text-xs'}
                      onClick={() => setPanel('live')}
                    >
                      Live control
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={panel === 'result' ? 'kop-btn-primary !px-4 !py-2 !text-xs' : 'kop-btn-secondary !px-4 !py-2 !text-xs'}
                    onClick={() => setPanel('result')}
                  >
                    Final result
                  </button>
                  <button
                    type="button"
                    className="kop-btn-secondary !border-lfc-red/30 !px-4 !py-2 !text-xs !text-lfc-red hover:!bg-lfc-red/5"
                    onClick={() => void deleteMatch(selected)}
                  >
                    Delete match
                  </button>
                </div>
              </div>

              {panel === 'live' && selectedIsLfc ? (
                <div className="space-y-5 p-5">
                  {selected.status === 'FINISHED' ? (
                    <p className="text-sm text-black/55">
                      This match is finished. Open Final result to check scores or calculate points.
                    </p>
                  ) : (
                    <>
                      {selected.status === 'UPCOMING' ? (
                        <div className="rounded-2xl border border-black/10 bg-black/[0.02] px-4 py-3 text-sm text-black/60">
                          Liverpool matches go LIVE automatically at kick-off ({formatKickoff(selected.matchDate)}).
                          Use Start live only if kick-off happens early.
                          <div className="mt-3">
                            <button type="button" className="kop-btn-primary !py-2 !text-sm" onClick={() => void startLiveMatch()}>
                              Start live now
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium">
                          Scorer
                          <input
                            className="kop-input"
                            value={liveForm.scorerName}
                            onChange={(e) => setLiveForm((prev) => ({ ...prev, scorerName: e.target.value }))}
                            placeholder="Gakpo, Salah…"
                          />
                        </label>
                        <label className="block text-sm font-medium">
                          Minute
                          <input
                            type="number"
                            min={0}
                            className="kop-input"
                            value={liveForm.minute}
                            onChange={(e) =>
                              setLiveForm((prev) => ({ ...prev, minute: Number(e.target.value) }))
                            }
                          />
                        </label>
                        <label className="block text-sm font-medium sm:col-span-2">
                          Comment on the goal
                          <input
                            className="kop-input"
                            value={liveForm.comment}
                            onChange={(e) => setLiveForm((prev) => ({ ...prev, comment: e.target.value }))}
                            placeholder="Long-range screamer, penalty, own goal…"
                            maxLength={400}
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={isRecordingGoal || selected.status !== 'LIVE'}
                          onClick={() => void recordGoal(true)}
                          className="kop-btn-primary"
                        >
                          Liverpool goal
                          <span className="font-normal opacity-80">
                            {liveForm.homeScore + 1}–{liveForm.awayScore}
                          </span>
                        </button>
                        <button
                          type="button"
                          disabled={isRecordingGoal || selected.status !== 'LIVE'}
                          onClick={() => void recordGoal(false)}
                          className="kop-btn-secondary"
                        >
                          Opponent goal
                          <span className="font-normal text-black/50">
                            {liveForm.homeScore}–{liveForm.awayScore + 1}
                          </span>
                        </button>
                      </div>

                      <div className="border-t border-black/5 pt-4">
                        <h3 className="text-sm font-bold text-ink">Match updates</h3>
                        <p className="mt-1 text-xs text-black/45">
                          Send half-time, second half, full-time, or a short note to members. No score change.
                        </p>
                        <label className="mt-3 block text-sm font-medium">
                          Note
                          <input
                            className="kop-input"
                            value={liveForm.updateNote}
                            onChange={(e) => setLiveForm((prev) => ({ ...prev, updateNote: e.target.value }))}
                            placeholder="What a first half… / Szoboszlai on a yellow…"
                            maxLength={400}
                          />
                        </label>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="kop-btn-secondary !px-3 !py-2 !text-xs"
                            disabled={isSendingUpdate || selected.status !== 'LIVE'}
                            onClick={() => void sendLiveUpdate('HALF_TIME')}
                          >
                            Half-time
                          </button>
                          <button
                            type="button"
                            className="kop-btn-secondary !px-3 !py-2 !text-xs"
                            disabled={isSendingUpdate || selected.status !== 'LIVE'}
                            onClick={() => void sendLiveUpdate('SECOND_HALF')}
                          >
                            Second half
                          </button>
                          <button
                            type="button"
                            className="kop-btn-secondary !px-3 !py-2 !text-xs"
                            disabled={isSendingUpdate || selected.status !== 'LIVE'}
                            onClick={() => void sendLiveUpdate('FULL_TIME')}
                          >
                            Full-time
                          </button>
                          <button
                            type="button"
                            className="kop-btn-primary !px-3 !py-2 !text-xs"
                            disabled={isSendingUpdate || selected.status !== 'LIVE'}
                            onClick={() => void sendLiveUpdate('COMMENT')}
                          >
                            Send comment
                          </button>
                        </div>
                      </div>

                      {selected.status !== 'LIVE' ? (
                        <p className="text-xs text-black/45">Start live before recording goals.</p>
                      ) : null}
                    </>
                  )}
                </div>
              ) : (
                <form onSubmit={saveResult} className="grid gap-4 p-5 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    {selected.homeTeamName}
                    <input
                      type="number"
                      min={0}
                      className="kop-input"
                      value={resultForm.finalHomeScore}
                      onChange={(e) => {
                        const home = Number(e.target.value);
                        const away = resultForm.finalAwayScore;
                        setResultForm((prev) => ({
                          ...prev,
                          finalHomeScore: home,
                          winningOutcome: nextWinningOutcome(home, away),
                          cleanSheetResult: liverpoolCleanSheet(
                            selected.homeTeamName,
                            selected.awayTeamName,
                            home,
                            away,
                          ),
                        }));
                      }}
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    {selected.awayTeamName}
                    <input
                      type="number"
                      min={0}
                      className="kop-input"
                      value={resultForm.finalAwayScore}
                      onChange={(e) => {
                        const away = Number(e.target.value);
                        const home = resultForm.finalHomeScore;
                        setResultForm((prev) => ({
                          ...prev,
                          finalAwayScore: away,
                          winningOutcome: nextWinningOutcome(home, away),
                          cleanSheetResult: liverpoolCleanSheet(
                            selected.homeTeamName,
                            selected.awayTeamName,
                            home,
                            away,
                          ),
                        }));
                      }}
                    />
                  </label>
                  <label className="block text-sm font-medium sm:col-span-2">
                    Winner
                    <select
                      className="kop-input"
                      value={resultForm.winningOutcome}
                      onChange={(e) =>
                        setResultForm((prev) => ({ ...prev, winningOutcome: e.target.value }))
                      }
                    >
                      <option value="HOME_WIN">{selected.homeTeamName} win</option>
                      <option value="DRAW">Draw</option>
                      <option value="AWAY_WIN">{selected.awayTeamName} win</option>
                    </select>
                  </label>
                  {selectedIsLfc ? (
                    <>
                      <label className="block text-sm font-medium">
                        First Liverpool scorer
                        <select
                          className="kop-input"
                          value={resultForm.firstLiverpoolScorer}
                          onChange={(e) =>
                            setResultForm((prev) => ({ ...prev, firstLiverpoolScorer: e.target.value }))
                          }
                        >
                          <option value="">None / not applicable</option>
                          {LIVERPOOL_SQUAD_2025_26.map((player) => (
                            <option key={player.name} value={player.name}>
                              {formatLiverpoolPlayerOption(player)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium">Liverpool clean sheet?</div>
                        <p className="mt-1 text-xs text-black/45">
                          Members earn +1 pt if they pick the correct answer.
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
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
                                resultForm.cleanSheetResult === value ? 'winner-pick-btn-active' : ''
                              }`}
                              onClick={() =>
                                setResultForm((prev) => ({ ...prev, cleanSheetResult: value }))
                              }
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button type="submit" className="kop-btn-secondary">
                      Save result
                    </button>
                    <button type="button" onClick={() => void calculateScores()} className="kop-btn-primary">
                      Calculate points
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="kop-card px-5 py-12 text-center text-sm text-black/50">
              Select a fixture on the left to manage it.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
