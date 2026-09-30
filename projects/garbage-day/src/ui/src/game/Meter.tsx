import styles from './Hud.module.css';

/**
 * Incoming garbage beside a board (US-08): waiting rows in dim hazard stripes, rows ready to land
 * bright, the count above, and a cyan glow while a Shield is up.
 */
export function Meter({
  total,
  ready,
  rows = 20,
  shielded = false,
}: {
  /** Rows waiting in all. */
  total: number;
  /** Of those, rows whose 0.5 s delay has passed. */
  ready: number;
  /** Rows the bar's full height stands for. */
  rows?: number;
  shielded?: boolean;
}) {
  const pct = (n: number) => `${(Math.min(n, rows) / rows) * 100}%`;
  return (
    <div
      className={[styles.meter, shielded && styles.shielded].filter(Boolean).join(' ')}
      role="meter"
      aria-label={`Incoming garbage${shielded ? ', shielded' : ''}`}
      aria-valuemin={0}
      aria-valuemax={rows}
      aria-valuenow={Math.min(total, rows)}
      aria-valuetext={`${total} ${total === 1 ? 'row' : 'rows'}, ${ready} ready`}
    >
      <div className={styles.fill} style={{ height: pct(total) }} />
      <div className={styles.ready} style={{ height: pct(ready) }} />
      {total > 0 && (
        <span className={styles.count} style={{ bottom: pct(total) }} aria-hidden="true">
          {total}
        </span>
      )}
    </div>
  );
}
