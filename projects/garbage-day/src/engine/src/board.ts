import { H, PIECE_TYPES, POWER_KINDS, W, type PieceType, type PowerKind } from './constants';

/**
 * A board: W × H cells, row 0 at the bottom, cell (x, y) at index y * W + x. A cell holds 0 when
 * empty, 1–7 for a piece (I O T S Z J L), 8 for garbage, 9–12 for a gem (shield bomb fog rush).
 */
export type Board = Uint8Array;

export const EMPTY = 0;
export const GARBAGE = 8;
const GEM_BASE = 9;
/** The snapshot character for each cell value, as in the proof of concept. */
const CHARS = '.IOTSZJLX1234';

export const pieceCell = (t: PieceType): number => PIECE_TYPES.indexOf(t) + 1;
export const gemCell = (kind: PowerKind): number => GEM_BASE + POWER_KINDS.indexOf(kind);
export const gemPower = (value: number): PowerKind | null =>
  value >= GEM_BASE ? (POWER_KINDS[value - GEM_BASE] ?? null) : null;

export const emptyBoard = (): Board => new Uint8Array(W * H);
export const cellAt = (b: Board, x: number, y: number): number => b[y * W + x] ?? EMPTY;
export function setCell(b: Board, x: number, y: number, value: number): void {
  b[y * W + x] = value;
}

function rowIsFull(b: Board, y: number): boolean {
  for (let x = 0; x < W; x++) if (cellAt(b, x, y) === EMPTY) return false;
  return true;
}

export function rowIsEmpty(b: Board, y: number): boolean {
  for (let x = 0; x < W; x++) if (cellAt(b, x, y) !== EMPTY) return false;
  return true;
}

export function fullRows(b: Board): number[] {
  const rows: number[] = [];
  for (let y = 0; y < H; y++) if (rowIsFull(b, y)) rows.push(y);
  return rows;
}

/** A new board without `rows`; the rows above drop down and empty rows fill the top. */
export function clearRows(b: Board, rows: readonly number[]): Board {
  const out = emptyBoard();
  let to = 0;
  for (let y = 0; y < H; y++) {
    if (rows.includes(y)) continue;
    out.set(b.subarray(y * W, y * W + W), to * W);
    to++;
  }
  return out;
}

/** A new board with the bottom `n` rows removed and `n` empty rows added at the top. */
export function dropBottomRows(b: Board, n: number): Board {
  const out = emptyBoard();
  out.set(b.subarray(n * W));
  return out;
}

export const isEmpty = (b: Board): boolean => b.every((v) => v === EMPTY);

/** The number of rows up to and including the highest filled cell. */
export function height(b: Board): number {
  for (let y = H - 1; y >= 0; y--) if (!rowIsEmpty(b, y)) return y + 1;
  return 0;
}

/** Empty cells with a filled cell somewhere above them in the same column. */
export function holes(b: Board): number {
  let n = 0;
  for (let x = 0; x < W; x++) {
    let covered = false;
    for (let y = H - 1; y >= 0; y--) {
      if (cellAt(b, x, y) !== EMPTY) covered = true;
      else if (covered) n++;
    }
  }
  return n;
}

/** The board as W × H characters, floor row first: the format sent in lock messages. */
export function snapshot(b: Board): string {
  let s = '';
  for (const v of b) s += CHARS[v] ?? '?';
  return s;
}

export function parse(s: string): Board {
  if (s.length !== W * H) throw new Error(`A board snapshot has ${W * H} cells, not ${s.length}`);
  const b = emptyBoard();
  for (let i = 0; i < s.length; i++) {
    const v = CHARS.indexOf(s.charAt(i));
    if (v < 0) throw new Error(`Unknown cell "${s.charAt(i)}" at ${i}`);
    b[i] = v;
  }
  return b;
}
