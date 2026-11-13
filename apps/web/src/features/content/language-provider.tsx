import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type AppLanguage = 'en' | 'ar';

const STORAGE_KEY = 'redleb.lang';

type LanguageContextValue = {
  lang: AppLanguage;
  setLang: (lang: AppLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => undefined,
});

function detectDefaultLang(): AppLanguage {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'ar' || stored === 'en') return stored;
  const nav = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : 'en';
  return nav.startsWith('ar') ? 'ar' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>(() => detectDefaultLang());

  const setLang = (next: AppLanguage) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
