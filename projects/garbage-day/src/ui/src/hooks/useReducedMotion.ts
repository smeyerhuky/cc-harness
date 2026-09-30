import { useMediaQuery } from './useMediaQuery';

/** The player's motion setting: follow the system, or force motion on or off. */
export type MotionPreference = 'system' | 'reduce' | 'full';

/**
 * Whether to reduce motion: the system's `prefers-reduced-motion`, unless the player's own
 * setting overrides it (US-20). Every animation in the game checks this.
 */
export function useReducedMotion(preference: MotionPreference = 'system'): boolean {
  const system = useMediaQuery('(prefers-reduced-motion: reduce)');
  return preference === 'system' ? system : preference === 'reduce';
}
