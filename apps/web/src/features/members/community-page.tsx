import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { FeedCard, FeedCardSkeleton } from '../../components/ui/feed-card';

type FeedItem = {
  id: string;
  type: string;
  createdAt: string;
  title: string;
  subtitle?: string;
  link?: string;
};

type EventItem = {
  id: string;
  title: string;
  location: string;
  startDateTime: string;
  capacity?: number | null;
  registrationOpen: boolean;
  registeredCount: number;
  isPast?: boolean;
};

export function CommunityPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [guestCount, setGuestCount] = useState(0);

  const feedQuery = useQuery({
    queryKey: ['community-feed'],
    queryFn: () => apiRequest<FeedItem[]>('/community/feed', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const eventsQuery = useQuery({
    queryKey: ['public-events'],
    queryFn: () => apiRequest<EventItem[]>('/events'),
  });

  const registerMutation = useMutation({
    mutationFn: (eventId: string) =>
      apiRequest<{ message: string }>(`/events/${eventId}/register`, {
        method: 'POST',
        token: accessToken,
        body: { joinWaitlist: true, guestCount },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-events'] });
      queryClient.invalidateQueries({ queryKey: ['community-feed'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <section>
      <PageHeader
        eyebrow="Community"
        title="Your Kop Feed"
        description="News, events, and achievements from your supporters club — without live score spam."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main feed — Toronto-style activity stream */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Activity Feed</h2>
            <span className="text-xs text-black/40">
              {feedQuery.data?.length ?? 0} updates
            </span>
          </div>

          <div className="space-y-3">
            {feedQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <FeedCardSkeleton key={i} />)
              : null}

            {feedQuery.data?.map((item) => (
              <FeedCard
                key={item.id}
                type={item.type}
                title={item.title}
                subtitle={item.subtitle}
                createdAt={item.createdAt}
                link={item.link}
              />
            ))}

            {!feedQuery.isLoading && !feedQuery.data?.length ? (
              <div className="kop-card py-16 text-center">
                <div className="text-4xl">📣</div>
                <p className="mt-4 font-semibold text-ink">No activity yet</p>
                <p className="mt-1 text-sm text-black/50">
                  Submit a prediction or register for an event to see updates here.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sidebar — events */}
        <aside className="space-y-4">
          <div className="kop-card overflow-hidden">
            <div className="kop-gradient-hero px-5 py-4 text-white">
              <h2 className="font-bold">Upcoming Events</h2>
              <p className="mt-1 text-xs text-white/70">Register for watch parties & meetups</p>
            </div>
            <label className="block border-b border-black/5 px-4 py-3 text-sm font-medium">
              Guests (optional)
              <select
                className="kop-input mt-1"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
              >
                <option value={0}>Just me</option>
                <option value={1}>Me + 1 guest</option>
                <option value={2}>Me + 2 guests</option>
              </select>
            </label>
            <div className="space-y-0 divide-y divide-black/5 p-4">
              {eventsQuery.isLoading ? (
                <p className="py-4 text-center text-sm text-black/40">Loading events...</p>
              ) : null}

              {eventsQuery.data?.filter((event) => !event.isPast).map((event) => (
                <div key={event.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-pitch/10 text-pitch">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {new Date(event.startDateTime).toLocaleString('en', { month: 'short' })}
                      </span>
                      <span className="text-lg font-extrabold leading-none">
                        {new Date(event.startDateTime).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">{event.title}</p>
                      <p className="mt-0.5 text-xs text-black/50">{event.location}</p>
                      <p className="mt-1 text-xs text-black/40">
                        {event.registeredCount}
                        {event.capacity ? ` / ${event.capacity}` : ''} registered
                      </p>
                      <button
                        type="button"
                        disabled={!event.registrationOpen || registerMutation.isPending}
                        onClick={() => registerMutation.mutate(event.id)}
                        className="kop-btn-primary mt-3 !px-4 !py-2 !text-xs disabled:opacity-50"
                      >
                        {registerMutation.isPending
                          ? 'Registering...'
                          : event.registrationOpen
                            ? 'Register'
                            : 'Closed'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!eventsQuery.isLoading && !eventsQuery.data?.some((event) => !event.isPast) ? (
                <p className="py-6 text-center text-sm text-black/40">No upcoming events.</p>
              ) : null}
            </div>
          </div>

          {registerMutation.isSuccess ? (
            <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
              ✓ {registerMutation.data?.message ?? 'Registered successfully!'}
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
