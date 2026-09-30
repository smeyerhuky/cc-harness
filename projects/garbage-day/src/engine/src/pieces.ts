import { type Board, cellAt, EMPTY } from './board';
import { H, PIECE_TYPES, W, type PieceType, type PowerKind } from './constants';

export type Rotation = 0 | 1 | 2 | 3;
/** A cell offset inside a piece's box: [column, row], rows counted downward from the box's top. */
type Offset = readonly [number, number];

/** A gem on one of a piece's cells: `i` is the cell's index, the same mino in every rotation. */
export interface Gem {
  readonly i: number;
  readonly type: PowerKind;
}

/** A piece as dealt: its shape and any gem. */
export interface DealtPiece {
  readonly t: PieceType;
  readonly gem: Gem | null;
}

/** The falling piece. (x, y) is its box's top-left cell; y grows upward. */
export interface ActivePiece {
  readonly t: PieceType;
  r: Rotation;
  x: number;
  y: number;
  readonly gem: Gem | null;
}

const BOX: Record<PieceType, readonly string[]> = {
  I: ['....', 'IIII', '....', '....'],
  O: ['OO', 'OO'],
  T: ['.T.', 'TTT', '...'],
  S: ['.SS', 'SS.', '...'],
  Z: ['ZZ.', '.ZZ', '...'],
  J: ['J..', 'JJJ', '...'],
  L: ['..L', 'LLL', '...'],
};

function rotations(t: PieceType): readonly (readonly Offset[])[] {
  const box = BOX[t];
  const n = box.length;
  const base: Offset[] = [];
  box.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch !== '.') base.push([c, r]);
    });
  });
  const out: Offset[][] = [base];
  for (let s = 1; s < 4; s++) out.push((out[s - 1] ?? []).map(([c, r]) => [n - 1 - r, c] as const));
  return out;
}

/** Each piece's cells in each rotation state, in the SRS layout. */
export const CELLS: Readonly<Record<PieceType, readonly (readonly Offset[])[]>> =
  Object.fromEntries(PIECE_TYPES.map((t) => [t, rotations(t)])) as Record<
    PieceType,
    readonly (readonly Offset[])[]
  >;

type Transition = `${Rotation}>${Rotation}`;
/** Wall kicks as [dx, dy] with y up, tried in order: J, L, S, T and Z. */
export const KICKS_JLSTZ: Readonly<Partial<Record<Transition, readonly Offset[]>>> = {
  '0>1': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '1>0': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '1>2': [
    [0, 0],
    [1, 0],
    [1, -1],
    [0, 2],
    [1, 2],
  ],
  '2>1': [
    [0, 0],
    [-1, 0],
    [-1, 1],
    [0, -2],
    [-1, -2],
  ],
  '2>3': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
  '3>2': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '3>0': [
    [0, 0],
    [-1, 0],
    [-1, -1],
    [0, 2],
    [-1, 2],
  ],
  '0>3': [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, -2],
    [1, -2],
  ],
};
/** Wall kicks for I. */
export const KICKS_I: Readonly<Partial<Record<Transition, readonly Offset[]>>> = {
  '0>1': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  '1>0': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  '1>2': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
  '2>1': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '2>3': [
    [0, 0],
    [2, 0],
    [-1, 0],
    [2, 1],
    [-1, -2],
  ],
  '3>2': [
    [0, 0],
    [-2, 0],
    [1, 0],
    [-2, -1],
    [1, 2],
  ],
  '3>0': [
    [0, 0],
    [1, 0],
    [-2, 0],
    [1, -2],
    [-2, 1],
  ],
  '0>3': [
    [0, 0],
    [-1, 0],
    [2, 0],
    [-1, 2],
    [2, -1],
  ],
};

const cellsOf = (t: PieceType, r: Rotation): readonly Offset[] => CELLS[t][r] ?? [];

/** Whether piece `t` in rotation `r` at (x, y) is inside the walls and floor and overlaps nothing. */
export function fits(b: Board, t: PieceType, r: Rotation, x: number, y: number): boolean {
  for (const [c, rr] of cellsOf(t, r)) {
    const cx = x + c;
    const cy = y - rr;
    if (cx < 0 || cx >= W || cy < 0) return false;
    if (cy < H && cellAt(b, cx, cy) !== EMPTY) return false;
  }
  return true;
}

/** The board cells piece `t` covers, in cell-index order. */
export const cellsAt = (t: PieceType, r: Rotation, x: number, y: number): [number, number][] =>
  cellsOf(t, r).map(([c, rr]) => [x + c, y - rr]);

/** Where a piece appears: the top two visible rows, centred; O and I sit one column right. */
export function spawnPos(t: PieceType): { x: number; y: number } {
  if (t === 'O') return { x: 4, y: 19 };
  if (t === 'I') return { x: 3, y: 20 };
  return { x: 3, y: 19 };
}

/** Rotates `p` in place by `dir` (1 clockwise, -1 counter-clockwise), trying each kick in turn. */
export function tryRotate(b: Board, p: ActivePiece, dir: 1 | -1): boolean {
  if (p.t === 'O') return false;
  const to = ((p.r + dir + 4) % 4) as Rotation;
  const kicks = (p.t === 'I' ? KICKS_I : KICKS_JLSTZ)[`${p.r}>${to}`] ?? [];
  for (const [dx, dy] of kicks) {
    if (fits(b, p.t, to, p.x + dx, p.y + dy)) {
      p.r = to;
      p.x += dx;
      p.y += dy;
      return true;
    }
  }
  return false;
}

/**
 * The T-spin test for a T whose box top-left is (x, y): at least three of the four corners of its
 * 3 × 3 box are filled or outside the board. The caller checks the last move was a rotation.
 */
export function tSpinCorners(b: Board, x: number, y: number): boolean {
  let n = 0;
  for (const [dx, dy] of [
    [0, 0],
    [2, 0],
    [0, -2],
    [2, -2],
  ] as const) {
    const cx = x + dx;
    const cy = y + dy;
    if (cx < 0 || cx >= W || cy < 0 || (cy < H && cellAt(b, cx, cy) !== EMPTY)) n++;
  }
  return n >= 3;
}
