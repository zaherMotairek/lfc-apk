import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BackButton } from './back-button';
import { isTypingTarget, useNavigateBack } from '../../lib/navigation-back';

type PageBackBarProps = {
  /** Exact path(s) where the back bar should be hidden (section roots). */
  hideOn: string | string[];
  /** Fallback when history cannot go back. */
  fallbackTo: string;
  /** Optional label override. */
  label?: string;
  /** Resolve a smarter fallback from the current path (e.g. match detail → matches list). */
  resolveFallback?: (pathname: string) => string | null;
  className?: string;
};

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function PageBackBar({
  hideOn,
  fallbackTo,
  label = 'Back',
  resolveFallback,
  className = '',
}: PageBackBarProps) {
  const location = useLocation();
  const pathname = normalizePath(location.pathname);
  const roots = (Array.isArray(hideOn) ? hideOn : [hideOn]).map(normalizePath);
  const hidden = roots.includes(pathname);
  const resolved = resolveFallback?.(pathname) ?? fallbackTo;
  const goBack = useNavigateBack(resolved);

  useEffect(() => {
    if (hidden) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Backspace') {
        return;
      }
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      if (event.defaultPrevented) {
        return;
      }
      if (isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      goBack();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goBack, hidden]);

  if (hidden) {
    return null;
  }

  return (
    <div className={className || 'page-back-bar'}>
      <BackButton fallbackTo={resolved} label={label} />
    </div>
  );
}
