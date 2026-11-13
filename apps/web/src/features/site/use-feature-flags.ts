import { useQuery } from '@tanstack/react-query';
import { fetchPublicSiteSettings } from '../../lib/site-settings';

export function useFeatureFlags() {
  const query = useQuery({
    queryKey: ['site-settings-public'],
    queryFn: fetchPublicSiteSettings,
    staleTime: 60_000,
  });

  const map = query.data ?? {};

  return {
    isLoading: query.isLoading,
    predictionsEnabled: map['features.predictionsEnabled'] !== 'false',
    pushEnabled: map['features.pushEnabled'] === 'true',
    guestsMax: Math.min(2, Math.max(0, Number(map['features.guestsMax'] ?? '2') || 2)),
  };
}
