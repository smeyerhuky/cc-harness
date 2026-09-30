import { useEffect, useEffectEvent } from 'react';

/**
 * Calls `onFrame(now)` on every animation frame while `active`. The game draws boards this way,
 * outside React's render cycle; the callback always sees the latest props.
 */
export function useAnimationFrame(onFrame: (now: number) => void, active = true): void {
  const frame = useEffectEvent(onFrame);
  useEffect(() => {
    if (!active) return;
    let id = requestAnimationFrame(function loop(now) {
      frame(now);
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [active]);
}
