import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../auth/auth-context';
import { ReactionBar } from '../../components/ui/reaction-bar';
import { CommentThread } from '../../components/ui/comment-thread';

type NewsArticle = {
  id: string;
  title: string;
  content: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  author?: { firstName: string; lastName: string } | null;
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
};

type ReactionItem = { reactionType: string; count: number };

export function NewsDetailPage() {
  const { slug = '' } = useParams();
  const location = useLocation();
  const { accessToken, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-news', slug],
    queryFn: () => apiRequest<NewsArticle>(`/news/${slug}`),
    enabled: Boolean(slug),
  });

  const commentsQuery = useQuery({
    queryKey: ['news-comments', data?.id],
    queryFn: () => apiRequest<CommentItem[]>(`/news/${data?.id}/comments`, { token: accessToken }),
    enabled: Boolean(data?.id && accessToken),
  });

  const reactionsQuery = useQuery({
    queryKey: ['news-reactions', data?.id],
    queryFn: () => apiRequest<ReactionItem[]>(`/news/${data?.id}/reactions`, { token: accessToken }),
    enabled: Boolean(data?.id && accessToken),
  });

  const reactionCounts = Object.fromEntries(
    (reactionsQuery.data ?? []).map((item) => [item.reactionType, item.count]),
  );

  const addCommentMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ message: string }>(`/news/${data?.id}/comments`, {
        method: 'POST',
        token: accessToken,
        body: { content: comment },
      }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['news-comments', data?.id] });
    },
  });

  const reactMutation = useMutation({
    mutationFn: (reactionType: string) =>
      apiRequest<{ message: string }>(`/news/${data?.id}/reactions`, {
        method: 'POST',
        token: accessToken,
        body: { reactionType },
      }),
    onSuccess: (_result, reactionType) => {
      setActiveReaction((prev) => (prev === reactionType ? null : reactionType));
      queryClient.invalidateQueries({ queryKey: ['news-reactions', data?.id] });
    },
  });

  if (isLoading) {
    return (
      <section className="kop-container py-12">
        <div className="kop-card animate-pulse p-8">
          <div className="h-8 w-2/3 rounded bg-black/5" />
          <div className="mt-4 h-4 w-1/3 rounded bg-black/5" />
          <div className="mt-8 space-y-3">
            <div className="h-4 w-full rounded bg-black/5" />
            <div className="h-4 w-full rounded bg-black/5" />
            <div className="h-4 w-3/4 rounded bg-black/5" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="kop-container py-12">
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          Article not found.
        </div>
      </section>
    );
  }

  return (
    <article className="kop-container py-10 md:py-14">
      <header className="max-w-3xl">
        <p className="kop-badge-red mb-4">OLSC News</p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink md:text-5xl">
          {data.title}
        </h1>
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-black/50">
          <span className="font-medium text-black/70">
            {data.author ? `${data.author.firstName} ${data.author.lastName}` : 'OLSC Lebanon'}
          </span>
          {data.publishedAt ? (
            <>
              <span>·</span>
              <time>{new Date(data.publishedAt).toLocaleDateString('en', { dateStyle: 'long' })}</time>
            </>
          ) : null}
        </p>
      </header>

      <div className="prose prose-lg mt-10 max-w-3xl whitespace-pre-wrap text-lg leading-relaxed text-black/75">
        {data.content}
      </div>

      {/* Community section */}
      <section className="mt-12 max-w-3xl">
        {isAuthenticated ? (
          <div className="kop-card overflow-hidden">
            <div className="border-b border-black/5 bg-gradient-to-r from-lfc-red/[0.04] to-pitch/[0.04] px-6 py-4">
              <h2 className="font-bold text-ink">Supporter reactions</h2>
              <p className="text-sm text-black/50">Show your Kop spirit on this article</p>
            </div>

            <div className="space-y-8 p-6">
              <ReactionBar
                counts={reactionCounts}
                activeReaction={activeReaction}
                onReact={(type) => reactMutation.mutate(type)}
                isPending={reactMutation.isPending}
              />

              <div className="kop-divider" />

              <div>
                <h3 className="mb-4 font-bold text-ink">
                  Comments
                  {commentsQuery.data?.length ? (
                    <span className="ml-2 text-sm font-normal text-black/40">
                      ({commentsQuery.data.length})
                    </span>
                  ) : null}
                </h3>
                <CommentThread
                  comments={commentsQuery.data ?? []}
                  isLoading={commentsQuery.isLoading}
                  value={comment}
                  onChange={setComment}
                  onSubmit={() => addCommentMutation.mutate()}
                  isSubmitting={addCommentMutation.isPending}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="kop-card p-8 text-center">
            <div className="text-3xl">🔐</div>
            <h2 className="mt-3 font-bold">Join the conversation</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-black/55">
              Log in as an OLSC member to react and comment on club news.
            </p>
            <Link
              to="/login"
              state={{ from: { pathname: location.pathname, search: location.search } }}
              className="kop-btn-primary mt-6 inline-flex"
            >
              Member Login
            </Link>
          </div>
        )}
      </section>
    </article>
  );
}
