import type { ReactNode } from 'react';
import styles from './Layout.module.css';

/** The strip at the bottom of a phone screen, in thumb reach: the power-up button lives here. */
export function ThumbZone({ children }: { children: ReactNode }) {
  return <div className={styles.thumb}>{children}</div>;
}
