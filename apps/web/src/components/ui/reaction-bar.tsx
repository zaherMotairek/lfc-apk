export const REACTIONS = [
  { type: 'LIKE', emoji: '👍', label: 'Like' },
  { type: 'LOVE', emoji: '❤️', label: 'Love' },
  { type: 'FIRE', emoji: '🔥', label: 'Fire' },
  { type: 'YNWA', emoji: '🎵', label: 'YNWA' },
] as const;

type ReactionBarProps = {
  counts: Record<string, number>;
  activeReaction?: string | null;
  onReact: (type: string) => void;
  isPending?: boolean;
};

export function ReactionBar({ counts, activeReaction, onReact, isPending }: ReactionBarProps) {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {REACTIONS.map(({ type, emoji, label }) => {
          const count = counts[type] ?? 0;
          const isActive = activeReaction === type;

          return (
            <button
              key={type}
              type="button"
              disabled={isPending}
              onClick={() => onReact(type)}
              className={`reaction-chip ${isActive ? 'reaction-chip-active' : ''}`}
              aria-label={`${label}, ${count} reactions`}
            >
              <span className="text-lg leading-none">{emoji}</span>
              <span className="font-semibold">{label}</span>
              {count > 0 ? (
                <span className={`reaction-count ${isActive ? 'reaction-count-active' : ''}`}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {total > 0 ? (
        <p className="mt-3 text-xs text-black/45">{total} supporter{total !== 1 ? 's' : ''} reacted</p>
      ) : (
        <p className="mt-3 text-xs text-black/45">Be the first to react</p>
      )}
    </div>
  );
}
