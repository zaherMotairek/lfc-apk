import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';

type Album = {
  id: string;
  title: string;
  coverImageUrl?: string | null;
};

const SLIDE_MS = 5000;

export function HomeHighlightPanel() {
  const albumsQuery = useQuery({
    queryKey: ['public-gallery-home'],
    queryFn: () => apiRequest<Album[]>('/gallery'),
  });

  const slides = (albumsQuery.data ?? []).slice(0, 5);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_MS);

    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  return (
    <div className="space-y-4">
      <div className="kop-card overflow-hidden p-0">
        <div className="border-b border-black/5 bg-white/80 px-5 py-3 text-xs font-bold uppercase tracking-wide text-black/45">
          Community highlights
        </div>
        {slides.length ? (
          <div
            className="relative p-4"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-black/5 bg-black/[0.02]">
              {slides.map((album, i) => (
                <Link
                  key={album.id}
                  to={`/gallery/${album.id}`}
                  className={`absolute inset-0 flex flex-col transition-opacity duration-700 ease-in-out ${
                    i === index ? 'z-10 opacity-100' : 'pointer-events-none z-0 opacity-0'
                  }`}
                  aria-hidden={i !== index}
                  tabIndex={i === index ? 0 : -1}
                >
                  {album.coverImageUrl ? (
                    <img
                      src={album.coverImageUrl}
                      alt=""
                      className="h-full w-full flex-1 object-cover"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  ) : (
                    <div className="flex flex-1 items-center justify-center bg-lfc-red/10 text-sm font-semibold text-lfc-red">
                      {album.title}
                    </div>
                  )}
                  <p className="shrink-0 bg-white/95 px-3 py-2 text-sm font-semibold text-ink backdrop-blur-sm">
                    {album.title}
                  </p>
                </Link>
              ))}
            </div>
            {slides.length > 1 ? (
              <div className="mt-3 flex justify-center gap-1.5" role="tablist" aria-label="Highlight slides">
                {slides.map((album, i) => (
                  <button
                    key={album.id}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    aria-label={`Show ${album.title}`}
                    className={`h-2 rounded-full transition-all ${
                      i === index ? 'w-6 bg-lfc-red' : 'w-2 bg-black/20 hover:bg-black/35'
                    }`}
                    onClick={() => setIndex(i)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="px-6 py-8 text-sm text-black/45">
            Watch parties, meetups, and gallery moments — managed by the committee.
          </p>
        )}
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