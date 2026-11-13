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

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/applications', label: 'Applications', icon: '📋' },
  { to: '/admin/members', label: 'Users', icon: '👥' },
  { to: '/admin/matches', label: 'Matches', icon: '⚽' },
  { to: '/admin/newsletter', label: 'Newsletter', icon: '🗞️' },
  { to: '/admin/news', label: 'News', icon: '📰' },
  { to: '/admin/events', label: 'Events', icon: '📅' },
  { to: '/admin/check-in', label: 'Event check-in', icon: '✅' },
  { to: '/admin/moderation', label: 'Moderation', icon: '🛡️' },
  { to: '/admin/cms', label: 'CMS Pages', icon: '📝' },
  { to: '/admin/texts', label: 'Texts & Labels', icon: '✏️' },
  { to: '/admin/settings', label: 'Site settings', icon: '⚙️' },
  { to: '/admin/design', label: 'Design', icon: '🎨' },
  { to: '/admin/guide', label: 'Guide', icon: '📖' },
  { to: '/admin/audit', label: 'Audit log', icon: '📜' },
];

/** Bottom tab bar on mobile admin — Newsletter must stay visible here. */
export const ADMIN_MOBILE_TABS: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/members', label: 'Users', icon: '👥' },
  { to: '/admin/matches', label: 'Matches', icon: '⚽' },
  { to: '/admin/newsletter', label: 'Newsletter', icon: '🗞️' },
  { to: '/admin/news', label: 'News', icon: '📰' },
];

export const ADMIN_QUICK_LINKS = [
  { to: '/admin/applications', label: 'Membership applications', desc: 'Review 2026/27 form submissions' },
  { to: '/admin/members', label: 'Manage users', desc: 'Search, edit and invite members' },
  { to: '/admin/matches', label: 'Manage matches', desc: 'Create Liverpool matches & scores' },
  { to: '/admin/news', label: 'Publish news', desc: 'Write club announcements' },
  { to: '/admin/events', label: 'Create event', desc: 'Watch parties & meetups' },
  { to: '/admin/cms', label: 'Edit CMS', desc: 'About, committee, membership pages' },
  { to: '/admin/newsletter', label: 'Monthly newsletter', desc: 'RedLeb Dispatch PDF template' },
  { to: '/app/community', label: 'View community', desc: 'See the member feed' },
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
