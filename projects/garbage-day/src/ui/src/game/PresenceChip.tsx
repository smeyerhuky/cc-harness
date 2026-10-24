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

export type ConnectionQuality = 'good' | 'fair' | 'poor';

const BARS: Record<ConnectionQuality, number> = { good: 3, fair: 2, poor: 1 };

/**
 * How good the player's own connection is, beside the match clock (GD-TICKET-017): three bars,
 * as many lit as it is good, green, yellow or red. The count, not the colour, carries the
 * meaning, and its label says it in words.
 */
export function QualityChip({ quality }: { quality: ConnectionQuality }) {
  const lit = BARS[quality];
  return (
    <span
      className={`${styles.quality} ${styles[quality]}`}
      role="img"
      aria-label={`Connection ${quality}`}
      title={`Connection ${quality}`}
    >
      {[1, 2, 3].map((n) => (
        <i key={n} className={n <= lit ? styles.lit : undefined} />
      ))}
    </span>
  );
}
