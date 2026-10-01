import {
  HAPTICS,
  POWER_NAME,
  PowerIcon,
  ThumbZone,
  useHaptics,
  useMediaQuery,
} from '@garbage-day/ui';
import { use, useState, type PointerEvent } from 'react';
import type { Action } from '../../input/InputController';
import { InputContext, MatchSessionContext } from '../../state/matchContexts';
import { usePrefs } from '../../state/prefs';
import { useMatchLayout } from './useMatchLayout';
import styles from './Touch.module.css';

/** The pad's keys, in two rows (controls and layout, "Touch gestures"). */
const PAD: readonly (readonly [Action, string, string])[] = [
  ['hold', 'Hold', 'Hold'],
  ['ccw', '↺', 'Rotate counter-clockwise'],
  ['cw', '↻', 'Rotate clockwise'],
  ['power', 'Power', 'Fire power-up'],
  ['left', '←', 'Move left'],
  ['soft', '↓', 'Soft drop'],
  ['right', '→', 'Move right'],
  ['hard', 'Drop', 'Hard drop'],
];

/**
 * The on-screen button pad, a setting (US-17). A key acts while pressed, as a keyboard key does,
 * so left, right and soft drop repeat while held.
 */
function ButtonPad({ active }: { active: boolean }) {
  const input = use(InputContext);
  const vibrate = useHaptics(true);
  const [held, setHeld] = useState<ReadonlySet<Action>>(new Set());
  const press = (a: Action) => (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!input || !active) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    input.down(a);
    if (a === 'hard') vibrate(HAPTICS.hardDrop);
    setHeld((s) => new Set(s).add(a));
  };
  const release = (a: Action) => () => {
    input?.up(a);
    setHeld((s) => {
      const next = new Set(s);
      next.delete(a);
      return next;
    });
  };
  return (
    <div className={styles.pad} role="group" aria-label="Button pad">
      {PAD.map(([a, text, label]) => (
        <button
          key={a}
          type="button"
          className={styles.key}
          aria-label={label}
          data-held={held.has(a) ? '' : undefined}
          onPointerDown={press(a)}
          onPointerUp={release(a)}
          onPointerCancel={release(a)}
          onLostPointerCapture={release(a)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * The round power-up button in thumb reach (US-17), on touch screens, shown only while a
 * power-up is banked. With the pad on, the pad's Power key does this instead.
 */
function PowerButton() {
  const input = use(InputContext);
  const power = MatchSessionContext.useSelector((v) => v.players[0].power);
  if (!power) return null;
  return (
    <button
      type="button"
      className={styles.powerButton}
      aria-label={`Fire ${POWER_NAME[power]}`}
      onPointerDown={(e) => {
        e.preventDefault();
        input?.press('power');
      }}
    >
      <PowerIcon kind={power} decorative />
    </button>
  );
}

/**
 * Below the stage on a touch screen: the power-up button, or the pad when it's on. On a phone on
 * its side the button floats in the bottom corner instead, so the boards keep the height.
 */
export function TouchControls() {
  const layout = useMatchLayout();
  const active = MatchSessionContext.useSelector((v) => v.phase !== 'over');
  const touch = useMediaQuery('(pointer: coarse)');
  const pad = usePrefs((s) => s.pad);
  const gestures = usePrefs((s) => s.gestures);
  if (pad) return <ButtonPad active={active} />;
  if (!touch || !gestures) return null;
  if (layout === 'landscape') {
    return (
      <div className={styles.floating}>
        <PowerButton />
      </div>
    );
  }
  return (
    <ThumbZone>
      <div className={styles.power}>
        <PowerButton />
      </div>
    </ThumbZone>
  );
}
