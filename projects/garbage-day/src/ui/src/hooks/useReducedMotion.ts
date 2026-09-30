import { useSyncExternalStore } from 'react';
import { useMediaQuery } from './useMediaQuery';

/** The player's motion setting: follow the system, or force motion off (or on, by code only). */
export type MotionPreference = 'system' | 'reduce' | 'full';

let current: MotionPreference = 'system';
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Sets the player's motion setting for every widget; the app calls it from its preferences. */
export function setMotionPreference(preference: MotionPreference): void {
  if (preference === current) return;
  current = preference;
  listeners.forEach((l) => l());
}

/**
 * Whether to reduce motion (US-20): the system's `prefers-reduced-motion`, unless the player's
 * setting (`setMotionPreference`, or a `preference` passed here) overrides it. Every animation in
 * the game checks this.
 */
export function useReducedMotion(preference?: MotionPreference): boolean {
  const system = useMediaQuery('(prefers-reduced-motion: reduce)');
  const global = useSyncExternalStore(
    subscribe,
    () => current,
    () => 'system' as const,
  );
  const p = preference ?? global;
  return p === 'system' ? system : p === 'reduce';
}
