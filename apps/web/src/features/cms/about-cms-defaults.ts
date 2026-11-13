import type { HighlightItem, PillarItem } from './cms-types';

export const DEFAULT_ABOUT_PILLARS: PillarItem[] = [
  {
    icon: '🔴',
    title: 'Official & proud',
    description:
      'OLSC Lebanon is the official Liverpool Supporters Club branch in Lebanon — representing the Reds with passion, respect, and the highest LFC / OLSC standards.',
  },
  {
    icon: '🤝',
    title: 'One family, YNWA',
    description:
      'From Beirut to Tripoli, from watch parties to community events — we stand together through every high and every heartbreak. You’ll Never Walk Alone is not a slogan here. It’s who we are.',
  },
  {
    icon: '⚽',
    title: 'Matchday is sacred',
    description:
      'Every Liverpool match is a shared experience. Predictions, leaderboard battles, and the roar of the Kop — even thousands of miles from Anfield.',
  },
  {
    icon: '🇱🇧',
    title: 'Lebanon in our DNA',
    description:
      'We are Lebanese. We are Liverpool. Two identities, one spirit — building a supporters community that is proud of where we come from and who we support.',
  },
];

export const DEFAULT_ABOUT_HIGHLIGHTS: HighlightItem[] = [
  { value: 'Official', label: 'OLSC branch' },
  { value: 'Lebanon', label: 'Nationwide community' },
  { value: 'Kop', label: 'Digital member platform' },
  { value: 'YNWA', label: 'Forever united' },
];

export const DEFAULT_ABOUT_STORY =
  'OLSC Lebanon was built for one reason: to bring Liverpool supporters across Lebanon together under one official banner.\n\nWe are not just fans who watch a game on a screen. We are a community that shows up — for every kick-off, every last-minute winner, every European night, and every moment that makes this club the greatest in the world.\n\nWhether you joined years ago with an official membership card in your wallet, or you are discovering the Kop for the first time, you belong here. Our committee works to organize watch parties, community events, and member experiences that carry the same energy you would feel walking up Anfield Road.\n\nRedLeb Hub is our digital home — Match Hub predictions, your official membership card, community feed, and the leaderboard built on prediction points each season.\n\nThis is Liverpool FC in Lebanon. This is us. This is OLSC Lebanon.';

export const DEFAULT_ABOUT_PLATFORM_FEATURES = [
  '⚽ Match Hub & season predictions',
  '🏆 Leaderboard by prediction points',
  '🎫 Official digital membership card',
  '📣 Community feed & watch party events',
];
