import { useNavigateBack } from '../../lib/navigation-back';

type BackButtonProps = {
  /** Route de secours si l'historique est vide */
  fallbackTo: string;
  label?: string;
  className?: string;
};

export function BackButton({
  fallbackTo,
  label = 'Back',
  className = '',
}: BackButtonProps) {
  const handleBack = useNavigateBack(fallbackTo);

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`back-button ${className}`.trim()}
      aria-label={label}
    >
      <span className="back-button-icon" aria-hidden>
        ←
      </span>
      {label}
    </button>
  );
}
