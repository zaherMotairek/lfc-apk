import { Link } from 'react-router-dom';

type BrandLogoProps = {
  variant?: 'light' | 'dark';
  subtitle?: string;
  to?: string;
};

export function BrandLogo({ variant = 'light', subtitle, to = '/' }: BrandLogoProps) {
  const isLight = variant === 'light';

  return (
    <Link to={to} className="group flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lfc-red text-sm font-black text-white shadow-lg shadow-lfc-red/30 transition group-hover:scale-105">
        OL
      </div>
      <div>
        <div
          className={`text-base font-extrabold leading-tight tracking-tight ${isLight ? 'text-white' : 'text-ink'}`}
        >
          OLSC Lebanon
        </div>
        {subtitle ? (
          <div className={`text-[11px] font-medium ${isLight ? 'text-white/60' : 'text-black/50'}`}>
            {subtitle}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
