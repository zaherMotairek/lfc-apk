import { Link } from 'react-router-dom';
import type { GoalAlert } from './live-goal-provider';

function LiverpoolCrest({ className = '' }: { className?: string }) {
  return (
    <div className={`goal-crest ${className}`} aria-hidden>
      <svg viewBox="0 0 120 120" className="h-full w-full" fill="none">
        <circle cx="60" cy="60" r="56" fill="url(#crestGradient)" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
        <path
          d="M60 22 L72 48 L98 48 L77 64 L84 90 L60 74 L36 90 L43 64 L22 48 L48 48 Z"
          fill="rgba(255,255,255,0.92)"
        />
        <text x="60" y="108" textAnchor="middle" fill="white" fontSize="11" fontWeight="800" letterSpacing="2">
          LFC
        </text>
        <defs>
          <linearGradient id="crestGradient" x1="0" y1="0" x2="120" y2="120">
            <stop offset="0%" stopColor="#c8102e" />
            <stop offset="100%" stopColor="#6b0818" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function ConfettiBurst() {
  const colors = ['#c8102e', '#ffd700', '#ffffff', '#00a650', '#101418'];
  return (
    <div className="goal-confetti" aria-hidden>
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="goal-confetti-piece"
          style={{
            left: `${(index * 13) % 100}%`,
            animationDelay: `${(index % 7) * 0.12}s`,
            backgroundColor: colors[index % colors.length],
          }}
        />
      ))}
    </div>
  );
}

export function GoalCelebrationOverlay({
  alert,
  onDismiss,
}: {
  alert: GoalAlert;
  onDismiss: () => void;
}) {
  const isLiverpoolGoal = alert.type === 'MATCH_GOAL';
  const isKickOff = alert.type === 'MATCH_LIVE';
  const isOpponent = alert.type === 'MATCH_GOAL_OPPONENT';
  const isUpdate = alert.type === 'MATCH_UPDATE';

  const meta = alert.metadata ?? {};
  const scorer =
    meta.scorerName ||
    (isOpponent ? meta.awayTeam : 'Liverpool') ||
    'Unknown scorer';
  const minute = meta.minute;
  const homeTeam = meta.homeTeam ?? 'Liverpool';
  const awayTeam = meta.awayTeam ?? 'Opponent';
  const homeScore = meta.homeScore;
  const awayScore = meta.awayScore;
  const comment = meta.comment;

  const variantClass = isLiverpoolGoal
    ? 'goal-overlay-liverpool'
    : isKickOff || isUpdate
      ? 'goal-overlay-kickoff'
      : 'goal-overlay-opponent';

  const updateHeadline =
    meta.updateKind === 'HALF_TIME'
      ? 'HALF-TIME'
      : meta.updateKind === 'SECOND_HALF'
        ? 'SECOND HALF'
        : meta.updateKind === 'FULL_TIME'
          ? 'FULL-TIME'
          : 'LIVE UPDATE';

  const headline = isLiverpoolGoal
    ? 'GOOOOAAAAAL!'
    : isKickOff
      ? 'KICK OFF!'
      : isUpdate
        ? updateHeadline
        : 'They scored…';

  const badge = isLiverpoolGoal
    ? '🔴 LIVERPOOL FC'
    : isKickOff
      ? '🔴 MATCH LIVE'
      : isUpdate
        ? '📢 MATCH UPDATE'
        : '😬 OPPONENT GOAL';

  return (
    <div
      className={`goal-overlay ${variantClass}`}
      role="alertdialog"
      aria-labelledby="goal-overlay-title"
      aria-modal="true"
      onClick={onDismiss}
    >
      <div className="goal-overlay-backdrop" />
      {isLiverpoolGoal ? <ConfettiBurst /> : null}

      <div className="goal-overlay-panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="goal-overlay-close" onClick={onDismiss} aria-label="Fermer">
          ✕
        </button>

        <div className="goal-overlay-badge">{badge}</div>

        {isLiverpoolGoal ? <LiverpoolCrest className="goal-overlay-crest" /> : null}

        <h1 id="goal-overlay-title" className="goal-overlay-headline">
          {headline.split('').map((char, index) => (
            <span
              key={`${char}-${index}`}
              className="goal-overlay-letter"
              style={{ animationDelay: `${index * 0.045}s` }}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>

        {!isKickOff && !isUpdate ? (
          <>
            <div className="goal-overlay-scorer">{scorer}</div>
            {minute != null ? <div className="goal-overlay-minute">{minute}&apos;</div> : null}
            {comment ? <p className="goal-overlay-kickoff-message">{comment}</p> : null}
          </>
        ) : (
          <p className="goal-overlay-kickoff-message">{comment || alert.message}</p>
        )}

        {homeScore != null && awayScore != null ? (
          <div className="goal-overlay-scoreboard">
            <div className="goal-overlay-team">
              <span className="goal-overlay-team-name">{homeTeam}</span>
              <span className="goal-overlay-team-score">{homeScore}</span>
            </div>
            <span className="goal-overlay-score-sep">–</span>
            <div className="goal-overlay-team">
              <span className="goal-overlay-team-score">{awayScore}</span>
              <span className="goal-overlay-team-name">{awayTeam}</span>
            </div>
          </div>
        ) : null}

        {isLiverpoolGoal ? (
          <div className="goal-overlay-ynwa">You&apos;ll Never Walk Alone · OLSC Lebanon</div>
        ) : null}

        {alert.actionUrl ? (
          <Link to={alert.actionUrl} className="goal-overlay-cta" onClick={onDismiss}>
            Open Match Hub →
          </Link>
        ) : null}

        <p className="goal-overlay-hint">Tap anywhere to dismiss</p>
      </div>
    </div>
  );
}
