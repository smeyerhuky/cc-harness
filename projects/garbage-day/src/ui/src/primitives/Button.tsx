import type { ComponentProps, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ComponentProps<'button'> {
  /** `primary` is filled in accent: one per screen, for the main action. */
  readonly variant?: 'primary' | 'secondary' | 'ghost';
  readonly size?: 'medium' | 'large';
  /** Fills the width of its container. */
  readonly block?: boolean;
}

/** A button at least 44 px tall, so it is easy to hit with a thumb. */
export function Button({
  variant = 'secondary',
  size = 'medium',
  block = false,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  const cls = [
    styles.button,
    styles[variant],
    size === 'large' && styles.large,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button type={type} className={cls} {...rest} />;
}

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'aria-label'> {
  /** What the button does, read by screen readers and shown as a tooltip. */
  readonly label: string;
  readonly children: ReactNode;
}

/** A square button showing only an icon; the label names it for everyone who can't see it. */
export function IconButton({ label, className, ...rest }: IconButtonProps) {
  return (
    <Button
      aria-label={label}
      title={label}
      className={[styles.icon, className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
