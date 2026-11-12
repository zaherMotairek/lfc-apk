import { useContent } from './content-provider';

export function T({ k, fallback }: { k: string; fallback?: string }) {
  return useContent(k, fallback);
}
