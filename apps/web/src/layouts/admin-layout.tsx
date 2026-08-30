import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../features/auth/auth-context';
import { ADMIN_MOBILE_TABS, ADMIN_NAV } from '../components/layout/nav-config';
import { InstallAppBanner } from '../components/ui/install-app-banner';
import { PageBackBar } from '../components/ui/page-back-bar';
import {
  HorizontalNav,
  MobileDrawer,
  MobileTabBar,
  NavFooterLink,
  SidebarNav,
} from '../components/layout/sidebar-nav';

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper pb-[calc(5rem+env(safe-area-inset-bottom))] md:grid md:grid-cols-[260px_1fr] md:pb-0">
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Admin Panel"
        subtitle="OLSC Lebanon Committee"
        items={ADMIN_NAV}
        footer={
          <>
            <NavFooterLink to="/app">← Member App</NavFooterLink>
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
          title="Admin Panel"
          subtitle="OLSC Lebanon Committee"
          items={ADMIN_NAV}
          footer={
            <>
              <NavFooterLink to="/app">← Member App</NavFooterLink>
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
        <HorizontalNav items={ADMIN_NAV} />

        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-surface/95 px-4 py-3 backdrop-blur md:px-6 md:py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-1.5 hover:bg-black/5 active:bg-black/10 md:hidden"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-ink">
                <rect y="3" width="20" height="2" rx="1"/>
                <rect y="9" width="20" height="2" rx="1"/>
                <rect y="15" width="20" height="2" rx="1"/>
              </svg>
            </button>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-black/40 md:hidden">
                Admin Panel
              </div>
              <div className="text-sm font-medium text-black/70">
                {user?.firstName} {user?.lastName}
                <span className="hidden md:inline"> · Committee Control Center</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InstallAppBanner variant="compact" />
            <Link to="/app" className="kop-btn-secondary !py-2 !text-xs">
              Member App
            </Link>
            <button type="button" onClick={logout} className="kop-btn-secondary !py-2 !text-xs">
              Logout
            </button>
          </div>
        </header>

        <main className="px-4 py-4 md:px-8 md:py-8">
          <PageBackBar hideOn="/admin" fallbackTo="/admin" />
          <Outlet />
        </main>
      </div>

      <MobileTabBar items={ADMIN_MOBILE_TABS} />
    </div>
  );
}
