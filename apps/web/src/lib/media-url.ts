/** Resolve uploaded media URLs to the API host (required on Render Static Sites). */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';

  let pathname = url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);
      // External hosts (Cloudinary, etc.) — keep as-is
      if (!parsed.pathname.startsWith('/uploads/')) {
        return url;
      }
      pathname = parsed.pathname;
      if (import.meta.env.DEV) {
        return pathname;
      }
    } catch {
      return url;
    }
  }

  if (!pathname.startsWith('/uploads/')) {
    return url;
  }

  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

  try {
    const origin = new URL(apiUrl).origin;
    // Local Vite proxies /uploads → API, so relative path is fine in dev
    if (
      import.meta.env.DEV &&
      (origin.includes('localhost') || origin.includes('127.0.0.1'))
    ) {
      return pathname;
    }
    return `${origin}${pathname}`;
  } catch {
    return pathname;
  }
}
