import styles from './Hud.module.css';

/** `SPEED 7` with a thin bar to the next level (US-09); red while Rush or sudden death is on. */
export function SpeedChip({
  level,
  progress,
  hot = false,
}: {
  level: number;
  /** 0 to 1 of the way to the next level. */
  progress: number;
  hot?: boolean;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <span
      className={[styles.speed, hot && styles.hot].filter(Boolean).join(' ')}
      role="group"
      aria-label={`Speed ${level}, ${pct}% to the next level${hot ? ', boosted' : ''}`}
    >
      <span aria-hidden="true">SPEED {level}</span>
      <span className={styles.bar} aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}
