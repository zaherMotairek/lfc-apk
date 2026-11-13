import { useEffect } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/50" aria-label="Close" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-black/60">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="kop-btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? 'kop-btn-primary !bg-lfc-red' : 'kop-btn-primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
