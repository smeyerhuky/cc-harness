import {
  HAPTICS,
  useGestures,
  useHaptics,
  useReducedMotion,
  type GestureCommand,
  type GestureFeedback,
} from '@garbage-day/ui';
import { W } from '@garbage-day/engine';
import { use, useRef, useState } from 'react';
import { InputContext, MatchSessionContext } from '../../state/matchContexts';
import { usePrefs } from '../../state/prefs';
import styles from './Touch.module.css';

interface Mark {
  readonly id: number;
  readonly f: GestureFeedback;
}

const ARROW = { x: { '-1': '←', '1': '→' }, y: { '-1': '↑', '1': '↓' } } as const;

/** The mark a gesture leaves (UI language, "Touch feedback"). */
function FeedbackMark({ f, onDone }: { f: GestureFeedback; onDone: () => void }) {
  const at = (x: number, y: number) => ({ left: `${x}px`, top: `${y}px` });
  switch (f.kind) {
    case 'axis':
      return (
        <span
          className={styles.arrow}
          style={at(f.x, f.y)}
          data-feedback="axis"
          onAnimationEnd={onDone}
        >
          {ARROW[f.axis][f.dir]}
        </span>
      );
    case 'flick':
      return (
        <span
          className={styles.streak}
          style={{ left: `${f.x}px` }}
          data-feedback="flick"
          onAnimationEnd={onDone}
        />
      );
    case 'tap':
      return (
        <span
          className={[styles.arc, f.side === 'left' ? styles.left : styles.right].join(' ')}
          style={at(f.x, f.y)}
          data-feedback="tap"
          onAnimationEnd={onDone}
        >
          {f.side === 'left' ? '↺' : '↻'}
        </span>
      );
  }
}

/**
 * Touch play on the player's board (US-17): the gesture table drives the same input controller as
 * the keyboard, a hard drop vibrates where the device can, and each gesture leaves a faint mark
 * (GD-TICKET-015), none under reduced motion. It covers the board and takes its touches, so the
 * page never scrolls or zooms under a finger.
 */
export function TouchSurface() {
  const input = use(InputContext);
  const active = MatchSessionContext.useSelector((v) => v.phase !== 'over');
  const gestures = usePrefs((s) => s.gestures);
  const sensitivity = usePrefs((s) => s.sensitivity);
  const reduced = useReducedMotion();
  const vibrate = useHaptics(true);
  const surface = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<readonly Mark[]>([]);
  const nextId = useRef(0);
  const onCommand = (c: GestureCommand) => {
    if (!input) return;
    switch (c.kind) {
      case 'move':
        input.nudge(c.dx);
        break;
      case 'drop':
        input.drop(c.rows);
        break;
      case 'hard':
        input.press('hard');
        vibrate(HAPTICS.hardDrop);
        break;
      case 'hold':
        input.press('hold');
        break;
      case 'rotate':
        input.press(c.dir);
        break;
    }
  };
  const onFeedback = (f: GestureFeedback) => {
    if (reduced) return;
    const id = nextId.current++;
    setMarks((all) => [...all.slice(-5), { id, f }]);
  };
  useGestures(surface, {
    columns: W,
    sensitivity,
    enabled: active && gestures,
    onCommand,
    onFeedback,
  });
  if (!gestures) return null;
  return (
    <div ref={surface} className={styles.surface} data-touch-surface="">
      {marks.map((m) => (
        <FeedbackMark
          key={m.id}
          f={m.f}
          onDone={() => setMarks((all) => all.filter((x) => x.id !== m.id))}
        />
      ))}
    </div>
  );
}
