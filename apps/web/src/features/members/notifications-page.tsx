import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { useContent } from '../content/content-provider';
import { EmptyState } from '../../components/ui/interactive-chips';

type NotificationItem = {
  id: string;
  title: string;
  message?: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, string> = {
  EVENT: '📅',
  EVENT_UPDATE: '📅',
  MATCH: '⚽',
  MATCH_GOAL: '🔴',
  MATCH_GOAL_OPPONENT: '😬',
  MATCH_LIVE: '🔴',
  MATCH_UPDATE: '📢',
  ACHIEVEMENT: '🏅',
  SYSTEM: '📢',
  DEFAULT: '🔔',
};

function formatRelativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationsPage() {
  const notificationsTitle = useContent('member.notifications.title', 'Notifications');
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<NotificationItem[]>('/notifications', { token: accessToken }),
    enabled: Boolean(accessToken),
    refetchInterval: 15_000,
  });

  const readMutation = useMutation({
    mutationFn: (notificationId: string) =>
      apiRequest<{ message: string }>(`/notifications/${notificationId}/read`, {
        method: 'PUT',
        token: accessToken,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notificationsQuery.data?.filter((n) => !n.isRead).length ?? 0;

  return (
    <section>
      <PageHeader
        eyebrow="Alerts"
        title={notificationsTitle}
        description={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
            : 'In-app alerts for matches, events, and achievements.'
        }
      />

      <div className="space-y-3">
        {notificationsQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="notification-card notification-read animate-pulse p-5">
              <div className="h-4 w-1/3 rounded bg-black/5" />
              <div className="mt-2 h-3 w-full rounded bg-black/5" />
            </div>
          ))
        ) : null}

        {notificationsQuery.data?.map((item) => {
          const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.DEFAULT;

          return (
            <article
              key={item.id}
              className={`notification-card ${item.isRead ? 'notification-read' : 'notification-unread'}`}
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/5 text-xl">
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-ink">{item.title}</p>
                    {!item.isRead ? (
                      <span className="kop-badge-red !py-0.5">New</span>
                    ) : null}
                  </div>
                  {item.message ? (
                    <p className="mt-1 text-sm leading-relaxed text-black/60">{item.message}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-black/40">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={() => readMutation.mutate(item.id)}
                        disabled={readMutation.isPending}
                        className="kop-btn-secondary !py-1.5 !text-xs"
                      >
                        Mark as read
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-pitch">✓ Read</span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}

        {!notificationsQuery.isLoading && !notificationsQuery.data?.length ? (
          <EmptyState
            icon="🔔"
            title="All quiet for now"
            description="You'll see alerts here when you register for events or club activity happens."
          />
        ) : null}
      </div>
    </section>
  );
}
