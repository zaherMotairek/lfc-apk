export type NavItem = {
  to: string;
  label: string;
  icon?: string;
  end?: boolean;
  external?: boolean;
};

export const PUBLIC_NAV: NavItem[] = [
  { to: '/about', label: 'About' },
  { to: '/committee', label: 'Committee' },
  { to: '/events', label: 'Events' },
  { to: '/news', label: 'News' },
  { to: '/newsletter', label: 'Newsletter' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/membership', label: 'Membership' },
  { to: '/contact', label: 'Contact' },
];

export const MEMBER_NAV: NavItem[] = [
  { to: '/app', label: 'Home', icon: '🏠', end: true },
  { to: '/app/matches', label: 'Match Hub', icon: '⚽' },
  { to: '/app/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/app/community', label: 'Community Feed', icon: '📣' },
  { to: '/app/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/app/hall-of-fame', label: 'Hall of Fame', icon: '👑' },
  { to: '/app/profile', label: 'My Profile', icon: '👤' },
  { to: '/app/membership-card', label: 'Membership Card', icon: '🎫' },
];

export const MEMBER_EXTRA_NAV: NavItem[] = [
  { to: '/news', label: 'Club News', icon: '📰' },
  { to: '/newsletter', label: 'Newsletter', icon: '🗞️' },
  { to: '/events', label: 'Public Events', icon: '📅' },
  { to: '/gallery', label: 'Gallery', icon: '🖼️' },
];

export const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/applications', label: 'Applications', icon: '📋' },
  { to: '/admin/members', label: 'Users', icon: '👥' },
  { to: '/admin/matches', label: 'Matches', icon: '⚽' },
  { to: '/admin/newsletter', label: 'Newsletter', icon: '🗞️' },
  { to: '/admin/news', label: 'News', icon: '📰' },
  { to: '/admin/events', label: 'Events', icon: '📅' },
  { to: '/admin/cms', label: 'CMS Pages', icon: '📝' },
  { to: '/admin/texts', label: 'Texts & Labels', icon: '✏️' },
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
