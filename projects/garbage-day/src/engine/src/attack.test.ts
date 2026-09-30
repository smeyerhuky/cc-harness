import { describe, expect, it } from 'vitest';
import { scoreClear } from './attack';

const score = (
  lines: number,
  o: { tspin?: boolean; pc?: boolean; b2b?: boolean; combo?: number } = {},
) =>
  scoreClear({
    lines,
    tspin: o.tspin ?? false,
    perfectClear: o.pc ?? false,
    backToBack: o.b2b ?? false,
    combo: o.combo ?? 0,
  });

describe('the attack table', () => {
  it.each([
    [1, 0],
    [2, 1],
    [3, 2],
    [4, 4],
  ])('sends %i lines as %i rows', (lines, rows) => {
    expect(score(lines).clear.attack).toBe(rows);
  });

  it.each([
    [1, 2],
    [2, 4],
    [3, 6],
  ])('sends a T-spin clearing %i lines as %i rows', (lines, rows) => {
    expect(score(lines, { tspin: true }).clear.attack).toBe(rows);
  });

  it('adds one row for a difficult clear right after another', () => {
    expect(score(4, { b2b: true }).clear).toMatchObject({ attack: 5, b2b: true });
    expect(score(2, { tspin: true, b2b: true }).clear.attack).toBe(5);
    expect(score(3, { b2b: true }).clear).toMatchObject({ attack: 2, b2b: false });
    expect(score(4).clear.b2b).toBe(false);
  });

  it('marks four lines and T-spins as difficult, and nothing else', () => {
    expect(score(4).difficult).toBe(true);
    expect(score(1, { tspin: true }).difficult).toBe(true);
    expect(score(3).difficult).toBe(false);
  });

  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
    [6, 3],
    [7, 4],
    [8, 4],
    [9, 4],
    [10, 5],
    [14, 5],
  ])('adds the combo bonus for combo %i: %i rows', (combo, bonus) => {
    expect(score(1, { combo }).clear.attack).toBe(bonus);
  });

  it('sends at least 10 rows for a perfect clear, more if the clear is worth more', () => {
    expect(score(1, { pc: true }).clear).toMatchObject({ attack: 10, perfectClear: true });
    expect(score(4, { pc: true, b2b: true, combo: 3 }).clear.attack).toBe(10);
    expect(score(3, { tspin: true, pc: true, b2b: true, combo: 10 }).clear.attack).toBe(12);
  });
});
