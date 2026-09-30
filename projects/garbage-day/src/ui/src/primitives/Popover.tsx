import type { ReactNode } from 'react';
import styles from './Popover.module.css';

/**
 * Light, dismissable content on the Popover API: a button with `popoverTarget={id}` opens it,
 * and a click outside or Escape closes it, with no script.
 */
export function Popover({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div id={id} popover="auto" className={styles.popover} role="dialog" aria-label={label}>
      {children}
    </div>
  );
}
