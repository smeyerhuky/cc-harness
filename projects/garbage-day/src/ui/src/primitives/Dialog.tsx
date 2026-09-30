import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Dialog.module.css';

export interface DialogProps {
  readonly open: boolean;
  /** Called when the dialog closes itself (Escape) or a child asks it to. */
  readonly onClose: () => void;
  readonly title: string;
  readonly children: ReactNode;
  /** The hazard stripe band on top, for a popover that interrupts play. */
  readonly band?: boolean;
  /** Slides in as a sheet instead of a centred card. */
  readonly sheet?: boolean;
}

/**
 * A modal on the native `<dialog>`: the browser traps focus, closes it on Escape, and restores
 * focus when it closes. `open` drives `showModal()` and `close()`.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  band = false,
  sheet = false,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={[styles.dialog, sheet && styles.sheet].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {band && <div className={styles.band} aria-hidden="true" />}
      <div className={styles.body}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

/** A dialog that slides in from the edge: settings and other side tasks. */
export function Sheet(props: Omit<DialogProps, 'sheet' | 'band'>) {
  return <Dialog {...props} sheet />;
}
