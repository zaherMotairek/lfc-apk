export type NavItem = {
  to: string;
  label: string;
  icon?: string;
  end?: boolean;
  external?: boolean;
};

export type PublicNavSpec = {
  to: string;
  contentKey: string;
  defaultLabel: string;
};

/** Public site nav — labels editable via content registry (`nav.public.*`). */
export const PUBLIC_NAV_SPECS: PublicNavSpec[] = [
  { to: '/about', contentKey: 'nav.public.about', defaultLabel: 'About' },
  { to: '/committee', contentKey: 'nav.public.committee', defaultLabel: 'Committee' },
  { to: '/events', contentKey: 'nav.public.events', defaultLabel: 'Events' },
  { to: '/news', contentKey: 'nav.public.news', defaultLabel: 'News' },
  { to: '/newsletter', contentKey: 'nav.public.newsletter', defaultLabel: 'Newsletter' },
  { to: '/gallery', contentKey: 'nav.public.gallery', defaultLabel: 'Gallery' },
  { to: '/membership', contentKey: 'nav.public.membership', defaultLabel: 'Membership' },
  { to: '/contact', contentKey: 'nav.public.contact', defaultLabel: 'Contact' },
];

export const PUBLIC_NAV: NavItem[] = PUBLIC_NAV_SPECS.map((spec) => ({
  to: spec.to,
  label: spec.defaultLabel,
}));

export type MemberNavSpec = PublicNavSpec & { icon?: string; end?: boolean };

export const MEMBER_NAV_SPECS: MemberNavSpec[] = [
  { to: '/app', contentKey: 'nav.member.home', defaultLabel: 'Home', icon: '🏠', end: true },
  { to: '/app/matches', contentKey: 'nav.member.matchHub', defaultLabel: 'Match Hub', icon: '⚽' },
  { to: '/app/leaderboard', contentKey: 'nav.member.leaderboard', defaultLabel: 'Leaderboard', icon: '🏆' },
  { to: '/app/community', contentKey: 'nav.member.community', defaultLabel: 'Community Feed', icon: '📣' },
  { to: '/app/notifications', contentKey: 'nav.member.notifications', defaultLabel: 'Notifications', icon: '🔔' },
  { to: '/app/hall-of-fame', contentKey: 'nav.member.hall', defaultLabel: 'Hall of Fame', icon: '👑' },
  { to: '/app/profile', contentKey: 'nav.member.profile', defaultLabel: 'My Profile', icon: '👤' },
  { to: '/app/members', contentKey: 'nav.member.directory', defaultLabel: 'Member directory', icon: '📖' },
  {
    to: '/app/membership-card',
    contentKey: 'nav.member.card',
    defaultLabel: 'Membership Card',
    icon: '🎫',
  },
];

export const MEMBER_EXTRA_NAV_SPECS: MemberNavSpec[] = [
  { to: '/news', contentKey: 'nav.member.extra.news', defaultLabel: 'Club News', icon: '📰' },
  { to: '/newsletter', contentKey: 'nav.member.extra.newsletter', defaultLabel: 'Newsletter', icon: '🗞️' },
  { to: '/events', contentKey: 'nav.member.extra.events', defaultLabel: 'Public Events', icon: '📅' },
  { to: '/gallery', contentKey: 'nav.member.extra.gallery', defaultLabel: 'Gallery', icon: '🖼️' },
];

export const MEMBER_MOBILE_TAB_SPECS: MemberNavSpec[] = [
  { to: '/app', contentKey: 'nav.member.tab.home', defaultLabel: 'Home', icon: '🏠', end: true },
  { to: '/app/matches', contentKey: 'nav.member.tab.matches', defaultLabel: 'Matches', icon: '⚽' },
  { to: '/app/community', contentKey: 'nav.member.tab.community', defaultLabel: 'Community', icon: '📣' },
  { to: '/app/membership-card', contentKey: 'nav.member.tab.card', defaultLabel: 'Card', icon: '🎫' },
  { to: '/app/profile', contentKey: 'nav.member.tab.profile', defaultLabel: 'Profile', icon: '👤' },
];

export const MEMBER_NAV: NavItem[] = MEMBER_NAV_SPECS.map((spec) => ({
  to: spec.to,
  label: spec.defaultLabel,
  icon: spec.icon,
  end: spec.end,
}));

export const MEMBER_EXTRA_NAV: NavItem[] = MEMBER_EXTRA_NAV_SPECS.map((spec) => ({
  to: spec.to,
  label: spec.defaultLabel,
  icon: spec.icon,
}));

