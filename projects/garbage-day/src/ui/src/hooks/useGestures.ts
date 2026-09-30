import { useEffect, useEffectEvent, type RefObject } from 'react';

// Touch play by the gesture table (kb/product/controls-and-layout.md, "Touch gestures"): the whole
// board is the surface, and a gesture is judged from where the finger lands to where it lifts.
// `GestureRecognizer` is the table as a pure class, fed positions and times, so tests drive every
// row of it; `useGestures` feeds it pointer events.

/** What a gesture does in the game. */
export type GestureCommand =
  | { readonly kind: 'move'; readonly dx: -1 | 1 }
  | { readonly kind: 'drop'; readonly rows: number }
  | { readonly kind: 'hard' }
  | { readonly kind: 'hold' }
  | { readonly kind: 'rotate'; readonly dir: 'cw' | 'ccw' };

/** What the player sees of a gesture (UI language, "Touch feedback"), in surface coordinates. */
export type GestureFeedback =
  | {
      readonly kind: 'axis';
      readonly axis: 'x' | 'y';
      readonly dir: -1 | 1;
      readonly x: number;
      readonly y: number;
    }
  | { readonly kind: 'flick'; readonly x: number }
  | {
      readonly kind: 'tap';
      readonly side: 'left' | 'right';
      readonly x: number;
      readonly y: number;
    };

export interface GestureOptions {
  /** Columns across the surface: one cell is its width over this. */
  readonly columns: number;
  /** Scales cell distances and the flick speed: 2 needs half the travel (default 1). */
  readonly sensitivity?: number;
}

/** The table's numbers. */
export const GESTURE = {
  /** A gesture commits to one axis after this much travel, in px. */
  axisLockPx: 12,
  /** A tap lifts within this long and this close. */
  tapMs: 200,
  tapPx: 10,
  /** A flick moves faster than this, in px per ms, over the gesture's last `flickWindowMs`. */
  flickSpeed: 1.2,
  flickWindowMs: 80,
  /** A swipe up of at least this many cells holds. */
  holdCells: 1.5,
} as const;

interface Sample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

/** One finger's gesture on a surface `width` px wide. */
export class GestureRecognizer {
  private start: Sample | null = null;
  private samples: Sample[] = [];
  private axis: 'x' | 'y' | null = null;
  private columns = 0;
  private rows = 0;
  private held = false;
  private width = 0;

  constructor(
    private readonly o: GestureOptions,
    private readonly onCommand: (c: GestureCommand) => void,
    private readonly onFeedback: (f: GestureFeedback) => void = () => undefined,
  ) {}

  private get sensitivity(): number {
    return this.o.sensitivity ?? 1;
  }

  private get cell(): number {
    return this.width / this.o.columns / this.sensitivity;
  }

  /** A finger lands at (x, y) on a surface `width` px wide, at time `t` ms. */
  down(x: number, y: number, t: number, width: number): void {
    this.start = { x, y, t };
    this.samples = [{ x, y, t }];
    this.axis = null;
    this.columns = 0;
    this.rows = 0;
    this.held = false;
    this.width = width;
  }

  move(x: number, y: number, t: number): void {
    const s = this.start;
    if (!s) return;
    this.samples.push({ x, y, t });
    this.samples = this.samples.filter((p) => t - p.t <= GESTURE.flickWindowMs * 2);
    const dx = x - s.x;
    const dy = y - s.y;
    if (!this.axis) {
      if (Math.hypot(dx, dy) < GESTURE.axisLockPx) return;
      this.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      const d = this.axis === 'x' ? dx : dy;
      this.onFeedback({ kind: 'axis', axis: this.axis, dir: d < 0 ? -1 : 1, x, y });
    }
    if (this.axis === 'x') {
      // The piece follows the finger: one column per cell, back again if the finger goes back.
      const cols = Math.trunc(dx / this.cell);
      while (this.columns !== cols) {
        const step = cols > this.columns ? 1 : -1;
        this.columns += step;
        this.onCommand({ kind: 'move', dx: step });
      }
    } else if (dy > 0) {
      const rows = Math.trunc(dy / this.cell);
      if (rows > this.rows) {
        this.onCommand({ kind: 'drop', rows: rows - this.rows });
        this.rows = rows;
      }
    } else if (!this.held && -dy >= GESTURE.holdCells * this.cell) {
      this.held = true;
      this.onCommand({ kind: 'hold' });
    }
  }

  up(x: number, y: number, t: number): void {
    const s = this.start;
    if (!s) return;
    this.move(x, y, t);
    const travel = Math.hypot(x - s.x, y - s.y);
    if (!this.axis && t - s.t <= GESTURE.tapMs && travel <= GESTURE.tapPx) {
      const side = s.x < this.width / 3 ? 'left' : 'right';
      this.onCommand({ kind: 'rotate', dir: side === 'left' ? 'ccw' : 'cw' });
      this.onFeedback({ kind: 'tap', side, x: s.x, y: s.y });
    } else if (
      this.axis === 'y' &&
      y > s.y &&
      this.speed(t) > GESTURE.flickSpeed / this.sensitivity
    ) {
      this.onCommand({ kind: 'hard' });
      this.onFeedback({ kind: 'flick', x });
    }
    this.start = null;
  }

  cancel(): void {
    this.start = null;
  }

  /** Downward speed over the last `flickWindowMs`, in px per ms. */
  private speed(t: number): number {
    const recent = this.samples.filter((p) => t - p.t <= GESTURE.flickWindowMs);
    const first = recent[0];
    const last = recent.at(-1);
    if (!first || !last || last.t === first.t) return 0;
    return (last.y - first.y) / (last.t - first.t);
  }
}

/**
 * Touch play on `surface` while `enabled`: the gesture table's commands and feedback, one finger
 * at a time. The surface should have `touch-action: none` so the page doesn't scroll or zoom.
 */
export function useGestures(
  surface: RefObject<HTMLElement | null>,
  o: GestureOptions & {
    readonly enabled?: boolean;
    readonly onCommand: (c: GestureCommand) => void;
    readonly onFeedback?: (f: GestureFeedback) => void;
  },
): void {
  const command = useEffectEvent((c: GestureCommand) => o.onCommand(c));
  const feedback = useEffectEvent((f: GestureFeedback) => o.onFeedback?.(f));
  const enabled = o.enabled ?? true;
  const { columns, sensitivity = 1 } = o;
  useEffect(() => {
    const el = surface.current;
    if (!el || !enabled) return;
    const g = new GestureRecognizer({ columns, sensitivity }, command, feedback);
    let finger: number | null = null;
    const at = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, width: r.width };
    };
    const down = (e: PointerEvent) => {
      if (finger !== null || e.button > 0) return;
      finger = e.pointerId;
      el.setPointerCapture?.(e.pointerId);
      e.preventDefault();
      const p = at(e);
      g.down(p.x, p.y, e.timeStamp, p.width);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== finger) return;
      const p = at(e);
      g.move(p.x, p.y, e.timeStamp);
    };
    const up = (e: PointerEvent) => {
      if (e.pointerId !== finger) return;
      finger = null;
      const p = at(e);
      g.up(p.x, p.y, e.timeStamp);
    };
    const cancel = (e: PointerEvent) => {
      if (e.pointerId !== finger) return;
      finger = null;
      g.cancel();
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', cancel);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', cancel);
    };
  }, [surface, enabled, columns, sensitivity]);
}
