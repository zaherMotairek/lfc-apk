import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../auth/auth-context';
import { useContent } from '../content/content-provider';
import { fetchPublicSiteSettings } from '../../lib/site-settings';

type EventDetail = {
  id: string;
  title: string;
  description: string;
  location: string;
  startDateTime: string;
  endDateTime?: string | null;
  capacity?: number | null;
  registeredCount: number;
  registrationOpen: boolean;
  isPast?: boolean;
};

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  return {
    weekday: date.toLocaleDateString('en', { weekday: 'long' }),
    day: date.getDate(),
    month: date.toLocaleDateString('en', { month: 'short' }),
    year: date.getFullYear(),
    time: date.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  };
}

function capacityPercent(registered: number, capacity?: number | null) {
  if (!capacity || capacity <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((registered / capacity) * 100));
}

export function EventDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const { isAuthenticated, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [guestCount, setGuestCount] = useState(0);
  const [guestNames, setGuestNames] = useState('');
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);
  const signInRegisterLabel = useContent('events.register.signInHint', 'Sign in to register');
  const becomeMemberLabel = useContent('cta.becomeMember', 'Become a member');
  const guestsLabel = useContent('events.guests.label', 'Guests');
  const guestNamesLabel = useContent('events.guests.namesLabel', 'Guest names (optional)');
  const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
  const calendarUrl = `${apiBase}/events/${id}/calendar.ics`;

  const siteSettingsQuery = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: fetchPublicSiteSettings,
  });
  const maxGuests = Math.min(
    2,
    Math.max(0, Number(siteSettingsQuery.data?.['features.guestsMax'] ?? '2') || 2),
  );

  const registerMutation = useMutation({
    mutationFn: ({ joinWaitlist = false }: { joinWaitlist?: boolean } = {}) =>
      apiRequest<{ message: string }>(`/events/${id}/register`, {
        method: 'POST',
        token: accessToken,
        body: {
          guestCount,
          guestNames: guestNames.trim() || undefined,
          joinWaitlist: joinWaitlist || undefined,
        },
      }),
    onSuccess: (res) => {
      setRegisterMessage(res.message);
      void queryClient.invalidateQueries({ queryKey: ['public-event', id] });
    },
    onError: (err) => setRegisterMessage(err instanceof Error ? err.message : 'Registration failed'),
  });
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-event', id],
    queryFn: () => apiRequest<EventDetail>(`/events/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <section className="kop-container py-10 md:py-14">
        <div className="kop-card animate-pulse overflow-hidden">
          <div className="h-40 bg-black/5" />
          <div className="space-y-4 p-8">
            <div className="h-8 w-2/3 rounded bg-black/5" />
            <div className="h-4 w-1/2 rounded bg-black/5" />
            <div className="mt-6 h-24 rounded-xl bg-black/5" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="kop-container py-12">
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          Event not found.
        </div>
      </section>
    );
  }

  const start = formatEventDate(data.startDateTime);
  const end = data.endDateTime ? formatEventDate(data.endDateTime) : null;
  const fillPercent = capacityPercent(data.registeredCount, data.capacity);
  const spotsLeft =
    data.capacity != null ? Math.max(0, data.capacity - data.registeredCount) : null;
  const isPast = data.isPast === true;
  const canRegister = data.registrationOpen && !isPast;

  return (
    <article className="pb-16">
      {/* Hero band */}
      <div className="relative overflow-hidden border-b border-black/5 bg-white/60">
        <div className="absolute inset-0 kop-gradient-hero opacity-[0.07]" />
        <div className="kop-container relative py-10 md:py-14">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <header className="max-w-3xl">
              <p className={`mb-4 ${isPast ? 'kop-badge-red' : 'kop-badge-green'}`}>
                {isPast ? 'Past event' : 'OLSC Event'}
              </p>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
                {data.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-black/60">
                {data.description.split('\n')[0]}
              </p>
            </header>

            {/* Date tile */}
            <div className="event-date-tile shrink-0">
              <div className="text-center">
                <div className="text-xs font-bold uppercase tracking-widest text-lfc-red">
                  {start.month}
                </div>
                <div className="text-5xl font-extrabold leading-none text-ink">{start.day}</div>
                <div className="mt-1 text-sm font-semibold text-black/50">{start.year}</div>
                <div className="mt-3 rounded-full bg-pitch/10 px-3 py-1 text-xs font-semibold text-pitch">
                  {start.time}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="kop-container py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          {/* Main content */}
          <div className="space-y-8">
            <div className="kop-card p-6 md:p-8">
              <h2 className="text-lg font-bold">About this event</h2>
              <p className="mt-4 whitespace-pre-wrap leading-relaxed text-black/70">
                {data.description}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="event-info-pill">
                <div className="event-info-icon">📅</div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-black/40">
                    Date & time
                  </div>
                  <div className="mt-1 font-semibold text-ink">{start.full}</div>
                  <div className="mt-0.5 text-sm text-black/55">
                    Starts at {start.time}
                    {end ? ` · ends ${end.time}` : ''}
                  </div>
                </div>
              </div>

              <div className="event-info-pill">
                <div className="event-info-icon">📍</div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-black/40">
                    Location
                  </div>
                  <div className="mt-1 font-semibold text-ink">{data.location}</div>
                  <div className="mt-0.5 text-sm text-black/55">OLSC Lebanon community venue</div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar — registration */}
          <aside className="space-y-4">
            <a
              href={calendarUrl}
              className="kop-btn-secondary block w-full text-center !text-sm"
              download={`redleb-event-${id}.ics`}
            >
              Add to calendar (.ics)
            </a>
            <div className="kop-card overflow-hidden">
              <div
                className={`px-5 py-4 text-white ${canRegister ? 'kop-gradient-hero' : 'bg-ink'}`}
              >
                <div className="text-xs font-bold uppercase tracking-widest text-white/70">
                  Registration
                </div>
                <div className="mt-1 text-xl font-bold">
                  {isPast ? 'Finished' : canRegister ? 'Open' : 'Closed'}
                </div>
              </div>

              <div className="space-y-5 p-5">
                {isPast ? (
                  <div className="rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm text-black/60">
                    This event has already taken place. Registration is no longer available.
                  </div>
                ) : null}
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-black/60">Members registered</span>
                    <span className="font-bold text-ink">
                      {data.registeredCount}
                      {data.capacity ? ` / ${data.capacity}` : ''}
                    </span>
                  </div>
                  {data.capacity ? (
                    <>
                      <div className="event-capacity-bar mt-3">
                        <div
                          className="event-capacity-fill"
                          style={{ width: `${fillPercent}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-black/45">
                        {spotsLeft === 0
                          ? 'Event is at capacity — waitlist may be available in the app'
                          : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining`}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-xs text-black/45">No capacity limit set</p>
                  )}
                </div>

                <div className="rounded-xl border border-black/5 bg-black/[0.02] px-4 py-3 text-sm text-black/60">
                  {isPast ? (
                    <>This event is over. Browse upcoming activities on the events page.</>
                  ) : isAuthenticated ? (
                    <>
                      Register from the{' '}
                      <Link to="/app/community" className="font-semibold text-lfc-red hover:underline">
                        Community Feed
                      </Link>{' '}
                      in the member app.
                    </>
                  ) : (
                    <>
                      Log in with your member account to register for watch parties and OLSC events.
                    </>
                  )}
                </div>

                {!isPast && (canRegister || (isAuthenticated && spotsLeft === 0 && data.capacity)) ? (
                  isAuthenticated ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium">
                        {guestsLabel}
                        <select
                          className="kop-input mt-1"
                          value={guestCount}
                          onChange={(e) => setGuestCount(Number(e.target.value))}
                        >
                          <option value={0}>Just me</option>
                          {maxGuests >= 1 ? <option value={1}>Me + 1 guest</option> : null}
                          {maxGuests >= 2 ? <option value={2}>Me + 2 guests</option> : null}
                        </select>
                      </label>
                      {guestCount > 0 ? (
                        <label className="block text-sm font-medium">
                          {guestNamesLabel}
                          <input
                            className="kop-input mt-1"
                            value={guestNames}
                            onChange={(e) => setGuestNames(e.target.value)}
                            placeholder="e.g. Alex, Sam"
                            maxLength={120}
                          />
                        </label>
                      ) : null}
                      {spotsLeft === 0 && data.capacity ? (
                        <button
                          type="button"
                          className="kop-btn-primary w-full"
                          disabled={registerMutation.isPending}
                          onClick={() => registerMutation.mutate({ joinWaitlist: true })}
                        >
                          {registerMutation.isPending ? 'Joining…' : 'Join waitlist'}
                        </button>
                      ) : canRegister ? (
                        <button
                          type="button"
                          className="kop-btn-primary w-full"
                          disabled={registerMutation.isPending}
                          onClick={() => registerMutation.mutate({})}
                        >
                          {registerMutation.isPending ? 'Registering…' : 'Register for this event'}
                        </button>
                      ) : null}
                      {registerMessage ? (
                        <p className="text-center text-xs text-pitch">{registerMessage}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        state={{ from: { pathname: location.pathname, search: location.search } }}
                        className="kop-btn-ghost w-full !text-sm"
                      >
                        {signInRegisterLabel}
                      </Link>
                      <Link to="/membership/apply" className="kop-btn-primary w-full">
                        {becomeMemberLabel}
                      </Link>
                    </div>
                  )
                ) : null}
              </div>
            </div>

            <div className="kop-card p-5 text-sm text-black/55">
              <div className="font-semibold text-ink">Official OLSC event</div>
              <p className="mt-2 leading-relaxed">
                Watch parties and gatherings organised by OLSC Lebanon. Present your digital
                membership card at the door when requested.
              </p>
              <Link
                to={isAuthenticated ? '/app/membership-card' : '/membership'}
                className="mt-4 inline-flex text-sm font-semibold text-lfc-red hover:underline"
              >
                View membership card →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
