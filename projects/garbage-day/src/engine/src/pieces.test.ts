import { describe, expect, it } from 'vitest';
import { emptyBoard, pieceCell, setCell } from './board';
import { H, PIECE_TYPES, VIS } from './constants';
import {
  type ActivePiece,
  CELLS,
  cellsAt,
  fits,
  KICKS_I,
  KICKS_JLSTZ,
  type Rotation,
  spawnPos,
  tryRotate,
  tSpinCorners,
} from './pieces';
import { boardFrom } from './testing';

const key = (cells: readonly (readonly [number, number])[]): string =>
  cells
    .map(([x, y]) => `${x},${y}`)
    .sort()
    .join(' ');

describe('pieces', () => {
  it('has four cells in every rotation, and four rotations bring a piece back', () => {
    for (const t of PIECE_TYPES) {
      const states = CELLS[t];
      expect(states).toHaveLength(4);
      for (const s of states) expect(s).toHaveLength(4);
    }
    expect(key(CELLS.T[0] ?? [])).toBe('0,1 1,0 1,1 2,1');
    expect(key(CELLS.T[1] ?? [])).toBe('1,0 1,1 1,2 2,1');
    expect(key(CELLS.T[2] ?? [])).toBe('0,1 1,1 1,2 2,1');
    expect(key(CELLS.T[3] ?? [])).toBe('0,1 1,0 1,1 1,2');
    expect(key(CELLS.I[1] ?? [])).toBe('2,0 2,1 2,2 2,3');
  });

  it.each([
    ['I', '3,19 4,19 5,19 6,19'],
    ['O', '4,18 4,19 5,18 5,19'],
    ['T', '3,18 4,18 4,19 5,18'],
    ['S', '3,18 4,18 4,19 5,19'],
    ['Z', '3,19 4,18 4,19 5,18'],
    ['J', '3,18 3,19 4,18 5,18'],
    ['L', '3,18 4,18 5,18 5,19'],
  ] as const)('spawns %s in the top two visible rows, centred', (t, cells) => {
    const sp = spawnPos(t);
    const at = cellsAt(t, 0, sp.x, sp.y);
    expect(key(at)).toBe(cells);
    expect(at.every(([, y]) => y < VIS && y >= VIS - 2)).toBe(true);
  });

  it('fits inside the walls and floor, not over blocks, and may reach the hidden rows', () => {
    const b = boardFrom(['....X.....']);
    expect(fits(b, 'O', 0, 0, 1)).toBe(true);
    expect(fits(b, 'O', 0, -1, 1)).toBe(false);
    expect(fits(b, 'O', 0, 9, 1)).toBe(false);
    expect(fits(b, 'O', 0, 0, 0)).toBe(false);
    expect(fits(b, 'O', 0, 3, 1)).toBe(false);
    expect(fits(b, 'I', 1, 0, H + 1)).toBe(true);
  });

  it('does not rotate O', () => {
    const p: ActivePiece = { t: 'O', r: 0, x: 4, y: 10, gem: null };
    expect(tryRotate(emptyBoard(), p, 1)).toBe(false);
    expect(p.r).toBe(0);
  });

  it('leaves the piece alone when no kick fits', () => {
    const b = boardFrom(Array.from({ length: 20 }, () => 'XXX...XXXX'));
    const p: ActivePiece = { t: 'I', r: 1, x: 2, y: 10, gem: null };
    expect(tryRotate(b, p, 1)).toBe(false);
    expect(p).toMatchObject({ r: 1, x: 2, y: 10 });
  });

  // For every kick of every transition: fill the board except where the rotated piece lands with
  // that kick, so every earlier kick is blocked and this one is the first that fits.
  const tables = [
    ['T', KICKS_JLSTZ],
    ['I', KICKS_I],
  ] as const;
  for (const [t, table] of tables) {
    for (const [transition, kicks] of Object.entries(table)) {
      const [from, to] = transition.split('>').map(Number) as [Rotation, Rotation];
      const dir = (to - from + 4) % 4 === 1 ? 1 : -1;
      kicks?.forEach(([dx, dy], k) => {
        it(`kicks ${t} ${transition} by test ${k + 1} (${dx}, ${dy})`, () => {
          const x = 3;
          const y = 12;
          const b = emptyBoard();
          b.fill(pieceCell('Z'));
          for (const [cx, cy] of cellsAt(t, to, x + dx, y + dy)) setCell(b, cx, cy, 0);
          const p: ActivePiece = { t, r: from, x, y, gem: null };
          expect(tryRotate(b, p, dir)).toBe(true);
          expect(p).toMatchObject({ r: to, x: x + dx, y: y + dy });
        });
      });
    }
  }

  it('uses the same kicks for J, L, S, T and Z', () => {
    for (const t of ['J', 'L', 'S', 'T', 'Z'] as const) {
      const p: ActivePiece = { t, r: 1, x: -1, y: 2, gem: null };
      // Against the left wall, rotating 1>0 needs kick test 2, one column right.
      expect(tryRotate(emptyBoard(), p, -1)).toBe(true);
      expect(p).toMatchObject({ r: 0, x: 0, y: 2 });
    }
  });

  it('counts a T-spin when three of the four corners are filled or outside the board', () => {
    const slot = ['X.........', '...XXXXXXX', '....XXXXXX'];
    expect(tSpinCorners(boardFrom(slot), 0, 2)).toBe(false);
    expect(tSpinCorners(boardFrom(['XX........', ...slot.slice(1)]), 0, 2)).toBe(false);
    expect(tSpinCorners(boardFrom(['..X.......', 'X..XXXXXXX', 'X.X.XXXXXX']), 0, 2)).toBe(true);
    // Outside the board counts: against the left wall only one real corner is needed.
    expect(tSpinCorners(emptyBoard(), -1, 3)).toBe(false);
    expect(tSpinCorners(boardFrom(['.X........', '..........']), -1, 3)).toBe(true);
    // So does the floor.
    expect(tSpinCorners(emptyBoard(), -1, 1)).toBe(true);
  });
});
