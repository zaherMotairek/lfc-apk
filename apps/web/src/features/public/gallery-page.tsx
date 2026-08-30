import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

type Album = {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  _count: { assets: number };
};

export function GalleryPage() {
  const location = useLocation();
  const { data, isLoading, error } = useQuery({
    queryKey: ['public-gallery'],
    queryFn: () => apiRequest<Album[]>('/gallery'),
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="mb-2 text-4xl font-bold">Gallery</h1>
      <p className="mb-8 text-black/60">
        Community memories from OLSC Lebanon events and watch parties.
      </p>

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
