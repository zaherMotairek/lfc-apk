import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../lib/api';

type Album = {
  id: string;
  title: string;
  coverImageUrl?: string | null;
};

export function HomeHighlightPanel() {
  const albumsQuery = useQuery({
    queryKey: ['public-gallery-home'],
    queryFn: () => apiRequest<Album[]>('/gallery'),
  });

  const slides = (albumsQuery.data ?? []).slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="kop-card overflow-hidden p-0">
        <div className="border-b border-black/5 bg-white/80 px-5 py-3 text-xs font-bold uppercase tracking-wide text-black/45">
          Community highlights
        </div>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto p-4">
          {slides.length ? (
            slides.map((album) => (
              <Link
                key={album.id}
                to={`/gallery/${album.id}`}
                className="min-w-[72%] shrink-0 snap-center overflow-hidden rounded-2xl border border-black/5 bg-black/[0.02] sm:min-w-[45%]"
              >
                {album.coverImageUrl ? (
                  <img
                    src={album.coverImageUrl}
                    alt=""
                    className="aspect-[16/10] w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex aspect-[16/10] items-center justify-center bg-lfc-red/10 text-sm font-semibold text-lfc-red">
                    {album.title}
                  </div>
                )}
                <p className="px-3 py-2 text-sm font-semibold text-ink">{album.title}</p>
              </Link>
            ))
          ) : (
            <p className="px-2 py-6 text-sm text-black/45">
              Watch parties, meetups, and gallery moments — managed by the committee.
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/events" className="kop-card kop-card-hover p-4 text-sm font-semibold text-ink">
          Upcoming gatherings →
        </Link>
        <Link to="/membership/apply" className="kop-card kop-card-hover border-lfc-red/20 bg-lfc-red/5 p-4 text-sm font-semibold text-lfc-red">
          Apply for membership →
        </Link>
      </div>
    </div>
  );
}
