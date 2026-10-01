import { MOTION } from '../tokens/tokens';
import { useReducedMotion } from './useReducedMotion';

const FRAMES: Keyframe[] = [
  { transform: 'none' },
  { transform: 'translate(-4px, 2px)' },
  { transform: 'translate(4px, -2px)' },
  { transform: 'translate(-3px, 1px)' },
  { transform: 'translate(2px, 0)' },
  { transform: 'none' },
];

/**
 * A function that shakes an element for 380 ms, as when garbage lands (UI language, "Motion").
 * It does nothing under reduced motion, or where the Web Animations API is missing.
 */
export function useShake(): (el: Element | null) => void {
  const reduced = useReducedMotion();
  return (el) => {
    if (reduced || !el || typeof el.animate !== 'function') return;
    el.animate(FRAMES, { duration: MOTION.shake, easing: 'ease-out' });
  };
}
