import { useEffect, useEffectEvent } from 'react';

/** Calls `onTick` every `ms` milliseconds; `null` pauses it. The callback sees the latest props. */
export function useInterval(onTick: () => void, ms: number | null): void {
  const tick = useEffectEvent(onTick);
  useEffect(() => {
    if (ms === null) return;
    const id = setInterval(() => tick(), ms);
    return () => clearInterval(id);
  }, [ms]);
}
