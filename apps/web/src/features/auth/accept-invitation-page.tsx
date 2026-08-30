import { FormEvent, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

export function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const [token, setToken] = useState(params.get('token') ?? '');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const result = await apiRequest<{ message: string }>('/auth/accept-invitation', {
        method: 'POST',
        body: { token, password },
      });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Activate Account</h1>
      <p className="mb-8 text-black/60">
        Set your password to activate your OLSC Lebanon platform access. Your digital
        membership card will be generated after activation.
      </p>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow">
        <label className="block text-sm">
          Invitation token
          <input
            className="mt-1 w-full rounded border border-black/15 px-3 py-2"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          New password
          <input
            className="mt-1 w-full rounded border border-black/15 px-3 py-2"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-[#c8102e]">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-[#101418] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Activating...' : 'Activate account'}
        </button>
      </form>
    </section>
  );
}
