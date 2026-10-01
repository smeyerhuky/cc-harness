import { render } from '@testing-library/react';
import { useRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  GestureRecognizer,
  useGestures,
  type GestureCommand,
  type GestureFeedback,
} from './useGestures';

/** A 300 px surface with 10 columns: a cell is 30 px. */
function recognizer(sensitivity = 1) {
  const commands: GestureCommand[] = [];
  const feedback: GestureFeedback[] = [];
  const g = new GestureRecognizer(
    { columns: 10, sensitivity },
    (c) => commands.push(c),
    (f) => feedback.push(f),
  );
  /** A finger from `from` through `path` points, `ms` apart, lifting at the last. */
  const gesture = (from: [number, number], path: [number, number][], ms = 16) => {
    let t = 1000;
    g.down(from[0], from[1], t, 300);
    path.forEach(([x, y], i) => {
      t += ms;
      if (i === path.length - 1) g.up(x, y, t);
      else g.move(x, y, t);
    });
  };
  return { commands, feedback, gesture, g };
}

/** Evenly spaced points from a to b. */
const line = (a: [number, number], b: [number, number], n: number): [number, number][] =>
  Array.from({ length: n }, (_, i) => [
    a[0] + ((b[0] - a[0]) * (i + 1)) / n,
    a[1] + ((b[1] - a[1]) * (i + 1)) / n,
  ]);

describe('the gesture table', () => {
  it('tap rotates clockwise; on the left third, counter-clockwise', () => {
    const r = recognizer();
    r.gesture([200, 100], [[203, 102]], 100);
    r.gesture([50, 100], [[52, 100]], 100);
    expect(r.commands).toEqual([
      { kind: 'rotate', dir: 'cw' },
      { kind: 'rotate', dir: 'ccw' },
    ]);
    expect(r.feedback.map((f) => f.kind === 'tap' && f.side)).toEqual(['right', 'left']);
  });

  it('a touch held longer than 200 ms, or moved over 10 px, is not a tap', () => {
    const r = recognizer();
    r.gesture([200, 100], [[200, 100]], 250);
    r.gesture([200, 100], [[211, 100]], 50);
    expect(r.commands).toEqual([]);
  });

  it('a drag moves the piece a column per cell, following the finger back', () => {
    const r = recognizer();
    r.gesture([100, 100], [...line([100, 100], [195, 104], 8), ...line([195, 104], [160, 104], 3)]);
    expect(r.commands).toEqual([
      { kind: 'move', dx: 1 },
      { kind: 'move', dx: 1 },
      { kind: 'move', dx: 1 },
      { kind: 'move', dx: -1 },
    ]);
    expect(r.feedback[0]).toMatchObject({ kind: 'axis', axis: 'x', dir: 1 });
  });

  it('commits to one axis after 12 px, so a sideways drag never drops', () => {
    const r = recognizer();
    // Mostly sideways, drifting down 40 px: moves only.
    r.gesture([100, 100], line([100, 100], [220, 140], 10));
    expect(r.commands.every((c) => c.kind === 'move')).toBe(true);
    // Under 12 px of travel: nothing yet.
    const s = recognizer();
    s.g.down(100, 100, 0, 300);
    s.g.move(108, 106, 16);
    expect(s.commands).toEqual([]);
  });

  it('a slow drag down soft-drops a row per cell; a quick flick hard-drops', () => {
    const slow = recognizer();
    slow.gesture([150, 50], line([150, 50], [150, 145], 10), 100);
    expect(slow.commands).toEqual([
      { kind: 'drop', rows: 1 },
      { kind: 'drop', rows: 1 },
      { kind: 'drop', rows: 1 },
    ]);
    const flick = recognizer();
    flick.gesture([150, 50], line([150, 50], [150, 170], 4), 16);
    expect(flick.commands.at(-1)).toEqual({ kind: 'hard' });
    expect(flick.feedback.at(-1)).toEqual({ kind: 'flick', x: 150 });
  });

  it('a swipe up of 1.5 cells holds, once', () => {
    const r = recognizer();
    r.gesture([150, 200], line([150, 200], [150, 100], 6), 40);
    expect(r.commands).toEqual([{ kind: 'hold' }]);
    const short = recognizer();
    short.gesture([150, 200], line([150, 200], [150, 160], 4), 40);
    expect(short.commands).toEqual([]);
  });

  it('sensitivity scales the distances: at 2, half the travel per column', () => {
    const r = recognizer(2);
    r.gesture([100, 100], line([100, 100], [160, 100], 6));
    expect(r.commands).toHaveLength(4);
  });
});

function Surface({ onCommand }: { onCommand: (c: GestureCommand) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useGestures(ref, { columns: 10, onCommand });
  return <div ref={ref} data-testid="surface" />;
}

describe('useGestures', () => {
  it('reads pointer events on the surface, one finger at a time', () => {
    const onCommand = vi.fn();
    const { getByTestId } = render(<Surface onCommand={onCommand} />);
    const el = getByTestId('surface');
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 600 }) as DOMRect;
    const fire = (type: string, x: number, y: number, pointerId = 1) =>
      el.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: y,
          pointerId,
          bubbles: true,
          cancelable: true,
        }),
      );
    fire('pointerdown', 200, 100);
    fire('pointerdown', 50, 100, 2);
    fire('pointerup', 50, 100, 2);
    fire('pointerup', 202, 100);
    expect(onCommand.mock.calls).toEqual([[{ kind: 'rotate', dir: 'cw' }]]);
  });
});
