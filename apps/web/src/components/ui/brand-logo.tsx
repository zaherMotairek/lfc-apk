import { Link } from 'react-router-dom';
import { useBrand } from '../../features/brand/use-brand';

type BrandLogoProps = {
  variant?: 'light' | 'dark';
  subtitle?: string;
  to?: string;
};

export function BrandLogo({ variant = 'light', subtitle, to = '/' }: BrandLogoProps) {
  const brand = useBrand();
  const isLight = variant === 'light';
  const logoUrl = isLight ? brand.logoUrlLight : brand.logoUrlDark ?? brand.logoUrlLight;
  const displaySubtitle = subtitle ?? brand.tagline;

  return (
    <Link to={to} className="group flex items-center gap-3">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={brand.siteName}
          className="h-10 w-10 rounded-xl object-contain"
        />
      ) : (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-lfc-red px-1 text-center text-[9px] font-black leading-tight text-white shadow-lg shadow-lfc-red/30 transition group-hover:scale-105"
          aria-hidden
        >
          RedLeb
        </div>
      )}
      <div>
        <div
          className={`text-base font-extrabold leading-tight tracking-tight ${isLight ? 'text-white' : 'text-ink'}`}
        >
          {brand.siteName}
        </div>
        {displaySubtitle ? (
          <div className={`text-[11px] font-medium ${isLight ? 'text-white/60' : 'text-black/50'}`}>
            {displaySubtitle}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
