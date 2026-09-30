import styles from './Kbd.module.css';

/** A key cap, as in "press <Kbd>Space</Kbd> to drop". */
export function Kbd({ children }: { children: string }) {
  return <kbd className={styles.kbd}>{children}</kbd>;
}
