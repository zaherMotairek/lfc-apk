import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';
import { useBrand } from '../brand/use-brand';
import { BrandLogo } from '../../components/ui/brand-logo';
import { resolveMediaUrl } from '../../lib/media-url';

const STATIC_SWATCHES = [
  { name: 'Pitch', className: 'bg-pitch' },
  { name: 'Ink', className: 'bg-ink' },
  { name: 'Paper', className: 'bg-paper border border-black/10' },
  { name: 'Gold', className: 'bg-gold' },
];

export function AdminDesignPage() {
  const brand = useBrand();

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Preview"
        title="Design"
        description="Live look of your brand on RedLeb Hub. Change colours and logos in Site settings — this page updates automatically after you save."
      />

      <div className="kop-card border-lfc-red/15 bg-lfc-red/[0.04] p-4 text-sm">
        <p className="font-semibold text-ink">This is not broken — it is a preview, not an editor.</p>
        <p className="mt-2 text-black/60">
          To change what visitors see, open{' '}
          <Link to="/admin/settings" className="font-semibold text-lfc-red hover:underline">
            Site settings → Branding
          </Link>{' '}
          (colours, logos, site name) or{' '}
          <Link to="/admin/texts" className="font-semibold text-lfc-red hover:underline">
            Texts &amp; Labels
          </Link>{' '}
          (wording). There is no drag-and-drop page builder here.
        </p>
      </div>

      <div className="kop-card space-y-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Your brand (from settings)</h2>
        <div className="flex flex-wrap items-center gap-6">
          <BrandLogo />
          <div>
            <h3 className="text-lg font-bold text-ink">{brand.siteName}</h3>
            <p className="text-sm text-black/55">{brand.tagline}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Primary red (brand.red)', value: brand.brandRed },
            { label: 'Theme colour (browser bar)', value: brand.themeColor },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 rounded-xl border border-black/5 p-3">
              <span
                className="h-14 w-14 shrink-0 rounded-xl border border-black/10 shadow-inner"
                style={{ backgroundColor: item.value }}
                aria-hidden
              />
              <div>
                <div className="text-xs font-semibold text-black/45">{item.label}</div>
                <div className="font-mono text-sm">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
        {(brand.logoUrlLight || brand.iconUrl) && (
          <div className="flex flex-wrap gap-4 pt-2">
            {brand.logoUrlLight ? (
              <img src={resolveMediaUrl(brand.logoUrlLight)} alt="" className="h-12 object-contain" />
            ) : null}
            {brand.iconUrl ? (
              <img src={resolveMediaUrl(brand.iconUrl)} alt="" className="h-12 w-12 object-contain" />
            ) : null}
          </div>
        )}
      </div>

      <div className="kop-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Fixed palette</h2>
        <p className="mt-1 text-xs text-black/50">Pitch, ink, paper and gold stay in the design system for now.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATIC_SWATCHES.map((swatch) => (
            <div key={swatch.name} className="text-center text-xs">
              <div className={`mx-auto h-16 w-full rounded-xl ${swatch.className}`} />
              <div className="mt-2 font-semibold text-ink">{swatch.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="kop-card space-y-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Buttons (live red)</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="kop-btn-primary">
            Primary
          </button>
          <button type="button" className="kop-btn-secondary">
            Secondary
          </button>
          <button type="button" className="kop-btn-ghost">
            Ghost
          </button>
        </div>
      </div>

      <div className="kop-card space-y-3 p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <span className="kop-badge-red">Red</span>
          <span className="kop-badge-green">Green</span>
          <span className="kop-badge-gold">Gold</span>
        </div>
      </div>
    </section>
  );
}