import { useEffect } from 'react';
import { useBrand } from '../../features/brand/use-brand';
import { resolveMediaUrl } from '../../lib/media-url';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

function manifestUrl(version: string) {
  const base = API_URL.replace(/\/$/, '');
  return `${base}/brand/manifest.webmanifest?v=${encodeURIComponent(version)}`;
}

/** Sync document title, theme-color, apple title, and PWA manifest from site settings. */
export function BrandHead() {
  const brand = useBrand();

  useEffect(() => {
    document.title = brand.siteName;

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', brand.themeColor);

    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitle) appleTitle.setAttribute('content', brand.shortName);

    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.setAttribute('href', manifestUrl(brand.version));

    const icon =
      document.querySelector('link[rel="icon"]') ??
      (() => {
        const link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
        return link;
      })();

    if (brand.iconUrl) {
      icon.setAttribute('href', resolveMediaUrl(brand.iconUrl));
    }

    const appleTouch =
      document.querySelector('link[rel="apple-touch-icon"]') ??
      (() => {
        const link = document.createElement('link');
        link.rel = 'apple-touch-icon';
        document.head.appendChild(link);
        return link;
      })();

    if (brand.iconUrl) {
      appleTouch.setAttribute('href', resolveMediaUrl(brand.iconUrl));
    }
  }, [brand]);

  return null;
}
