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
  badge: 'Kop Platform',
  badgeHint: 'Members only',
  title: 'Match Hub · Digital Card · Community Feed',
  body: 'Predict scores, climb the leaderboard, register for watch parties, and carry your official membership card — all in one place.',
  stats: [
    { icon: '⚽', label: 'Predictions' },
    { icon: '🏆', label: 'Leaderboard' },
    { icon: '🎫', label: 'Member Card' },
  ] as HomePlatformStat[],
};

export const DEFAULT_HOME_QUICK_LINKS: HomeQuickLink[] = [
  { icon: '📰', title: 'Club News', description: 'Official announcements', to: '/news' },
  { icon: '🗞️', title: 'Newsletter', description: 'Read the PDF issues', to: '/newsletter' },
  { icon: '📅', title: 'Events', description: 'Watch parties & meetups', to: '/events' },
  { icon: '🤝', title: 'Membership', description: 'How to join OLSC', to: '/membership' },
];

export const DEFAULT_HOME_FEED_SECTION = {
  eyebrow: 'Stay Connected',
  heading: 'Latest from the Kop',
  body: 'News, events, and updates from your supporters club — the same spirit as a live community feed, built for OLSC Lebanon.',
  newsHeading: 'Latest News',
  eventsHeading: 'Upcoming Events',
};

export const DEFAULT_HOME_BOTTOM_CTA = {
  title: 'Ready to join the Kop?',
  body: 'Official membership is managed by the OLSC Lebanon committee. Already a member? Log in to access the full platform.',
  primaryLabel: 'Learn about membership',
};
