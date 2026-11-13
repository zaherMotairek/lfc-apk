import { useLanguage, type AppLanguage } from '../../features/content/language-provider';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <label className={`inline-flex items-center gap-1 text-xs ${className}`}>
      <span className="sr-only">Language</span>
      <select
        className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white"
        value={lang}
        onChange={(e) => setLang(e.target.value as AppLanguage)}
        aria-label="Site language"
      >
        <option value="en">EN</option>
        <option value="ar">عربي</option>
      </select>
    </label>
  );
}
