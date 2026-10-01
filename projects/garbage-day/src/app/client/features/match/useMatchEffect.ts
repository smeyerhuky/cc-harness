import { useEffect, useEffectEvent } from 'react';
import type { MatchEffect, Session } from '../../state/MatchSession';

/** Calls `handler` for each effect the session plays (a clear, an attack, a landing…). */
export function useMatchEffect(session: Session, handler: (e: MatchEffect) => void): void {
  const on = useEffectEvent(handler);
  useEffect(() => session.onEffect((e) => on(e)), [session]);
}
