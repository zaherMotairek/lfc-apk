import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/auth-context';
import { apiRequest, apiUploadForm } from '../../lib/api';
import { useConfirm } from '../../components/ui/confirm-provider';

type AdminNewsletter = {
  id: string;
  title: string;
  slug: string;
  issueNumber: number;
  monthLabel: string;
  excerpt?: string | null;
  pdfUrl: string;
  isPublished: boolean;
  publishedAt?: string | null;
  scheduledPublishAt?: string | null;
};

export function AdminNewsletterPublish() {
  const { accessToken } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [issueNumber, setIssueNumber] = useState('1');
  const [monthLabel, setMonthLabel] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-newsletters'],
    queryFn: () => apiRequest<AdminNewsletter[]>('/admin/newsletters', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Choose a PDF first.');
      const body = new FormData();
      body.append('file', file);
      body.append('title', title);
      body.append('issueNumber', issueNumber);
      body.append('monthLabel', monthLabel);
      body.append('excerpt', excerpt);
      body.append('saveAsDraft', saveAsDraft ? 'true' : 'false');
      if (scheduledAt.trim()) body.append('scheduledPublishAt', new Date(scheduledAt).toISOString());
      return apiUploadForm<{ message: string }>('/admin/newsletters', body, accessToken);
    },
    onSuccess: (res) => {
      setMessage(res.message);
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] });
      void queryClient.invalidateQueries({ queryKey: ['public-newsletters'] });
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : 'Publish failed'),
  });

  const publishDraftMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/admin/newsletters/${id}`, {
        method: 'PUT',
        token: accessToken,
        body: { isPublished: true, publishedAt: new Date().toISOString(), scheduledPublishAt: null },
      }),
    onSuccess: (res) => {
      setMessage(res.message);
      void queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] });
      void queryClient.invalidateQueries({ queryKey: ['public-newsletters'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/admin/newsletters/${id}`, {
        method: 'DELETE',
        token: accessToken,
      }),
    onSuccess: (res) => {
      setMessage(res.message);
      void queryClient.invalidateQueries({ queryKey: ['admin-newsletters'] });
      void queryClient.invalidateQueries({ queryKey: ['public-newsletters'] });
    },
    onError: (err) => setMessage(err instanceof Error ? err.message : 'Delete failed'),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    publishMutation.mutate();
  }

  return (
    <div className="kop-card space-y-5 p-5">
      <div>
        <h2 className="text-lg font-bold">Publish on the website</h2>
        <p className="mt-1 text-sm text-black/55">
          Upload a finished PDF (generated here or from outside). It appears in the public Newsletter
          menu. Anyone can click it to read the PDF.
        </p>
      </div>

      {message ? (
        <div className="rounded-xl border border-pitch/20 bg-pitch/5 px-4 py-3 text-sm text-pitch">
          {message}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Title
          <input
            className="kop-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="RedLeb Dispatch · Issue 01"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Issue number
          <input
            className="kop-input"
            type="number"
            min={1}
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium">
          Month
          <input
            className="kop-input"
            value={monthLabel}
            onChange={(e) => setMonthLabel(e.target.value.toUpperCase())}
            placeholder="SEPTEMBER 2026"
            required
          />
        </label>
        <label className="block text-sm font-medium">
          PDF file
          <input
            className="kop-input"
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            required
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input
            type="checkbox"
            checked={saveAsDraft}
            onChange={(e) => setSaveAsDraft(e.target.checked)}
          />
          Save as draft (not public until you publish)
        </label>
        <label className="block text-sm font-medium md:col-span-2">
          Schedule publish (optional)
          <input
            className="kop-input mt-1"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            disabled={saveAsDraft}
          />
        </label>
        <label className="block text-sm font-medium md:col-span-2">
          Short intro (optional)
          <input
            className="kop-input"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Season review, committee notes, and what’s next."
          />
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="kop-btn-primary" disabled={publishMutation.isPending}>
            {publishMutation.isPending
              ? 'Saving…'
              : saveAsDraft
                ? 'Save draft'
                : scheduledAt
                  ? 'Schedule issue'
                  : 'Publish on website'}
          </button>
        </div>
      </form>

      <div className="space-y-2 border-t border-black/5 pt-4">
        <h3 className="text-sm font-bold uppercase tracking-wide text-black/40">On the website</h3>
        {(listQuery.data ?? []).map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/8 px-3 py-3">
            <div>
              <div className="font-semibold text-ink">{item.title}</div>
              <div className="text-xs text-black/45">
                Issue {item.issueNumber} · {item.monthLabel}
                {!item.isPublished ? ' · Draft' : ''}
                {item.scheduledPublishAt
                  ? ` · Scheduled ${new Date(item.scheduledPublishAt).toLocaleString()}`
                  : ''}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {!item.isPublished ? (
                <button
                  type="button"
                  className="kop-btn-primary !px-3 !py-1.5 !text-xs"
                  onClick={() => publishDraftMutation.mutate(item.id)}
                >
                  Publish now
                </button>
              ) : (
                <Link
                  to={`/newsletter/${item.slug}`}
                  className="kop-btn-secondary !px-3 !py-1.5 !text-xs"
                  target="_blank"
                >
                  View
                </Link>
              )}
              <button
                type="button"
                className="kop-btn-secondary !border-lfc-red/25 !px-3 !py-1.5 !text-xs !text-lfc-red"
                onClick={() => {
                  void (async () => {
                    const ok = await confirm({
                      title: 'Remove issue',
                      message: `Remove "${item.title}" from the website?`,
                      danger: true,
                      confirmLabel: 'Remove',
                    });
                    if (ok) deleteMutation.mutate(item.id);
                  })();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!listQuery.isLoading && !listQuery.data?.length ? (
          <p className="text-sm text-black/45">No issue published yet.</p>
        ) : null}
      </div>
    </div>
  );
}
