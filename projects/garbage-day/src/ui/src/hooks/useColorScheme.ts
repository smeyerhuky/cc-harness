import { useSyncExternalStore } from 'react';
import type { Theme } from '../tokens/tokens';

const DARK = '(prefers-color-scheme: dark)';

function current(): Theme {
  const forced = document.documentElement.dataset.theme;
  if (forced === 'light' || forced === 'dark') return forced;
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK).matches
    ? 'dark'
    : 'light';
}

/**
 * The theme in force: the root's `data-theme` if set, otherwise the system's colour scheme. For
 * code that draws outside CSS (the board canvas) and must follow the same tokens.
 */
export function useColorScheme(): Theme {
  return useSyncExternalStore(
    (onChange) => {
      const observer = new MutationObserver(onChange);
      observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
      const mql = typeof window.matchMedia === 'function' ? window.matchMedia(DARK) : null;
      mql?.addEventListener('change', onChange);
      return () => {
        observer.disconnect();
        mql?.removeEventListener('change', onChange);
      };
    },
    current,
    () => 'light',
  );
}
