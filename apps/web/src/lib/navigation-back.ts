import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

type LocationState = {
  from?: string;
};

/** True when Backspace should edit text, not navigate. */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  const el = target as HTMLElement;
  const tag = el.tagName;

  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }

  if (el.isContentEditable) {
    return true;
  }

  return Boolean(
    el.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'),
  );
}

export function useNavigateBack(fallbackTo: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const historyIdx = (window.history.state as { idx?: number } | null)?.idx;
    const canGoBack =
      typeof historyIdx === 'number' ? historyIdx > 0 : location.key !== 'default';

    if (canGoBack) {
      navigate(-1);
      return;
    }

    const from = (location.state as LocationState | null)?.from;
    if (from) {
      navigate(from);
      return;
    }

    navigate(fallbackTo);
  }, [fallbackTo, location.key, location.state, navigate]);
}
