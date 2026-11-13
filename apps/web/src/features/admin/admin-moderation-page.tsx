import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/auth-context';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';
import { useConfirm } from '../../components/ui/confirm-provider';
import { useToast } from '../../components/ui/toast-provider';

type CommentRow = {
  id: string;
  content: string;
  isHidden: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string };
  newsArticle: { title: string; slug: string } | null;
};

export function AdminModerationPage() {
  const { accessToken } = useAuth();
  const confirm = useConfirm();
  const showToast = useToast();
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => apiRequest<CommentRow[]>('/admin/comments/recent?limit=100', { token: accessToken }),
    enabled: Boolean(accessToken),
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/admin/comments/${id}/hide`, {
        method: 'POST',
        token: accessToken,
      }),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ message: string }>(`/admin/comments/${id}`, {
        method: 'DELETE',
        token: accessToken,
      }),
    onSuccess: (res) => {
      showToast(res.message, 'success');
      void queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
    },
  });

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Comment moderation"
        description="Hide or remove comments on club news. Actions are audit-logged."
      />

      {commentsQuery.isLoading ? <p className="text-black/50">Loading…</p> : null}

      <div className="space-y-3">
        {(commentsQuery.data ?? []).map((row) => (
          <article key={row.id} className="kop-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="text-xs text-black/45">
                  {row.newsArticle?.title ?? 'News'} ·{' '}
                  {new Date(row.createdAt).toLocaleString()}
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {row.user.firstName} {row.user.lastName}
                </div>
                <p className="mt-2 text-sm text-black/70">{row.content}</p>
                {row.isHidden ? (
                  <span className="kop-badge-red mt-2 inline-block !text-[10px]">Hidden</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {!row.isHidden ? (
                  <button
                    type="button"
                    className="kop-btn-secondary !text-xs"
                    onClick={() => hideMutation.mutate(row.id)}
                  >
                    Hide
                  </button>
                ) : null}
                <button
                  type="button"
                  className="kop-btn-ghost !text-xs text-lfc-red"
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Delete comment?',
                      message: 'This cannot be undone.',
                      confirmLabel: 'Delete',
                      danger: true,
                    });
                    if (ok) deleteMutation.mutate(row.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
