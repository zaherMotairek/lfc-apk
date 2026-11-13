import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { isAdminRole } from '../components/layout/nav-config';
import { useMemberNav } from '../components/layout/use-member-nav';
import { InstallAppBanner } from '../components/ui/install-app-banner';
import { PageBackBar } from '../components/ui/page-back-bar';
import {
  HorizontalNav,
  MobileDrawer,
  MobileTabBar,
  NavFooterLink,
  SidebarNav,
} from '../components/layout/sidebar-nav';
import { useFeatureFlags } from '../features/site/use-feature-flags';
import { LanguageSwitcher } from '../components/ui/language-switcher';

function memberBackFallback(pathname: string) {
  if (/^\/app\/matches\/[^/]+$/.test(pathname)) {
    return '/app/matches';
  }
  return '/app';
}

export function MemberLayout() {
  const { user, logout } = useAuth();
  const { predictionsEnabled } = useFeatureFlags();
  const isAdmin = isAdminRole(user?.roles);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    drawerNav,
    mobileTabs,
    adminShort,
    shellTitle,
    shellSubtitle,
    footerPublic,
    logoutLabel,
  } = useMemberNav({ predictionsEnabled, includeAdminLink: isAdmin });

  return (
    <div className="min-h-screen bg-paper pb-[calc(5rem+env(safe-area-inset-bottom))] md:grid md:grid-cols-[260px_1fr] md:pb-0">
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={shellTitle}
        subtitle={shellSubtitle}
        items={drawerNav}
        footer={
          <>
            <NavFooterLink to="/">{footerPublic}</NavFooterLink>
            <button
              type="button"
              onClick={() => { logout(); setDrawerOpen(false); }}
              className="mt-1 block w-full rounded-xl px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {logoutLabel}
            </button>
          </>
        }
      />
      <div className="hidden md:block">
        <SidebarNav
          title={shellTitle}
          subtitle={shellSubtitle}
          items={drawerNav}
          footer={
            <>
              <NavFooterLink to="/">{footerPublic}</NavFooterLink>
              <button
                type="button"
                onClick={logout}
                className="mt-1 block w-full rounded-xl px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                {logoutLabel}
              </button>
            </>
          }
        />
      </div>

      <div className="min-w-0">
        <HorizontalNav items={drawerNav} />

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
              <div className="text-sm font-extrabold">{shellTitle}</div>
              <div className="text-[11px] text-white/65">
                {user?.firstName} {user?.lastName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher className="!text-white" />
            <InstallAppBanner variant="compact" />
            {isAdmin ? (
              <Link to="/admin" className="rounded-lg bg-white/15 px-3 py-2 text-xs font-bold">
                {adminShort}
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
