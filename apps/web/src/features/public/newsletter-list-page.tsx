import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { PageHeader } from '../../components/ui/page-header';

export type PublicNewsletter = {
  id: string;
  title: string;
  slug: string;
  issueNumber: number;
  monthLabel: string;
  excerpt?: string | null;
  pdfUrl: string;
  publishedAt?: string | null;
};

export function NewsletterListPage() {
  const location = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-newsletters'],
    queryFn: () => apiRequest<PublicNewsletter[]>('/newsletters'),
  });

  return (
    <section className="kop-container py-12 md:py-16">
      <PageHeader
        eyebrow="RedLeb Dispatch"
        title="Newsletter"
        description="Read every OLSC Lebanon issue in your browser. Click an issue to open the PDF."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="kop-card animate-pulse p-6">
              <div className="h-5 w-2/3 rounded bg-black/5" />
              <div className="mt-3 h-4 w-full rounded bg-black/5" />
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-lfc-red/20 bg-lfc-red/5 px-4 py-3 text-lfc-red">
          Unable to load newsletters.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {(data ?? []).map((item, index) => (
          <Link
            key={item.id}
            to={`/newsletter/${item.slug}`}
            state={{ from: `${location.pathname}${location.search}` }}
            className={`kop-card kop-card-hover block p-6 ${index === 0 ? 'border-lfc-red/20 bg-lfc-red/[0.02]' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {index === 0 ? <span className="kop-badge-red mb-3">Latest</span> : null}
                <div className="text-xs font-bold uppercase tracking-widest text-black/40">
                  Issue {item.issueNumber} · {item.monthLabel}
                </div>
                <div className="mt-2 text-xl font-bold leading-snug">{item.title}</div>
                <p className="mt-2 text-sm text-black/55">
                  {item.excerpt || 'Click to open this issue as a PDF.'}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lfc-red/10 text-xl">
                🗞️
              </div>
            </div>
            <div className="mt-4 text-sm font-semibold text-lfc-red">Open PDF →</div>
          </Link>
        ))}
      </div>

      {!isLoading && !data?.length ? (
        <div className="kop-card py-16 text-center text-black/40">No newsletter published yet.</div>
      ) : null}
    </section>
  );
}
