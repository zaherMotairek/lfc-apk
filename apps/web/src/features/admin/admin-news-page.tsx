import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type AdminNewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  author?: { firstName: string; lastName: string } | null;
};

const EMPTY_FORM = { title: '', slug: '', excerpt: '', content: '', status: 'PUBLISHED' };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function AdminNewsPage() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const newsQuery = useQuery({
    queryKey: ['admin-news'],
    queryFn: () => apiRequest<AdminNewsItem[]>('/admin/news', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/admin/news/${id}`, {
        method: 'DELETE',
        token: accessToken,
      }),
    onSuccess: (res, deletedId) => {
      setMessage(res.message);
      if (editingId === deletedId) closeForm();
      void queryClient.invalidateQueries({ queryKey: ['admin-news'] });
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : 'Delete failed'),
  });

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
  }

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setShowForm(true);
    setMessage(null);
  }

  function startEdit(item: AdminNewsItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt ?? '',
      content: item.content ?? '',
      status: item.status,
    });
    setSlugTouched(true);
    setShowForm(true);
    setMessage(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const body = {
        ...form,
        slug: form.slug.trim() || slugify(form.title),
      };
      const res = editingId
        ? await apiRequest<{ message: string }>(`/admin/news/${editingId}`, {
            method: 'PUT',
            token: accessToken,
            body,
          })
        : await apiRequest<{ message: string }>('/admin/news', {
            method: 'POST',
            token: accessToken,
            body,
          });
      setMessage(res.message);
      closeForm();
      await queryClient.invalidateQueries({ queryKey: ['admin-news'] });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  function askDelete(item: AdminNewsItem) {
    if (window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(item.id);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title="News"
        description="Publish, edit or delete OLSC Lebanon announcements."
        action={
          <button
            type="button"
            className={showForm ? 'kop-btn-secondary' : 'kop-btn-primary'}
            onClick={() => (showForm ? closeForm() : startCreate())}
          >
            {showForm ? 'Close' : '+ New article'}
          </button>
        }
      />

      {message ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
          {message}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={onSubmit} className="kop-card space-y-4 p-5">
          <h2 className="font-bold">{editingId ? 'Edit article' : 'New article'}</h2>
          <label className="block text-sm font-medium">
            Title
            <input
              className="kop-input"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((p) => ({
                  ...p,
                  title,
                  slug: slugTouched ? p.slug : slugify(title),
                }));
              }}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Slug (URL)
            <input
              className="kop-input"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((p) => ({ ...p, slug: e.target.value }));
              }}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Excerpt
            <input
              className="kop-input"
              value={form.excerpt}
              onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
            />
          </label>
          <label className="block text-sm font-medium">
            Content
            <textarea
              className="kop-input min-h-36"
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Status
            <select
              className="kop-input"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="kop-btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish'}
            </button>
            {editingId ? (
              <button type="button" className="kop-btn-secondary" onClick={closeForm}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="space-y-3">
        <div>
          <h2 className="text-base font-bold">Articles</h2>
          <p className="mt-1 text-sm text-black/50">
            {newsQuery.data?.length ?? '—'} article{newsQuery.data?.length !== 1 ? 's' : ''} total
          </p>
        </div>

        {newsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="kop-card animate-pulse p-5">
                <div className="h-4 w-2/3 rounded bg-black/5" />
                <div className="mt-2 h-3 w-1/3 rounded bg-black/5" />
              </div>
            ))}
          </div>
        ) : null}

        {!newsQuery.isLoading && !newsQuery.data?.length ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-surface px-5 py-10 text-center text-sm text-black/50">
            No articles yet. Add the first one above.
          </div>
        ) : null}

        {(newsQuery.data ?? []).map((item) => (
          <div key={item.id} className="kop-card flex flex-wrap items-start justify-between gap-3 p-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={item.status === 'PUBLISHED' ? 'kop-badge-green' : 'kop-badge'}>
                  {item.status}
                </span>
                <span className="text-xs text-black/40">{formatDate(item.createdAt)}</span>
                {item.author ? (
                  <span className="text-xs text-black/40">
                    by {item.author.firstName} {item.author.lastName}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 font-bold text-ink">{item.title}</div>
              {item.excerpt ? (
                <div className="mt-1 line-clamp-2 text-sm text-black/55">{item.excerpt}</div>
              ) : null}
              <div className="mt-1 text-xs text-black/35">/{item.slug}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="kop-btn-secondary !py-2 !text-xs"
                onClick={() => startEdit(item)}
              >
                Edit
              </button>
              <button
                type="button"
                className="kop-btn-secondary !border-lfc-red/20 !py-2 !text-xs !text-lfc-red hover:!bg-lfc-red/5"
                onClick={() => askDelete(item)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
