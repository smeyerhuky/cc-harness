import { useEffect, type ReactNode } from 'react';
import styles from './Layout.module.css';

/**
 * A screen that fills the viewport inside the safe areas: a header, the body, and a footer.
 * `locked` stops scrolling, zooming and pull-to-refresh, as a match needs (US-19). Pull-to-refresh
 * belongs to the page's root scroller, so while locked the root is marked `data-locked`, which
 * the generated tokens CSS holds still.
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
  useEffect(() => {
    if (!locked) return;
    const root = document.documentElement;
    root.dataset.locked = '';
    return () => {
      delete root.dataset.locked;
    };
  }, [locked]);
  return (
    <div className={[styles.screen, locked && styles.locked].filter(Boolean).join(' ')}>
      <header>{header}</header>
      <main style={{ minHeight: 0 }}>{children}</main>
      <footer>{footer}</footer>
    </div>
  );
}
