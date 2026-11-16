/** On/off switch for site settings stored as "true" / "false" strings. */
export function SettingToggle({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
      <span className="max-w-[min(100%,28rem)] text-sm font-medium text-ink">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${on ? 'bg-lfc-red' : 'bg-black/20'}`}
        onClick={() => onChange(!on)}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${on ? 'left-7' : 'left-1'}`}
        />
      </button>
    </div>
  );
}