import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';

type NewsRow = { id: string; title: string; slug: string; publishedAt?: string | null };
type EventRow = { id: string; title: string; startDateTime: string };

export function NewsletterContentPicker({
  onPick,
}: {
  onPick: (text: string) => void;
}) {
  const { accessToken } = useAuth();

  const newsQuery = useQuery({
    queryKey: ['admin-news-picker'],
    queryFn: () => apiRequest<NewsRow[]>('/admin/news', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const eventsQuery = useQuery({
    queryKey: ['admin-events-picker'],
    queryFn: () => apiRequest<EventRow[]>('/admin/events', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  return (
    <div className="kop-card space-y-3 p-4">
      <div className="text-sm font-bold">Insert from hub</div>
      <p className="text-xs text-black/55">Tap a headline to copy it into the focused newsletter field.</p>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-black/40">Recent news</div>
        <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
          {(newsQuery.data ?? []).slice(0, 8).map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-black/5"
                onClick={() =>
                  onPick(`${row.title} — /news/${row.slug}`)
                }
              >
                {row.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-black/40">Upcoming events</div>
        <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs">
          {(eventsQuery.data ?? [])
            .filter((ev) => new Date(ev.startDateTime).getTime() >= Date.now() - 86_400_000)
            .slice(0, 8)
            .map((row) => (
              <li key={row.id}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-black/5"
                  onClick={() =>
                    onPick(
                      `${row.title} — ${new Date(row.startDateTime).toLocaleDateString()} — /events/${row.id}`,
                    )
                  }
                >
                  {row.title}
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
