import type { Presence } from '@garbage-day/engine';
import styles from './Hud.module.css';

export type PresenceState = 'online' | 'away' | 'reconnecting' | 'gone';

/**
 * What the chip shows for the referee's presence. "Reconnecting" is the connection's state, not
 * the referee's, so the caller says when the socket is retrying.
 */
export function presenceState(p: Presence, reconnecting = false): PresenceState {
  if (p === 'gone' || p === 'forfeit') return 'gone';
  if (reconnecting) return 'reconnecting';
  return p === 'present' ? 'online' : 'away';
}

/** A dot and a word: online, away, reconnecting (blinking) or gone. The word carries the meaning. */
export function PresenceChip({ state }: { state: PresenceState }) {
  return (
    <span className={styles.presence}>
      <span className={`${styles.dot} ${styles[state]}`} aria-hidden="true" />
      {state}
    </span>
  );
}
