import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandLogo } from '../components/ui/brand-logo';
import { InstallAppBanner } from '../components/ui/install-app-banner';
import { PageBackBar } from '../components/ui/page-back-bar';
import { useAuth } from '../features/auth/auth-context';
import { useContent } from '../features/content/content-provider';
import { isAdminRole, PUBLIC_NAV } from '../components/layout/nav-config';

function publicBackFallback(pathname: string) {
  if (/^\/news\/[^/]+$/.test(pathname)) return '/news';
  if (/^\/newsletter\/[^/]+$/.test(pathname)) return '/newsletter';
  if (/^\/events\/[^/]+$/.test(pathname)) return '/events';
  if (/^\/gallery\/[^/]+$/.test(pathname)) return '/gallery';
  if (
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname === '/accept-invitation'
  ) {
    return '/login';
  }
  return '/';
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const headerRibbon = useContent('public.header.ribbon', 'OLSC Lebanon · RedLeb Hub');
  const becomeMemberLabel = useContent('nav.becomeMember', 'Become a member');
  const signInLabel = useContent('nav.signIn', 'Sign in');
  const membersFooterHeading = useContent('footer.membersHeading', 'Members');
  const isAdmin = isAdminRole(user?.roles);
  const location = useLocation();
  const loginTarget = {
    pathname: '/login',
  } as const;
  const loginState = {
    from: {
      pathname: location.pathname,
      search: location.search,
    },
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 kop-gradient-dark text-white shadow-xl">
        <div className="flex items-center justify-end gap-2 border-b border-white/10 bg-lfc-red px-4 py-1.5">
          <span className="mr-auto hidden text-[10px] font-semibold uppercase tracking-widest text-white/80 sm:inline">
            {headerRibbon}
          </span>
          <InstallAppBanner variant="compact" />
        </div>

        <div className="kop-container flex items-center justify-between gap-4 py-4">
          <BrandLogo />

          <nav className="hidden items-center gap-1 lg:flex">
            {PUBLIC_NAV.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'kop-nav-link-active' : 'kop-nav-link')}
              >
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/app" className="kop-btn-ghost !text-sm">
                  Member App
                </Link>
                {isAdmin ? (
                  <Link to="/admin" className="kop-btn-ghost !text-sm">
                    Admin Panel
                  </Link>
                ) : null}
                <Link to="/app/profile" className="kop-btn-primary ml-2 !py-2.5 !text-sm">
                  Account
                </Link>
              </>
            ) : (
              <>
                <Link to="/membership/apply" className="kop-btn-ghost !text-sm">
                  {becomeMemberLabel}
                </Link>
                <Link to={loginTarget} state={loginState} className="kop-btn-ghost ml-2 !py-2.5 !text-sm">
                  {signInLabel}
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-white lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen ? (
          <nav className="border-t border-white/10 px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {PUBLIC_NAV.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    to="/app"
                    className="rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10"
                    onClick={() => setMenuOpen(false)}
                  >
                    Member App
                  </Link>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      className="rounded-lg px-3 py-3 text-sm font-medium text-white/80 hover:bg-white/10"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin Panel
                    </Link>
                  ) : null}
                  <Link
                    to="/app"
                    className="kop-btn-primary mt-2 text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    Open Member App
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/membership/apply"
                    className="kop-btn-primary mt-2 text-center"
                    onClick={() => setMenuOpen(false)}
                  >
                    {becomeMemberLabel}
                  </Link>
                  <Link
                    to={loginTarget}
                    state={loginState}
                    className="kop-btn-secondary mt-2 text-center !border-white/20 !bg-white/10 !text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {signInLabel}
                  </Link>
                </>
              )}
            </div>
          </nav>
        ) : null}
      </header>

      <main>
        <PageBackBar
          hideOn="/"
          fallbackTo="/"
          resolveFallback={publicBackFallback}
          className="page-back-bar-public"
        />
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-black/5 kop-gradient-dark text-white">
        <div className="kop-container grid gap-8 py-12 md:grid-cols-3">
          <div>
            <BrandLogo subtitle="Official Supporters Club" />
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              The digital home of Liverpool FC supporters in Lebanon. Community, match predictions,
              and official membership — managed by the committee.
            </p>
          </div>
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">Site</div>
            <div className="flex flex-col gap-2 text-sm text-white/70">
              {PUBLIC_NAV.map((link) => (
                <Link key={link.to} to={link.to} className="hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-3 text-xs font-bold uppercase tracking-widest text-white/40">{membersFooterHeading}</div>
                        <div className="flex flex-col gap-2 text-sm text-white/70">
              {isAuthenticated ? (
                <>
                  <Link to="/app" className="hover:text-white">
                    Member App
                  </Link>
                  <Link to="/app/profile" className="hover:text-white">
                    My Account
                  </Link>
                  {isAdmin ? (
                    <Link to="/admin" className="hover:text-white">
                      Admin Panel
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <Link to="/membership/apply" className="hover:text-white">
                    {becomeMemberLabel}
                  </Link>
                  <Link to={loginTarget} state={loginState} className="hover:text-white">
                    {signInLabel}
                  </Link>
                </>
              )}
            </div>
            <p className="mt-6 text-xs text-white/35">
              Respect LFC / OLSC content and branding guidelines.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/35">
          © {new Date().getFullYear()} OLSC Lebanon · You'll Never Walk Alone
        </div>
      </footer>
    </div>
  );
}
