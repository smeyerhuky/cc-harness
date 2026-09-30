import { describe, expect, it } from 'vitest';
import {
  cellAt,
  clearRows,
  dropBottomRows,
  emptyBoard,
  fullRows,
  GARBAGE,
  gemCell,
  gemPower,
  height,
  holes,
  isEmpty,
  parse,
  pieceCell,
  snapshot,
} from './board';
import { H, W } from './constants';
import { boardFrom, rowsOf } from './testing';

describe('board', () => {
  it('is 10 wide and 24 high: 20 visible rows plus 4 hidden', () => {
    expect([W, H]).toEqual([10, 24]);
    expect(emptyBoard()).toHaveLength(240);
  });

  it('round-trips through the proof-of-concept snapshot format, floor row first', () => {
    const b = boardFrom(['.....T....', 'IOTSZJLX12', '34........']);
    const s = snapshot(b);
    expect(s.slice(0, 20)).toBe('34........IOTSZJLX12');
    expect(s).toHaveLength(240);
    expect(parse(s)).toEqual(b);
    expect(cellAt(b, 5, 2)).toBe(pieceCell('T'));
    expect(cellAt(b, 7, 1)).toBe(GARBAGE);
    expect(gemPower(cellAt(b, 8, 1))).toBe('shield');
    expect(gemPower(cellAt(b, 1, 0))).toBe('rush');
    expect(gemPower(gemCell('fog'))).toBe('fog');
    expect(gemPower(pieceCell('L'))).toBeNull();
  });

  it('rejects malformed snapshots', () => {
    expect(() => parse('...')).toThrow(/240 cells/);
    expect(() => parse('Q'.repeat(240))).toThrow(/Unknown cell/);
  });

  it('finds full rows and clears them, dropping the rows above', () => {
    const b = boardFrom(['..T.......', 'XXXXXXXXXX', '.J........', 'LLLLLLLLLL']);
    expect(fullRows(b)).toEqual([0, 2]);
    expect(rowsOf(clearRows(b, [0, 2]))).toEqual([
      '..........',
      '..........',
      '..T.......',
      '.J........',
    ]);
  });

  it('drops the bottom rows for a bomb', () => {
    const b = boardFrom(['...S......', 'XXXX.XXXXX', 'XXXXX.XXXX']);
    expect(rowsOf(dropBottomRows(b, 2))).toEqual([
      '..........',
      '..........',
      '..........',
      '...S......',
    ]);
  });

  it('measures height and holes', () => {
    expect(height(emptyBoard())).toBe(0);
    expect(isEmpty(emptyBoard())).toBe(true);
    const b = boardFrom(['.Z........', '.Z..O.....', '.....O....', 'XX.X.XXXXX']);
    expect(height(b)).toBe(4);
    expect(holes(b)).toBe(3);
    expect(isEmpty(b)).toBe(false);
  });
});
