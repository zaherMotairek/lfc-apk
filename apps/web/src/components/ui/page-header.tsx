import { BackButton } from './back-button';

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** When set, shows a Back button above the title. */
  backTo?: string;
  backLabel?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  backTo,
  backLabel = 'Previous page',
}: PageHeaderProps) {
  return (
    <div className="mb-8">
      {backTo ? (
        <div className="mb-4">
          <BackButton fallbackTo={backTo} label={backLabel} />
        </div>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow ? <p className="kop-badge-red mb-3">{eyebrow}</p> : null}
          <h1 className="kop-section-title">{title}</h1>
          {description ? <p className="mt-3 max-w-2xl text-base text-black/60">{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
