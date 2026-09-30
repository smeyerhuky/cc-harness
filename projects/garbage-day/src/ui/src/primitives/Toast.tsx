import { useEffect, useEffectEvent } from 'react';
import styles from './Toast.module.css';

/**
 * A short message ("Link copied") read politely by screen readers, dismissed after `duration` ms.
 * Render it only while there is a message.
 */
export function Toast({
  message,
  onDismiss,
  duration = 3000,
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
}) {
  const dismiss = useEffectEvent(onDismiss);
  useEffect(() => {
    const id = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(id);
  }, [message, duration]);
  return (
    <div role="status" className={styles.toast}>
      {message}
    </div>
  );
}
