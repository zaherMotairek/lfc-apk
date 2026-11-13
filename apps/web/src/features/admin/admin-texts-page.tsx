import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { useToast } from '../../components/ui/toast-provider';

type TextRow = {
  key: string;
  area: string;
  description: string;
  defaultValue: string;
  currentValue: string;
  isOverridden: boolean;
};

export function AdminTextsPage() {
  const showToast = useToast();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('');
  const [changedOnly, setChangedOnly] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const textsQuery = useQuery({
    queryKey: ['admin-content-texts'],
    queryFn: () => apiRequest<TextRow[]>('/admin/content/texts?lang=en', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const rows = useMemo(() => {
    let list = textsQuery.data ?? [];
    if (changedOnly) list = list.filter((row) => row.isOverridden);
    if (filter.trim()) {
      const q = filter.trim().toLowerCase();
      list = list.filter(
        (row) =>
          row.key.toLowerCase().includes(q) ||
          row.area.toLowerCase().includes(q) ||
          row.currentValue.toLowerCase().includes(q),
      );
    }
    return list;
  }, [textsQuery.data, filter, changedOnly]);

  const saveMutation = useMutation({
    mutationFn: (body: { key: string; value: string }) =>
      apiRequest<{ message: string }>('/admin/content/texts', {
        method: 'PUT',
        token: accessToken,
        body: { ...body, language: 'en' },
      }),
    onSuccess: (res) => {
      setMessage(res.message);
      showToast(res.message, 'success');
      setEditingKey(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-content-texts'] });
      void queryClient.invalidateQueries({ queryKey: ['content-bundle'] });
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : 'Save failed'),
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) =>
      apiRequest<{ message: string }>(
        `/admin/content/texts?key=${encodeURIComponent(key)}&lang=en`,
        { method: 'DELETE', token: accessToken },
      ),
    onSuccess: (res) => {
      setMessage(res.message);
      void queryClient.invalidateQueries({ queryKey: ['admin-content-texts'] });
      void queryClient.invalidateQueries({ queryKey: ['content-bundle'] });
    },
  });

  function startEdit(row: TextRow) {
    setEditingKey(row.key);
    setDraft(row.currentValue);
    setMessage(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!editingKey) return;
    saveMutation.mutate({ key: editingKey, value: draft });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="Texts & Labels"
        description="Search and edit registry copy used across the public site and member app."
      />

      {message ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
          {message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="kop-input flex-1"
          placeholder="Search keys, areas, text…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={changedOnly}
            onChange={(e) => setChangedOnly(e.target.checked)}
          />
          Changed only
        </label>
      </div>

      <div className="kop-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-black/[0.02] text-xs uppercase tracking-wide text-black/45">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3">Current</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-black/5 align-top">
                <td className="px-4 py-3 font-mono text-xs">{row.key}</td>
                <td className="px-4 py-3">{row.area}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{row.currentValue}</div>
                  {row.isOverridden ? (
                    <div className="mt-1 text-xs text-black/45">Default: {row.defaultValue}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="kop-btn-secondary !text-xs" onClick={() => startEdit(row)}>
                      Edit
                    </button>
                    {row.isOverridden ? (
                      <button
                        type="button"
                        className="kop-btn-ghost !text-xs"
                        onClick={() => resetMutation.mutate(row.key)}
                      >
                        Reset
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingKey ? (
        <form onSubmit={onSubmit} className="kop-card space-y-3 p-5">
          <h2 className="font-bold">Edit {editingKey}</h2>
          <textarea className="kop-input min-h-28" value={draft} onChange={(e) => setDraft(e.target.value)} required />
          <div className="flex gap-2">
            <button type="submit" className="kop-btn-primary" disabled={saveMutation.isPending}>
              Save
            </button>
            <button type="button" className="kop-btn-secondary" onClick={() => setEditingKey(null)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
