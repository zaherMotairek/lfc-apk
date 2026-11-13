import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

type InstallAppBannerProps = {
  variant?: 'banner' | 'compact';
};

export function InstallAppBanner({ variant = 'compact' }: InstallAppBannerProps) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showManualHelp, setShowManualHelp] = useState(false);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsStandalone(isStandaloneMode());
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
      setShowManualHelp(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowManualHelp((value) => !value);
      return;
    }

    setIsInstalling(true);
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } finally {
      setIsInstalling(false);
    }
  };

  const label = isInstalling ? '...' : installPrompt ? 'Install' : 'Download';

  if (variant === 'compact') {
    return (
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-lfc-red shadow-sm transition hover:bg-white/90 disabled:opacity-60"
          aria-label="Download as application"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {label}
        </button>
        {showManualHelp ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-[60] w-64 rounded-2xl border border-black/10 bg-white p-3 text-left text-xs leading-relaxed text-black/70 shadow-xl">
            Open the browser menu and choose{' '}
            <span className="font-semibold text-ink">Add to Home Screen</span> or{' '}
            <span className="font-semibold text-ink">Install App</span>.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="install-banner">
      <div className="install-banner-copy">
        <p className="install-banner-title">Install RedLeb Hub</p>
        <p className="install-banner-text">
          Add it to your home screen for a full-screen mobile experience.
        </p>
        {showManualHelp ? (
          <div className="mt-3 rounded-2xl bg-black/[0.03] p-3 text-xs leading-relaxed text-black/65">
            If the browser does not show the install popup, open the browser menu and choose
            <span className="font-semibold text-ink"> Add to Home Screen</span> or
            <span className="font-semibold text-ink"> Install App</span>.
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
        <button
          type="button"
          onClick={handleInstall}
          disabled={isInstalling}
          className="kop-btn-primary !px-3.5 !py-2 !text-xs"
        >
          {isInstalling ? 'Opening...' : installPrompt ? 'Install App' : 'How to Install'}
        </button>
      </div>
    </div>
  );
}
