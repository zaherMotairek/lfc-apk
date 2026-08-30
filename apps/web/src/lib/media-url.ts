/** Same-origin path for uploaded files (works with Vite proxy in dev). */
export function resolveMediaUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('/')) return url;

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
  } catch {
    /* keep original url */
  }

  return url;
}
