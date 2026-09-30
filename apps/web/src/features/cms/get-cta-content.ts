import type { CmsSection } from './cms-types';

export function getCtaContent<T extends Record<string, unknown>>(
  getSection: (type: string, block?: string) => CmsSection | undefined,
  block: string,
  fallback: T,
): T {
  const section = getSection('CTA', block);
  return { ...fallback, ...((section?.content as T | undefined) ?? {}) };
}
