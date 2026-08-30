import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media-url';
import { PdfViewer } from '../../components/pdf-viewer';
import { PageHeader } from '../../components/ui/page-header';
import type { PublicNewsletter } from './newsletter-list-page';

export function NewsletterDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-newsletter', slug],
    queryFn: () => apiRequest<PublicNewsletter>(`/newsletters/${slug}`),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <section className="kop-container py-12">
        <div className="kop-card animate-pulse p-8">
          <div className="h-8 w-1/2 rounded bg-black/5" />
          <div className="mt-6 h-[70vh] rounded bg-black/5" />
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="kop-container py-12">
        <PageHeader title="Newsletter" description="This issue is not available." backTo="/newsletter" />
        <Link to="/newsletter" className="kop-btn-secondary">
          Back to issues
        </Link>
      </section>
    );
  }

  const pdfSrc = resolveMediaUrl(data.pdfUrl);

  return (
    <section className="kop-container py-12 md:py-16">
      <PageHeader
        eyebrow={`Issue ${data.issueNumber}`}
        title={data.title}
        description={data.excerpt || data.monthLabel}
        backTo="/newsletter"
        action={
          <div className="flex flex-wrap gap-2">
            <a href={pdfSrc} target="_blank" rel="noreferrer" className="kop-btn-primary">
              Open PDF
            </a>
            <a href={pdfSrc} download className="kop-btn-secondary">
              Download
            </a>
          </div>
        }
      />

      <div className="kop-card overflow-hidden">
        <PdfViewer url={pdfSrc} />
      </div>
    </section>
  );
}
