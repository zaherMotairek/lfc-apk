import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { isAdminRole, MEMBER_EXTRA_NAV, MEMBER_NAV } from '../components/layout/nav-config';
import { InstallAppBanner } from '../components/ui/install-app-banner';
import { PageBackBar } from '../components/ui/page-back-bar';
import {
  HorizontalNav,
  MobileDrawer,
  MobileTabBar,
  NavFooterLink,
  SidebarNav,
} from '../components/layout/sidebar-nav';

const mobileTabs = [
  { to: '/app', label: 'Home', icon: '🏠', end: true },
  { to: '/app/matches', label: 'Matches', icon: '⚽' },
  { to: '/app/community', label: 'Community', icon: '📣' },
  { to: '/app/membership-card', label: 'Card', icon: '🎫' },
  { to: '/app/profile', label: 'Profile', icon: '👤' },
];

function memberBackFallback(pathname: string) {
  if (/^\/app\/matches\/[^/]+$/.test(pathname)) {
    return '/app/matches';
  }
  return '/app';
}

export function MemberLayout() {
  const { user, logout } = useAuth();
  const isAdmin = isAdminRole(user?.roles);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarItems = [
    ...MEMBER_NAV,
    ...MEMBER_EXTRA_NAV,
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: '⚙️' }] : []),
  ];

  const mobileNavItems = [
    ...MEMBER_NAV,
    ...MEMBER_EXTRA_NAV,
    ...(isAdmin ? [{ to: '/admin', label: 'Admin Panel', icon: '⚙️' }] : []),
  ];

  return (
    <div className="min-h-screen bg-paper pb-[calc(5rem+env(safe-area-inset-bottom))] md:grid md:grid-cols-[260px_1fr] md:pb-0">
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="RedLeb Hub"
        subtitle="OLSC Lebanon · Member App"
        items={mobileNavItems}
        footer={
          <>
            <NavFooterLink to="/">← Public website</NavFooterLink>
            <button
              type="button"
              onClick={() => { logout(); setDrawerOpen(false); }}
              className="mt-1 block w-full rounded-xl px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          </>
        }
      />
      <div className="hidden md:block">
        <SidebarNav
          title="RedLeb Hub"
          subtitle="OLSC Lebanon · Member App"
          items={sidebarItems}
          footer={
            <>
              <NavFooterLink to="/">← Public website</NavFooterLink>
              <button
                type="button"
                onClick={logout}
                className="mt-1 block w-full rounded-xl px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Logout
              </button>
            </>
          }
        />
      </div>

      <div className="min-w-0">
        <HorizontalNav items={mobileNavItems} />

        <header className="flex items-center justify-between border-b border-black/5 bg-lfc-red px-4 py-3 text-white md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-1.5 hover:bg-white/15 active:bg-white/25"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <rect y="3" width="20" height="2" rx="1"/>
                <rect y="9" width="20" height="2" rx="1"/>
                <rect y="15" width="20" height="2" rx="1"/>
              </svg>
            </button>
            <div>
              <div className="text-sm font-extrabold">RedLeb Hub</div>
              <div className="text-[11px] text-white/65">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InstallAppBanner variant="compact" />
            {isAdmin ? (
              <Link to="/admin" className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold">
                Admin
              </Link>
            ) : null}
          </div>
        </header>

        <main className="px-4 py-4 md:px-8 md:py-8">
          <PageBackBar hideOn="/app" fallbackTo="/app" resolveFallback={memberBackFallback} />
          <Outlet />
        </main>
      </div>

      <MobileTabBar items={mobileTabs} />
    </div>
  );
}
