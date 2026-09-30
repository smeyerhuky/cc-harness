import type { ReactNode } from 'react';
import styles from './Chip.module.css';

export type ChipTone = 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' | 'rival';

/** A small pill with a coloured dot: the dot adds colour, the words carry the meaning. */
export function Chip({ tone = 'neutral', children }: { tone?: ChipTone; children: ReactNode }) {
  return (
    <span className={`${styles.chip} ${styles[tone]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {children}
    </span>
  );
}
