import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { CmsEditablePageHeader } from '../cms/cms-editable-page-header';
import { InlineEditToolbar } from '../cms/inline-edit-toolbar';
import { CmsInlineEditProvider, useCmsInlineEdit } from '../cms/use-cms-inline-edit';

type Album = {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  _count: { assets: number };
};

function GalleryPageContent() {
  const location = useLocation();
  const { isLoading: cmsLoading } = useCmsInlineEdit();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-gallery'],
    queryFn: () => apiRequest<Album[]>('/gallery'),
  });

  if (cmsLoading) {
    return <div className="kop-container py-20 text-center text-black/50">Loading…</div>;
  }

  return (
    <section className="kop-container py-12 md:py-16">
      <InlineEditToolbar />
      <CmsEditablePageHeader
        fallbackTitle="Gallery"
        fallbackDescription="Community memories from OLSC Lebanon events and watch parties."
      />

      {isLoading ? <p>Loading...</p> : null}
      {error ? <p className="text-[#c8102e]">Unable to load gallery.</p> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {(data ?? []).map((album) => (
          <Link
            key={album.id}
            to={`/gallery/${album.id}`}
            state={{ from: `${location.pathname}${location.search}` }}
            className="overflow-hidden rounded-2xl bg-white shadow"
          >
            <div className="flex h-40 items-center justify-center bg-[linear-gradient(145deg,#c8102e,#101418)] text-white">
              {album.coverImageUrl ? (
                <img src={album.coverImageUrl} alt={album.title} className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center font-semibold">{album.title}</span>
              )}
            </div>
            <div className="p-4">
              <div className="font-semibold">{album.title}</div>
              <p className="mt-1 text-sm text-black/60">
                {album.description ?? `${album._count.assets} media items`}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && !data?.length ? (
        <p className="text-black/50">No albums yet. Committee can add them from Admin.</p>
      ) : null}
    </section>
  );
}

export function GalleryPage() {
  return (
    <CmsInlineEditProvider pageCode="GALLERY">
      <GalleryPageContent />
    </CmsInlineEditProvider>
  );
}
