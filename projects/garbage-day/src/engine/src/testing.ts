import { type Board, parse, snapshot } from './board';
import { H, W } from './constants';

/**
 * A board from rows drawn top-down, the last string being row 0: '.' empty, 'X' garbage, a piece
 * letter, or '1'–'4' for a gem. For tests.
 */
export function boardFrom(rows: readonly string[]): Board {
  const lines = [...rows].reverse();
  let s = '';
  for (let y = 0; y < H; y++) s += (lines[y] ?? '').padEnd(W, '.');
  return parse(s);
}

/** Rows `from` down to 0 of a board, top-down, the inverse of boardFrom. For tests. */
export function rowsOf(b: Board, from = 3): string[] {
  const s = snapshot(b);
  const out: string[] = [];
  for (let y = from; y >= 0; y--) out.push(s.slice(y * W, y * W + W));
  return out;
}
