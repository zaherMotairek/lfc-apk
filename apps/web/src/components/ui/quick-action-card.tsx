import { Link } from 'react-router-dom';

type QuickActionProps = {
  to: string;
  title: string;
  description: string;
  accent?: 'red' | 'white' | 'dark';
  icon?: string;
};

const accentClasses = {
  red: 'kop-gradient-hero text-white shadow-lg shadow-lfc-red/20 kop-card-hover',
  white: 'kop-card kop-card-hover bg-surface',
  dark: 'bg-ink text-white shadow-lg kop-card-hover',
};

export function QuickActionCard({
  to,
  title,
  description,
  accent = 'white',
  icon,
}: QuickActionProps) {
  const isWhite = accent === 'white';

  return (
    <Link to={to} className={`block rounded-2xl p-5 ${accentClasses[accent]}`}>
      {icon ? (
        <div
          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl text-lg ${isWhite ? 'bg-lfc-red/10' : 'bg-white/15'}`}
        >
          {icon}
        </div>
      ) : null}
      <div className="font-bold">{title}</div>
      <p className={`mt-2 text-sm ${isWhite ? 'text-black/55' : 'text-white/75'}`}>{description}</p>
    </Link>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <div className="kop-card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-black/45">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-ink">{value}</div>
      {hint ? <div className="mt-1 text-xs text-black/45">{hint}</div> : null}
    </div>
  );
}
