export type ContentValueType = 'text' | 'rich' | 'link' | 'image' | 'colour' | 'boolean';

export type ContentRegistryEntry = {
  key: string;
  defaultEn: string;
  type: ContentValueType;
  maxLength?: number;
  area: string;
  description: string;
};

export const CONTENT_REGISTRY: ContentRegistryEntry[] = [
  {
    key: 'brand.siteName',
    defaultEn: 'RedLeb Hub',
    type: 'text',
    maxLength: 80,
    area: 'Branding',
    description: 'Public site name in headers and PWA.',
  },
  {
    key: 'brand.tagline',
    defaultEn: 'OLSC Lebanon digital home',
    type: 'text',
    maxLength: 120,
    area: 'Branding',
    description: 'Short tagline under the logo.',
  },
  {
    key: 'home.hero.title',
    defaultEn: 'Welcome to OLSC Lebanon – RedLeb Hub',
    type: 'text',
    maxLength: 160,
    area: 'Home',
    description: 'Home hero main heading.',
  },
  {
    key: 'home.hero.subtitle',
    defaultEn:
      'Your community hub for match predictions, events, news, and official digital membership.',
    type: 'rich',
    maxLength: 500,
    area: 'Home',
    description: 'Home hero supporting text.',
  },
  {
    key: 'home.hero.primaryCta',
    defaultEn: 'Become a member',
    type: 'text',
    maxLength: 60,
    area: 'Home',
    description: 'Primary hero button — links to membership apply.',
  },
  {
    key: 'home.feed.heading',
    defaultEn: 'Latest from us',
    type: 'text',
    maxLength: 80,
    area: 'Home',
    description: 'Feed section title.',
  },
  {
    key: 'home.feed.newsHeading',
    defaultEn: 'Club News (OLSC announcements)',
    type: 'text',
    maxLength: 80,
    area: 'Home',
    description: 'News column title on home.',
  },
  {
    key: 'home.feed.eventsHeading',
    defaultEn: 'Events (Gatherings & meetups)',
    type: 'text',
    maxLength: 80,
    area: 'Home',
    description: 'Events column title on home.',
  },
  {
    key: 'home.bottom.title',
    defaultEn: 'Interested in joining us?',
    type: 'text',
    maxLength: 100,
    area: 'Home',
    description: 'Bottom CTA title.',
  },
  {
    key: 'home.bottom.body',
    defaultEn: 'Let us cheer for the Reds together.',
    type: 'text',
    maxLength: 200,
    area: 'Home',
    description: 'Bottom CTA supporting line.',
  },
  {
    key: 'nav.signIn',
    defaultEn: 'Sign in',
    type: 'text',
    maxLength: 40,
    area: 'Navigation',
    description: 'Header sign-in link label.',
  },
  {
    key: 'label.allredSupportId',
    defaultEn: 'ALLRED SUPPORT ID',
    type: 'text',
    maxLength: 60,
    area: 'Forms',
    description: 'Official Liverpool member ID field label.',
  },
];

export const CONTENT_DEFAULTS_EN: Record<string, string> = Object.fromEntries(
  CONTENT_REGISTRY.map((entry) => [entry.key, entry.defaultEn]),
);
