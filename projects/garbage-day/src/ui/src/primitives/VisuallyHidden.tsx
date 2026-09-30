import type { ReactNode } from 'react';
import styles from './VisuallyHidden.module.css';

/** Text for screen readers only: labels and live announcements the screen shows another way. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.hidden}>{children}</span>;
}
