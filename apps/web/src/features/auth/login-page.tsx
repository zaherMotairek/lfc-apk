import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './auth-context';
import { isAdminRole } from '../../components/layout/nav-config';
import { BrandLogo } from '../../components/ui/brand-logo';
import { useContent } from '../content/content-provider';

export function LoginPage() {
  const loginTitle = useContent('auth.login.title', 'Sign in to RedLeb Hub');
  const loginSubtitle = useContent(
    'auth.login.subtitle',
    'Sign in to predict matches, join events, and manage your OLSC Lebanon digital experience.',
  );
  const formHeading = useContent('auth.login.formHeading', 'Sign in');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectPath =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof (location.state as { from?: { pathname?: string; search?: string } }).from?.pathname ===
      'string'
      ? `${(location.state as { from: { pathname: string; search?: string } }).from.pathname}${
          (location.state as { from: { pathname: string; search?: string } }).from.search ?? ''
        }`
      : null;
  // Already signed in → never show the login form again
  if (isAuthenticated) {
    const safeRedirect =
      redirectPath &&
      redirectPath !== '/login' &&
      redirectPath !== '/signup' &&
      !redirectPath.startsWith('/forgot-password') &&
      !redirectPath.startsWith('/reset-password')
        ? redirectPath
        : isAdminRole(user?.roles)
          ? '/admin'
          : '/app';
    return <Navigate to={safeRedirect} replace />;
  }
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const loggedInUser = await login(username, password);
      const isAdmin = loggedInUser.roles.some((role) =>
        ['SUPER_ADMIN', 'COMMITTEE_ADMIN', 'CONTENT_MANAGER', 'GAME_MANAGER', 'EVENT_MANAGER'].includes(
          role,
        ),
      );
      navigate(redirectPath ?? (isAdmin ? '/admin' : '/app'), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="kop-container py-12 md:py-20">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl shadow-2xl md:grid-cols-2">
        {/* Brand panel */}
        <div className="kop-gradient-hero flex flex-col justify-between p-8 text-white md:p-10">
          <div>
            <div className="mb-6">
              <BrandLogo variant="light" subtitle="" to="/" />
            </div>
            <h1 className="text-3xl font-extrabold leading-tight">{loginTitle}</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/75">{loginSubtitle}</p>
          </div>
          <div className="mt-8 hidden border-t border-white/15 pt-6 text-xs text-white/50 md:block">
            You'll Never Walk Alone · OLSC Lebanon
          </div>
        </div>

        {/* Form panel */}
        <div className="bg-surface p-8 md:p-10">
          <h2 className="text-2xl font-extrabold text-ink">{formHeading}</h2>
          <p className="mt-2 text-sm text-black/55">
            Sign in with your username (e.g. <span className="font-semibold">test</span>) — not the full
            email.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">
              Username
              <input
                className="kop-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. test"
                required
                autoComplete="username"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                className="kop-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
            {error ? (
              <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-sm text-lfc-red">
                {error}
              </div>
            ) : null}
            <button type="submit" disabled={loading} className="kop-btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-black/55">
            <Link to="/signup" className="kop-btn-secondary w-full">
              Create account
            </Link>
            <p>
              <Link to="/forgot-password" className="font-semibold text-lfc-red hover:underline">
                Forgot password?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
