import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

type AlbumDetail = {
  id: string;
  title: string;
  description?: string | null;
  assets: Array<{
    id: string;
    type: string;
    url: string;
    title?: string | null;
  }>;
};

export function GalleryAlbumPage() {
  const { id = '' } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-gallery', id],
    queryFn: () => apiRequest<AlbumDetail>(`/gallery/${id}`),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <section className="mx-auto max-w-6xl px-4 py-16">Loading...</section>;
  }

  if (error || !data) {
    return (
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-[#c8102e]">Album not found.</p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-4xl font-bold">{data.title}</h1>
      {data.description ? <p className="mt-2 text-black/60">{data.description}</p> : null}

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {data.assets.map((asset) => (
          <div key={asset.id} className="overflow-hidden rounded-2xl bg-white shadow">
            {asset.type === 'VIDEO' ? (
              <video src={asset.url} controls className="h-48 w-full object-cover" />
            ) : (
              <img src={asset.url} alt={asset.title ?? data.title} className="h-48 w-full object-cover" />
            )}
            {asset.title ? <div className="p-3 text-sm">{asset.title}</div> : null}
          </div>
        ))}
      </div>

      {!data.assets.length ? <p className="mt-6 text-black/50">No media in this album yet.</p> : null}
    </section>
  );
}
