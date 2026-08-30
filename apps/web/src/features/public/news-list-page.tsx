import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
};

export function NewsListPage() {
  const location = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-news'],
    queryFn: () => apiRequest<NewsItem[]>('/news'),
  });

  return (
    <section className="kop-container py-12 md:py-16">
      <PageHeader
        eyebrow="News"
        title="Club Announcements"
        description="Official OLSC Lebanon news and community updates."
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="kop-card animate-pulse p-6">
              <div className="h-5 w-2/3 rounded bg-black/5" />
              <div className="mt-3 h-4 w-full rounded bg-black/5" />
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          Unable to load news.
        </div>
      ) : null}

      <div className="space-y-4">
        {(data ?? []).map((item, index) => (
          <Link
            key={item.id}
            to={`/news/${item.slug}`}
            state={{ from: `${location.pathname}${location.search}` }}
            className={`kop-card kop-card-hover block p-6 ${index === 0 ? 'border-lfc-red/20 bg-lfc-red/[0.02]' : ''}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                {index === 0 ? <span className="kop-badge-red mb-3">Latest</span> : null}
                <div className="text-xl font-bold leading-snug">{item.title}</div>
                <p className="mt-2 text-black/55">{item.excerpt ?? 'Read the full article'}</p>
              </div>
              {item.publishedAt ? (
                <time className="shrink-0 text-xs font-medium text-black/40">
                  {new Date(item.publishedAt).toLocaleDateString('en', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </time>
              ) : null}
            </div>
          </Link>
        ))}
        {!isLoading && !data?.length ? (
          <div className="kop-card py-16 text-center text-black/40">No news published yet.</div>
        ) : null}
      </div>
    </section>
  );
}
