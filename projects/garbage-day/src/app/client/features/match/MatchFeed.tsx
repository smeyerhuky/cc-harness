import { POWER_NAME } from '@garbage-day/ui';
import { useRef, useState } from 'react';
import type { MatchEffect, Session } from '../../state/MatchSession';
import { mmss } from './format';
import { useMatchEffect } from './useMatchEffect';
import styles from './Match.module.css';

interface Entry {
  readonly id: number;
  readonly at: string;
  readonly text: string;
}

/** Entries kept; the oldest go first. */
const MAX_ENTRIES = 60;

/** A feed line for an effect, from the player's side, or null for what the feed leaves out. */
export function feedLine(e: MatchEffect, opponent: string): string | null {
  const who = (p: 0 | 1) => (p === 0 ? 'You' : opponent);
  switch (e.kind) {
    case 'attack':
      return `${who(e.from)} sent ${e.rows}${e.doubled ? ', doubled' : ''}`;
    case 'cancel':
      return `${who(e.p)} cancelled ${e.rows}`;
    case 'blocked':
      return `${e.p === 0 ? 'Your' : `${opponent}'s`} shield blocked ${e.rows}`;
    case 'powerUse':
      return `${who(e.p)} fired ${POWER_NAME[e.power]}`;
    case 'showdown':
      if (e.phase === 'end') return 'Double garbage is over';
      return `${e.showdown === 'double' ? 'Double garbage' : 'Sudden death'}${
        e.phase === 'soon' ? ' in 5 s' : ''
      }`;
    case 'topout':
      return `${who(e.p)} topped out`;
    default:
      return null;
  }
}

/**
 * The match feed beside the stage on wide screens (US-18): attacks, cancels, power-ups and
 * showdowns as they happen, newest first, with the match clock. It is not announced to screen
 * readers, which already hear the player's own labels; it is there to read back.
 */
export function MatchFeed({ session, opponent }: { session: Session; opponent: string }) {
  const [entries, setEntries] = useState<readonly Entry[]>([]);
  const nextId = useRef(0);
  useMatchEffect(session, (e) => {
    const text = feedLine(e, opponent);
    if (!text) return;
    const id = nextId.current++;
    const at = mmss(session.getSnapshot().clock);
    setEntries((all) => [{ id, at, text }, ...all.slice(0, MAX_ENTRIES - 1)]);
  });
  return (
    <div className={styles.feed}>
      <h2 className={styles.feedTitle}>Match feed</h2>
      <ol className={styles.feedList} aria-live="off">
        {entries.map((x) => (
          <li key={x.id}>
            <time>{x.at}</time> {x.text}
          </li>
        ))}
      </ol>
    </div>
  );
}
