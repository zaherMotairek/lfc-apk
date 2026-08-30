import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetLink(null);
    try {
      const result = await apiRequest<{
        message: string;
        resetLink?: string;
        emailSent?: boolean;
      }>('/auth/forgot-password', {
        method: 'POST',
        body: { email },
      });
      setMessage(
        result.emailSent
          ? `${result.message} Check your inbox.`
          : result.message,
      );
      setResetLink(result.resetLink ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Forgot Password</h1>
      <p className="mb-8 text-black/60">
        Enter your email. If an active account exists, a reset link will be generated.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow">
        <label className="block text-sm">
          Email
          <input
            className="mt-1 w-full rounded border border-black/15 px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-[#c8102e]">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        {resetLink ? (
          <p className="break-all text-xs text-black/60">
            Dev reset link:{' '}
            <Link to={resetLink.includes('?') ? `/reset-password?${resetLink.split('?')[1]}` : '/reset-password'}>
              Open reset page
            </Link>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-[#101418] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </section>
  );
}
