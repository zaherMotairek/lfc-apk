export type HomeQuickLink = {
  icon: string;
  title: string;
  description: string;
  to: string;
};

export type HomePlatformStat = {
  icon: string;
  label: string;
};

export const DEFAULT_HOME_HERO_BADGE = 'Official Liverpool Supporters Club · Lebanon';

export const DEFAULT_HOME_PLATFORM_CARD = {
  badge: 'RedLeb Hub',
  badgeHint: 'OLSC Lebanon',
  title: 'Community · Gallery · Gatherings',
  body: 'Photos from watch parties, upcoming meetups, and membership — your supporters club in one place.',
  stats: [
    { icon: '⚽', label: 'Predictions' },
    { icon: '🏆', label: 'Leaderboard' },
    { icon: '🎫', label: 'Member Card' },
  ] as HomePlatformStat[],
};

export const DEFAULT_HOME_QUICK_LINKS: HomeQuickLink[] = [
  { icon: '📰', title: 'Club News (OLSC announcements)', description: 'Official announcements', to: '/news' },
  { icon: '🗞️', title: 'Newsletter', description: 'Read the PDF issues', to: '/newsletter' },
  { icon: '📅', title: 'Events (Gatherings & meetups)', description: 'Watch parties & meetups', to: '/events' },
  { icon: '🤝', title: 'How to join OLSC', description: 'Membership info & apply', to: '/membership' },
];

export const DEFAULT_HOME_FEED_SECTION = {
  eyebrow: 'Stay Connected',
  heading: 'Latest from us',
  body: 'News, events, and updates from your supporters club — the same spirit as a live community feed, built for OLSC Lebanon.',
  newsHeading: 'Latest News',
  eventsHeading: 'Upcoming Events',
};

export const DEFAULT_HOME_BOTTOM_CTA = {
  title: 'Interested in joining us?',
  body: 'Let us cheer for the Reds together.',
  primaryLabel: 'Become a member',
};
