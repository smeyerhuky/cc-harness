import styles from './Toggle.module.css';

/** An on/off switch with its label; Space or Enter flips it. */
export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={styles.toggle}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.track} aria-hidden="true" />
      {label}
    </button>
  );
}
