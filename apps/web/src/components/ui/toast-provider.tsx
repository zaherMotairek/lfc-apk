import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

type ToastMessage = {
  id: number;
  text: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (text: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((text: string, tone: ToastTone = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[90] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast} onDismiss={() => setToasts((p) => p.filter((t) => t.id !== toast.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(timer);
  }, [onDismiss]);

  const toneClass =
    message.tone === 'error'
      ? 'border-lfc-red/30 bg-lfc-red/10 text-lfc-red'
      : message.tone === 'success'
        ? 'border-pitch/30 bg-pitch/10 text-pitch'
        : 'border-black/10 bg-white text-ink';

  return (
    <div
      className={`pointer-events-auto max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${toneClass}`}
      role="status"
    >
      {message.text}
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requires ToastProvider');
  return ctx.showToast;
}
