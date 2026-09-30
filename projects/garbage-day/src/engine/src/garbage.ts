import { type Board, emptyBoard, GARBAGE, rowIsEmpty } from './board';
import { H, W } from './constants';
import type { Rng } from './rng';

/** Rows of one attack waiting in a player's meter. */
export interface MeterEntry {
  /** The attack id the referee gave it. */
  readonly id: number;
  /** Rows still waiting. */
  rows: number;
  /** The tick from which the rows may land. */
  readonly ready: number;
  /** The hole column, drawn when the attack first lands, so all its rows share it. */
  hole?: number;
}

export const meterTotal = (meter: readonly MeterEntry[]): number =>
  meter.reduce((n, e) => n + e.rows, 0);

export const meterReady = (meter: readonly MeterEntry[], t: number): number =>
  meter.reduce((n, e) => n + (e.ready <= t ? e.rows : 0), 0);

/** Cancels an attack's rows against the meter, oldest entry first; mutates the meter. */
export function cancelGarbage(
  meter: MeterEntry[],
  attack: number,
): { sent: number; cancelled: number } {
  let left = attack;
  let cancelled = 0;
  while (left > 0 && meter.length) {
    const e = meter[0];
    if (!e) break;
    const k = Math.min(left, e.rows);
    e.rows -= k;
    left -= k;
    cancelled += k;
    if (!e.rows) meter.shift();
  }
  return { sent: left, cancelled };
}

/**
 * Lands ready garbage after a lock that cleared nothing: at most `cap` rows, oldest attack first,
 * each attack's rows sharing one hole drawn from the receiver's `holes` stream. Rows push the
 * stack up; `overflow` is true when that pushes blocks beyond the top of the hidden rows.
 * Mutates the meter; returns a new board.
 */
export function landGarbage(
  board: Board,
  meter: MeterEntry[],
  t: number,
  cap: number,
  holes: Rng,
): { board: Board; landed: number; overflow: boolean } {
  let b = board;
  let landed = 0;
  let overflow = false;
  while (meter.length && landed < cap) {
    const e = meter[0];
    if (!e || e.ready > t) break;
    const k = Math.min(e.rows, cap - landed);
    e.hole ??= Math.floor(holes() * W);
    for (let y = H - k; y < H; y++) if (!rowIsEmpty(b, y)) overflow = true;
    const next = emptyBoard();
    for (let y = 0; y < k; y++) {
      for (let x = 0; x < W; x++) if (x !== e.hole) next[y * W + x] = GARBAGE;
    }
    next.set(b.subarray(0, (H - k) * W), k * W);
    b = next;
    landed += k;
    e.rows -= k;
    if (!e.rows) meter.shift();
  }
  return { board: b, landed, overflow };
}
