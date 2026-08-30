type EmptyStateProps = {
  icon: string;
  title: string;
  description?: string;
};

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {description ? <p className="empty-state-desc">{description}</p> : null}
    </div>
  );
}

type ToggleChipProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function ToggleChip({ label, checked, onChange }: ToggleChipProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`toggle-chip ${checked ? 'toggle-chip-active' : ''}`}
    >
      <span className={`toggle-chip-dot ${checked ? 'toggle-chip-dot-active' : ''}`} />
      {label}
    </button>
  );
}
