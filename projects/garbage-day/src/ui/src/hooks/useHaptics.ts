/**
 * A vibrate function for touch feedback (UI language: 10 ms on lock, 20 ms on hard drop, 30 ms
 * when garbage lands). A no-op when disabled or where the Vibration API is missing.
 */
export function useHaptics(enabled: boolean): (ms: number) => void {
  return (ms: number) => {
    if (enabled && typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  };
}
