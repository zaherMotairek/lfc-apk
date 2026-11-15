import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/ui/page-header';

const SWATCHES = [
  { name: 'LFC Red', className: 'bg-lfc-red' },
  { name: 'Ink', className: 'bg-ink' },
  { name: 'Pitch', className: 'bg-pitch' },
  { name: 'Paper', className: 'bg-paper border border-black/10' },
  { name: 'Gold', className: 'bg-gold' },
];

export function AdminDesignPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Phase 2"
        title="Design system"
        description="Visual reference only — committee edits live brand and colours in Site settings; copy in Texts & Labels."
      />

      <div className="kop-card flex flex-wrap gap-2 p-4 text-sm">
        <span className="text-black/55">To change the live site:</span>
        <Link to="/admin/settings" className="font-semibold text-lfc-red underline-offset-2 hover:underline">
          Site settings → Branding
        </Link>
        <span className="text-black/40">·</span>
        <Link to="/admin/texts" className="font-semibold text-lfc-red underline-offset-2 hover:underline">
          Texts & Labels
        </Link>
      </div>

      <div className="kop-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Colours</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SWATCHES.map((swatch) => (
            <div key={swatch.name} className="text-center text-xs">
              <div className={`mx-auto h-16 w-full rounded-xl ${swatch.className}`} />
              <div className="mt-2 font-semibold text-ink">{swatch.name}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="kop-card space-y-4 p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-black/40">Buttons</h2>
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
