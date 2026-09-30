import { IconButton } from './Button';
import styles from './Field.module.css';

/** A number changed one step at a time with − and + buttons, clamped to its range. */
export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className={styles.field} role="group" aria-label={label}>
      <span>{label}</span>
      <div className={styles.row}>
        <IconButton
          label={`Less ${label}`}
          disabled={value <= min}
          onClick={() => set(value - step)}
        >
          −
        </IconButton>
        <output className={styles.value} aria-live="polite">
          {format(value)}
        </output>
        <IconButton
          label={`More ${label}`}
          disabled={value >= max}
          onClick={() => set(value + step)}
        >
          +
        </IconButton>
      </div>
    </div>
  );
}
