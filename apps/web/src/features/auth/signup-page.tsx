import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from './auth-context';

export function SignupPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<{
        message: string;
        accessToken: string;
        user: {
          id: string;
          firstName: string;
          lastName: string;
          email: string;
          roles: string[];
          permissions: string[];
        };
      }>('/auth/signup', {
        method: 'POST',
        body: { username, password },
      });

      setSession(result.accessToken, result.user);
      navigate('/app/profile', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="kop-container py-12 md:py-20">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-3xl shadow-2xl md:grid-cols-2">
        <div className="kop-gradient-hero flex flex-col justify-between p-8 text-white md:p-10">
          <div>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-lg font-black">
              OL
            </div>
            <h1 className="text-3xl font-extrabold leading-tight">Create your account</h1>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Choose a username and password. Then complete your profile with your name and LFC /
              OLSC member details.
            </p>
          </div>
          <div className="mt-8 hidden border-t border-white/15 pt-6 text-xs text-white/50 md:block">
            You'll Never Walk Alone · OLSC Lebanon
          </div>
        </div>

        <div className="bg-surface p-8 md:p-10">
          <h2 className="text-2xl font-extrabold text-ink">Sign up</h2>
          <p className="mt-2 text-sm text-black/55">No email code needed — just username and password.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">
              Username
              <input
                className="kop-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. kopfan09"
                minLength={3}
                maxLength={32}
                pattern="[a-zA-Z0-9._\-]+"
                required
                autoComplete="username"
              />
            </label>
            <label className="block text-sm font-medium">
              Password
              <input
                className="kop-input"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </label>

            {error ? (
              <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-sm text-lfc-red">
                {error}
              </div>
            ) : null}

            <button type="submit" disabled={loading} className="kop-btn-primary w-full">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-sm text-black/55">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-lfc-red hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
