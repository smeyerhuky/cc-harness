import { TPS, type Controller, type Input } from '@garbage-day/engine';

// The player's input for the engine, ported from the proof of concept's `Human` class
// (spikes/proof-of-concept/live/live-engine.js): held keys, pressed edges, and auto-repeat for
// sideways moves (DAS then ARR), counted in engine ticks. Keyboard, gestures and the button pad
// all feed it (client architecture, "Input"); the engine reads it once per tick.

export type Action = 'left' | 'right' | 'soft' | 'hard' | 'cw' | 'ccw' | 'hold' | 'power';

const MS_PER_TICK = 1000 / TPS;
/** Milliseconds to whole engine ticks, at least one. */
export const toTicks = (ms: number) => Math.max(1, Math.round(ms / MS_PER_TICK));
/** Whole ticks to the nearest millisecond. */
export const toMs = (ticks: number) => Math.round(ticks * MS_PER_TICK);

/** Auto-repeat defaults from the controls page: 167 ms delay (10 ticks), 33 ms rate (2 ticks). */
export const DEFAULT_TIMING = { dasMs: 167, arrMs: 33 } as const;

/** What the settings offer, in ticks: a delay of 50 to 333 ms, a rate of 17 to 100 ms. */
export const TIMING_TICKS = {
  das: { min: 3, max: 20 },
  arr: { min: 1, max: 6 },
} as const;

export class InputController implements Controller {
  private readonly held = new Set<Action>();
  private readonly pressed = new Set<Action>();
  private dir: -1 | 0 | 1 = 0;
  /** Ticks the current direction has been held. */
  private dasT = 0;
  /** A new direction moves once on the next tick, before auto-repeat starts. */
  private first = false;
  /** A direction pressed and released between two ticks still moves once. */
  private tap: -1 | 0 | 1 = 0;
  private das = toTicks(DEFAULT_TIMING.dasMs);
  private arr = toTicks(DEFAULT_TIMING.arrMs);

  /** Sets the auto-repeat delay and rate in milliseconds (US-16); each is at least one tick. */
  setTiming(dasMs: number, arrMs: number): void {
    this.das = toTicks(dasMs);
    this.arr = toTicks(arrMs);
  }

  down(a: Action): void {
    if (this.held.has(a)) return;
    this.held.add(a);
    this.pressed.add(a);
    if (a === 'left' || a === 'right') {
      this.dir = a === 'left' ? -1 : 1;
      this.dasT = 0;
      this.first = true;
    }
  }

  up(a: Action): void {
    this.held.delete(a);
    if ((a === 'left' && this.dir === -1) || (a === 'right' && this.dir === 1)) {
      if (this.first) this.tap = this.dir;
      this.dir = this.held.has('left') ? -1 : this.held.has('right') ? 1 : 0;
      this.dasT = 0;
      this.first = this.dir !== 0;
    }
  }

  /** Forgets everything held or pressed: on blur, and when a match starts or resumes. */
  reset(): void {
    this.held.clear();
    this.pressed.clear();
    this.dir = 0;
    this.first = false;
    this.tap = 0;
  }

  /** Whether a press or a new direction is waiting for the next tick. */
  hasPending(): boolean {
    return this.pressed.size > 0 || this.first || this.tap !== 0;
  }

  tick(): Input {
    const p = this.pressed;
    let dx: -1 | 0 | 1 = 0;
    if (this.tap) {
      // A tap moves first; a direction pressed or still held moves on the next tick.
      dx = this.tap;
      this.tap = 0;
    } else if (this.dir) {
      if (this.first) {
        dx = this.dir;
        this.first = false;
        this.dasT = 0;
      } else {
        this.dasT++;
        if (this.dasT >= this.das && (this.dasT - this.das) % this.arr === 0) dx = this.dir;
      }
    }
    const input: Input = {
      cw: p.has('cw'),
      ccw: p.has('ccw'),
      hold: p.has('hold'),
      hard: p.has('hard'),
      power: p.has('power'),
      soft: this.held.has('soft'),
      dx,
    };
    p.clear();
    return input;
  }
}
