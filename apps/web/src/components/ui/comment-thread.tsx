import { FormEvent } from 'react';

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
};

type CommentThreadProps = {
  comments: Comment[];
  isLoading?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
};

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

export function CommentThread({
  comments,
  isLoading,
  value,
  onChange,
  onSubmit,
  isSubmitting,
}: CommentThreadProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="comment-composer">
        <textarea
          className="comment-input"
          rows={2}
          placeholder="Share your thoughts with the Kop..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button type="submit" disabled={isSubmitting || !value.trim()} className="kop-btn-primary shrink-0 self-end !py-2.5 !text-sm">
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="comment-card animate-pulse">
                <div className="h-10 w-10 rounded-full bg-black/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-black/5" />
                  <div className="h-4 w-full rounded bg-black/5" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {comments.map((item) => (
          <article key={item.id} className="comment-card">
            <div className="comment-avatar">{initials(item.user.firstName, item.user.lastName)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-semibold text-ink">
                  {item.user.firstName} {item.user.lastName}
                </span>
                <time className="text-xs text-black/40">{formatTime(item.createdAt)}</time>
              </div>
              <p className="mt-1 text-sm leading-relaxed text-black/70">{item.content}</p>
            </div>
          </article>
        ))}

        {!isLoading && !comments.length ? (
          <div className="rounded-2xl border border-dashed border-black/10 py-10 text-center">
            <div className="text-2xl">💬</div>
            <p className="mt-2 text-sm font-medium text-black/50">No comments yet</p>
            <p className="text-xs text-black/35">Start the conversation below</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
