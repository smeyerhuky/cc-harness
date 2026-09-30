import { useId } from 'react';
import styles from './Field.module.css';

/** A labelled range input with its value shown beside it. */
export function Slider({
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
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.row}>
        <input
          id={id}
          type="range"
          className={styles.range}
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={format(value)}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <output htmlFor={id} className={styles.value}>
          {format(value)}
        </output>
      </div>
    </div>
  );
}
