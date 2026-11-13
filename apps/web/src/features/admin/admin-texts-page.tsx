import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { useToast } from '../../components/ui/toast-provider';

type TextRow = {
  key: string;
  area: string;
  description?: string;
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

  const groupedRows = useMemo(() => {
    const map = new Map<string, TextRow[]>();
    for (const row of rows) {
      const bucket = map.get(row.area) ?? [];
      bucket.push(row);
      map.set(row.area, bucket);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

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

  const rollbackMutation = useMutation({
    mutationFn: (key: string) =>
      apiRequest<{ message: string }>('/admin/content/texts/rollback', {
        method: 'POST',
        token: accessToken,
        body: { key, language: 'en' },
      }),
    onSuccess: (res) => {
      setMessage(res.message);
      showToast(res.message, 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-content-texts'] });
      void queryClient.invalidateQueries({ queryKey: ['content-bundle'] });
    },
    onError: (err) => showToast(err instanceof Error ? err.message : 'Rollback failed', 'error'),
  });

  const revisionsQuery = useQuery({
    queryKey: ['content-revisions', editingKey],
    queryFn: () =>
      apiRequest<
        Array<{ id: string; valueBefore: string | null; valueAfter: string; createdAt: string }>
      >(`/admin/content/texts/revisions?key=${encodeURIComponent(editingKey!)}&lang=en`, {
        token: accessToken,
      }),
    enabled: Boolean(accessToken && editingKey),
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

      <div className="space-y-6">
        {groupedRows.map(([area, areaRows]) => (
          <div key={area} className="kop-card overflow-hidden">
            <div className="border-b border-black/5 bg-black/[0.02] px-4 py-3 text-xs font-bold uppercase tracking-widest text-black/45">
              {area} ({areaRows.length})
            </div>
            <table className="w-full text-left text-sm">
              <thead className="sr-only">
                <tr>
                  <th>Key</th>
                  <th>Current</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {areaRows.map((row) => (
                  <tr key={row.key} className="border-b border-black/5 align-top last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-black/55">{row.key}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.currentValue}</div>
                      {row.description ? (
                        <div className="mt-1 text-xs text-black/45">{row.description}</div>
                      ) : null}
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
                          <>
                            <button
                              type="button"
                              className="kop-btn-ghost !text-xs"
                              onClick={() => rollbackMutation.mutate(row.key)}
                            >
                              Roll back
                            </button>
                            <button
                              type="button"
                              className="kop-btn-ghost !text-xs"
                              onClick={() => resetMutation.mutate(row.key)}
                            >
                              Reset
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {editingKey ? (
        <form onSubmit={onSubmit} className="kop-card space-y-3 p-5">
          <h2 className="font-bold">Edit {editingKey}</h2>
          <textarea className="kop-input min-h-28" value={draft} onChange={(e) => setDraft(e.target.value)} required />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="kop-btn-primary" disabled={saveMutation.isPending}>
              Save
            </button>
            {editingKey && rows.find((r) => r.key === editingKey)?.isOverridden ? (
              <button
                type="button"
                className="kop-btn-secondary"
                disabled={rollbackMutation.isPending}
                onClick={() => rollbackMutation.mutate(editingKey)}
              >
                Roll back once
              </button>
            ) : null}
            <button type="button" className="kop-btn-secondary" onClick={() => setEditingKey(null)}>
              Cancel
            </button>
          </div>
          {revisionsQuery.data?.length ? (
            <div className="border-t border-black/5 pt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-black/40">Recent revisions</div>
              <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto text-xs text-black/55">
                {revisionsQuery.data.map((rev) => (
                  <li key={rev.id} className="rounded-lg bg-black/[0.03] px-3 py-2">
                    <time>{new Date(rev.createdAt).toLocaleString()}</time>
                    <div className="mt-1 text-black/70">→ {rev.valueAfter.slice(0, 120)}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
