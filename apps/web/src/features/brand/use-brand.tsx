import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';

export type BrandConfig = {
  siteName: string;
  shortName: string;
  tagline: string;
  themeColor: string;
  brandRed: string;
  logoUrlLight: string | null;
  logoUrlDark: string | null;
  iconUrl: string | null;
  version: string;
};

const FALLBACK: BrandConfig = {
  siteName: 'RedLeb Hub',
  shortName: 'RedLeb',
  tagline: 'OLSC Lebanon',
  themeColor: '#c8102e',
  brandRed: '#c8102e',
  logoUrlLight: null,
  logoUrlDark: null,
  iconUrl: null,
  version: '1',
};

export function useBrand() {
  const query = useQuery({
    queryKey: ['brand'],
    queryFn: () => apiRequest<BrandConfig>('/brand'),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  return query.data ?? FALLBACK;
}
