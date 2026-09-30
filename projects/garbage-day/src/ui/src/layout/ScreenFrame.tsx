import type { ReactNode } from 'react';
import styles from './Layout.module.css';

/**
 * A screen that fills the viewport inside the safe areas: a header, the body, and a footer.
 * `locked` stops scrolling, zooming and pull-to-refresh, as a match needs (US-19).
 */
export function ScreenFrame({
  header,
  footer,
  locked = false,
  children,
}: {
  header?: ReactNode;
  footer?: ReactNode;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={[styles.screen, locked && styles.locked].filter(Boolean).join(' ')}>
      <header>{header}</header>
      <main style={{ minHeight: 0 }}>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}
