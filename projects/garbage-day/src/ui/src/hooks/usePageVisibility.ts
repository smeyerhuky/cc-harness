import { useSyncExternalStore } from 'react';

/** Whether the page is visible (not a hidden tab or a backgrounded app). */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      document.addEventListener('visibilitychange', onChange);
      return () => document.removeEventListener('visibilitychange', onChange);
    },
    () => document.visibilityState !== 'hidden',
    () => true,
  );
}
