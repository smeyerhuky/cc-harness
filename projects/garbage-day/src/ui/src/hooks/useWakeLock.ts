import { useEffect } from 'react';

/**
 * Keeps the screen awake while `active` (US-19: the screen stays awake during a match). The
 * browser drops the lock when the page is hidden, so it is taken again when the page returns.
 * Does nothing where the Screen Wake Lock API is missing or refuses.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (cancelled) void l.release();
          else lock = l;
        })
        .catch(() => {
          // Refused (battery saver, no user gesture yet): the game works without it.
        });
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', acquire);
      void lock?.release();
    };
  }, [active]);
}
