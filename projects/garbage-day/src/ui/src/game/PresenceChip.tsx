import type { Presence } from '@garbage-day/engine';
import styles from './Hud.module.css';
import overlay from './Overlay.module.css';

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

export type ConnectionState = 'reconnecting' | 'lost';

/**
 * The player's own connection, across the top of the stage (GD-TICKET-013): "Reconnecting" with
 * the presence chip's blinking dot while the socket retries, and "Connection lost" once it gives
 * up. Nothing shows while connected.
 */
export function ConnectionNotice({ state }: { state: ConnectionState }) {
  const dot = state === 'lost' ? 'gone' : 'reconnecting';
  return (
    <div className={`${overlay.banner} ${overlay.notice}`} role="status">
      <span className={`${styles.dot} ${styles[dot]}`} aria-hidden="true" />
      {state === 'lost' ? 'Connection lost' : 'Reconnecting…'}
    </div>
  );
}
