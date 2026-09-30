import { useEffect, useEffectEvent, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MOTION } from '../tokens/tokens';
import styles from './Overlay.module.css';

/** 3-2-1-GO: each number pops in over 550 ms; with reduced motion it changes in place. */
export function Countdown({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const text = value > 0 ? String(value) : 'GO';
  return (
    <div className={styles.countdown} role="timer" aria-live="assertive">
      <span key={text} className={reduced ? undefined : styles.pop}>
        {text}
      </span>
    </div>
  );
}

export type ShowdownKind = 'double' | 'sudden';

const SHOWDOWN_NAME: Readonly<Record<ShowdownKind, string>> = {
  double: 'Double garbage',
  sudden: 'Sudden death',
};

/**
 * The pill across the top of the stage (US-11): announced 5 s ahead, yellow for Double garbage,
 * red and pulsing for Sudden death.
 */
export function ShowdownBanner({
  kind,
  startsIn,
}: {
  kind: ShowdownKind;
  /** Seconds until it starts, while announcing; omit once it has started. */
  startsIn?: number;
}) {
  const text =
    startsIn !== undefined ? `${SHOWDOWN_NAME[kind]} in ${startsIn}` : SHOWDOWN_NAME[kind];
  return (
    <div
      className={[styles.banner, kind === 'sudden' && styles.sudden].filter(Boolean).join(' ')}
      role="status"
    >
      {text}
    </div>
  );
}

export type PopupTone = 'plain' | 'strong' | 'power' | 'bad';

/**
 * A label over a board that rises and fades over 1.3 s, or shows for 1 s without moving under
 * reduced motion: a clear ("QUAD", "T-SPIN DOUBLE", in hazard yellow when `strong`), or a smaller
 * note ("−2 cancelled", "Shield up"). `onDone` fires when it has finished. A `quiet` one isn't
 * announced to screen readers: the rival's labels, which would talk over the player's own.
 */
export function Popup({
  text,
  onDone,
  tone = 'plain',
  small = false,
  quiet = false,
}: {
  text: string;
  onDone: () => void;
  tone?: PopupTone;
  small?: boolean;
  quiet?: boolean;
}) {
  const reduced = useReducedMotion();
  const done = useEffectEvent(onDone);
  useEffect(() => {
    const id = setTimeout(() => done(), reduced ? MOTION.clearLabelReduced : MOTION.clearLabel);
    return () => clearTimeout(id);
  }, [text, reduced]);
  const cls = [
    styles.popup,
    !reduced && styles.rise,
    tone !== 'plain' && styles[tone],
    small && styles.note,
  ];
  return (
    <div
      className={cls.filter(Boolean).join(' ')}
      {...(quiet ? { 'aria-hidden': true } : { role: 'status' })}
    >
      {text}
    </div>
  );
}

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * An attack flying from one board through the centre column to the other meter in 700 ms
 * (US-08). Under reduced motion, or where the Web Animations API is missing, it finishes at once
 * and the meter's count is the feedback.
 */
export function AttackFlight({ from, to, onDone }: { from: Point; to: Point; onDone: () => void }) {
  const reduced = useReducedMotion();
  const token = useRef<HTMLDivElement>(null);
  const done = useEffectEvent(onDone);
  const { x: x0, y: y0 } = from;
  const { x: x1, y: y1 } = to;
  useEffect(() => {
    const el = token.current;
    if (reduced || !el || typeof el.animate !== 'function') {
      done();
      return;
    }
    const at = (x: number, y: number) => `translate(${x}px, ${y}px)`;
    const animation = el.animate(
      [
        { transform: at(x0, y0) },
        { transform: at((x0 + x1) / 2, Math.min(y0, y1) - 40), offset: 0.5 },
        { transform: at(x1, y1) },
      ],
      { duration: MOTION.attackFlight, easing: 'cubic-bezier(0.3, 0, 0.3, 1)', fill: 'forwards' },
    );
    animation.onfinish = () => done();
    return () => {
      // Cancelling rejects `finished`; a flight cut short is not an error.
      animation.finished.catch(() => undefined);
      animation.cancel();
    };
  }, [x0, y0, x1, y1, reduced]);
  return <div ref={token} className={styles.token} aria-hidden="true" />;
}

/**
 * Covers a board while the match is paused (pause and presence rules): "Hidden while paused",
 * with the reason and the time left in hazard yellow.
 */
export function BoardCover({ reason, timeLeft }: { reason: string; timeLeft?: string }) {
  return (
    <div className={styles.cover} role="status">
      <b>Hidden while paused</b>
      <span>
        {reason}
        {timeLeft ? ` · ${timeLeft}` : ''}
      </span>
    </div>
  );
}
