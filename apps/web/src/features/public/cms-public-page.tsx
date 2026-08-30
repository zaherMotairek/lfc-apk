import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

type CmsSection = {
  id: string;
  type: string;
  title?: string | null;
  subtitle?: string | null;
  content?: {
    primaryButtonLabel?: string;
    body?: string;
  } | null;
  imageUrl?: string | null;
};

type CmsPage = {
  code: string;
  title: string;
  sections: CmsSection[];
};

export function CmsPublicPage({
  code,
  fallbackTitle,
  fallbackDescription,
}: {
  code: string;
  fallbackTitle: string;
  fallbackDescription: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cms-page', code],
    queryFn: () => apiRequest<CmsPage>(`/cms/pages/${code}`),
  });

  if (isLoading) {
    return (
      <section className="kop-container py-16">
        <div className="kop-card animate-pulse p-10">
          <div className="h-10 w-1/2 rounded bg-black/5" />
          <div className="mt-4 h-5 w-2/3 rounded bg-black/5" />
        </div>
      </section>
    );
  }

  const hero = data?.sections.find((section) => section.type === 'HERO');
  const richText = data?.sections.find((section) => section.type === 'RICH_TEXT');
  const title = hero?.title ?? data?.title ?? fallbackTitle;
  const subtitle = hero?.subtitle ?? fallbackDescription;

  if (error || !data) {
    return (
      <section className="kop-container py-16 md:py-20">
        <p className="kop-badge-red mb-4">{code}</p>
        <h1 className="kop-section-title">{fallbackTitle}</h1>
        <p className="mt-4 max-w-2xl text-lg text-black/60">{fallbackDescription}</p>
      </section>
    );
  }

  const ctaLink = code === 'CONTACT' ? '/contact' : code === 'MEMBERSHIP' ? '/membership' : '/';

  return (
    <section className="kop-container py-16 md:py-20">
      <div className="max-w-3xl">
        <p className="kop-badge-red mb-4">OLSC Lebanon</p>
        <h1 className="kop-section-title">{title}</h1>
        <p className="mt-5 text-lg leading-relaxed text-black/60">{subtitle}</p>

        {richText?.content?.body ? (
          <div className="kop-card mt-10 p-8">
            <div className="whitespace-pre-wrap leading-relaxed text-black/75">
              {richText.content.body}
            </div>
          </div>
        ) : null}

        {hero?.content?.primaryButtonLabel ? (
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to={ctaLink} className="kop-btn-primary">
              {hero.content.primaryButtonLabel}
            </Link>
            <Link to="/" className="kop-btn-secondary">
              Back to home
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
