import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../lib/api';
import { useLanguage } from './language-provider';

type ContentBundle = {
  lang: string;
  version: string;
  values: Record<string, string>;
};

const ContentContext = createContext<Record<string, string>>({});

export function ContentProvider({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const query = useQuery({
    queryKey: ['content-bundle', lang],
    queryFn: () => apiRequest<ContentBundle>(`/content/bundle?lang=${lang}`),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const values = useMemo(() => ({ ...(query.data?.values ?? {}) }), [query.data?.values]);

  return <ContentContext.Provider value={values}>{children}</ContentContext.Provider>;
}

export function useContent(key: string, fallback?: string) {
  const map = useContext(ContentContext);
  return map[key] ?? fallback ?? key;
}