export const ADMIN_NAV_SPECS: MemberNavSpec[] = [
  { to: '/admin', contentKey: 'nav.admin.dashboard', defaultLabel: 'Dashboard', icon: '📊', end: true },
  {
    to: '/admin/applications',
    contentKey: 'nav.admin.applications',
    defaultLabel: 'Applications',
    icon: '📋',
  },
  { to: '/admin/members', contentKey: 'nav.admin.members', defaultLabel: 'Users', icon: '👥' },
  { to: '/admin/matches', contentKey: 'nav.admin.matches', defaultLabel: 'Matches', icon: '⚽' },
  {
    to: '/admin/newsletter',
    contentKey: 'nav.admin.newsletter',
    defaultLabel: 'Newsletter',
    icon: '🗞️',
  },
  { to: '/admin/news', contentKey: 'nav.admin.news', defaultLabel: 'News', icon: '📰' },
  { to: '/admin/events', contentKey: 'nav.admin.events', defaultLabel: 'Events', icon: '📅' },
  {
    to: '/admin/check-in',
    contentKey: 'nav.admin.checkIn',
    defaultLabel: 'Event check-in',
    icon: '✅',
  },
  {
    to: '/admin/moderation',
    contentKey: 'nav.admin.moderation',
    defaultLabel: 'Moderation',
    icon: '🛡️',
  },
  { to: '/admin/cms', contentKey: 'nav.admin.cms', defaultLabel: 'CMS Pages', icon: '📝' },
  { to: '/admin/texts', contentKey: 'nav.admin.texts', defaultLabel: 'Texts & Labels', icon: '✏️' },
  {
    to: '/admin/settings',
    contentKey: 'nav.admin.settings',
    defaultLabel: 'Site settings',
    icon: '⚙️',
  },
  { to: '/admin/design', contentKey: 'nav.admin.design', defaultLabel: 'Design', icon: '🎨' },
  { to: '/admin/guide', contentKey: 'nav.admin.guide', defaultLabel: 'Guide', icon: '📖' },
  { to: '/admin/audit', contentKey: 'nav.admin.audit', defaultLabel: 'Audit log', icon: '📜' },
];

/** Bottom tab bar on mobile admin — reorder via site settings but keep newsletter reachable. */
export const ADMIN_MOBILE_TAB_SPECS: MemberNavSpec[] = [
  { to: '/admin', contentKey: 'nav.admin.tab.dashboard', defaultLabel: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/members', contentKey: 'nav.admin.tab.members', defaultLabel: 'Users', icon: '👥' },
  { to: '/admin/matches', contentKey: 'nav.admin.tab.matches', defaultLabel: 'Matches', icon: '⚽' },
  {
    to: '/admin/newsletter',
    contentKey: 'nav.admin.tab.newsletter',
    defaultLabel: 'Newsletter',
    icon: '🗞️',
  },
  { to: '/admin/news', contentKey: 'nav.admin.tab.news', defaultLabel: 'News', icon: '📰' },
];

export const ADMIN_NAV: NavItem[] = ADMIN_NAV_SPECS.map((spec) => ({
  to: spec.to,
  label: spec.defaultLabel,
  icon: spec.icon,
  end: spec.end,
}));

export const ADMIN_MOBILE_TABS: NavItem[] = ADMIN_MOBILE_TAB_SPECS.map((spec) => ({
  to: spec.to,
  label: spec.defaultLabel,
  icon: spec.icon,
  end: spec.end,
}));

export type QuickLinkSpec = {
  to: string;
  labelKey: string;
  descKey: string;
  defaultLabel: string;
  defaultDesc: string;
};

export const ADMIN_QUICK_LINK_SPECS: QuickLinkSpec[] = [
  {
    to: '/admin/applications',
    labelKey: 'admin.quick.applications.label',
    descKey: 'admin.quick.applications.desc',
    defaultLabel: 'Membership applications',
    defaultDesc: 'Review 2026/27 form submissions',
  },
  {
    to: '/admin/members',
    labelKey: 'admin.quick.members.label',
    descKey: 'admin.quick.members.desc',
    defaultLabel: 'Manage users',
    defaultDesc: 'Search, edit and invite members',
  },
  {
    to: '/admin/matches',
    labelKey: 'admin.quick.matches.label',
    descKey: 'admin.quick.matches.desc',
    defaultLabel: 'Manage matches',
    defaultDesc: 'Create Liverpool matches & scores',
  },
  {
    to: '/admin/news',
    labelKey: 'admin.quick.news.label',
    descKey: 'admin.quick.news.desc',
    defaultLabel: 'Publish news',
    defaultDesc: 'Write club announcements',
  },
  {
    to: '/admin/events',
    labelKey: 'admin.quick.events.label',
    descKey: 'admin.quick.events.desc',
    defaultLabel: 'Create event',
    defaultDesc: 'Watch parties & meetups',
  },
  {
    to: '/admin/cms',
    labelKey: 'admin.quick.cms.label',
    descKey: 'admin.quick.cms.desc',
    defaultLabel: 'Edit CMS',
    defaultDesc: 'About, committee, membership pages',
  },
  {
    to: '/admin/newsletter',
    labelKey: 'admin.quick.newsletter.label',
    descKey: 'admin.quick.newsletter.desc',
    defaultLabel: 'Monthly newsletter',
    defaultDesc: 'RedLeb Dispatch PDF template',
  },
  {
    to: '/app/community',
    labelKey: 'admin.quick.community.label',
    descKey: 'admin.quick.community.desc',
    defaultLabel: 'View community',
    defaultDesc: 'See the member feed',
  },
];

export function isAdminRole(roles: string[] | undefined): boolean {
  return Boolean(
    roles?.some((role) =>
      ['SUPER_ADMIN', 'COMMITTEE_ADMIN', 'CONTENT_MANAGER', 'GAME_MANAGER', 'EVENT_MANAGER'].includes(
        role,
      ),
    ),
  );
}
