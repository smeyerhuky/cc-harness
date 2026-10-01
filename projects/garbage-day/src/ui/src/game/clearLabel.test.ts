import { scoreClear, type Clear } from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { clearLabel, QUAD } from './clearLabel';

/** A clear scored by the engine itself, so the words follow its data. */
const clear = (
  lines: number,
  o: { tspin?: boolean; b2b?: boolean; combo?: number; pc?: boolean } = {},
) =>
  scoreClear({
    lines,
    tspin: o.tspin ?? false,
    perfectClear: o.pc ?? false,
    backToBack: o.b2b ?? false,
    combo: o.combo ?? 0,
  }).clear;

describe('clearLabel', () => {
  it('names each clear, calling four rows a Quad', () => {
    expect([1, 2, 3, 4].map((n) => clearLabel(clear(n))?.text)).toEqual([
      'Single',
      'Double',
      'Triple',
      'Quad',
    ]);
    expect(QUAD).toEqual({ one: 'Quad', many: 'Quads' });
  });

  it('names T-spins, back-to-backs and combos', () => {
    expect(clearLabel(clear(2, { tspin: true }))).toEqual({ text: 'T-spin Double', strong: true });
    expect(clearLabel(clear(4, { b2b: true }))?.text).toBe('B2B Quad');
    expect(clearLabel(clear(1, { combo: 2 }))).toEqual({
      text: 'Single · Combo ×3',
      strong: false,
    });
  });

  it('calls out a perfect clear above everything else', () => {
    expect(clearLabel(clear(4, { pc: true }))).toEqual({ text: 'Perfect clear', strong: true });
  });

  it('marks only the difficult clears as strong', () => {
    expect([1, 2, 3, 4].map((n) => clearLabel(clear(n))?.strong)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });

  it('says nothing for a lock that cleared nothing', () => {
    const none: Clear = {
      lines: 0,
      tspin: false,
      b2b: false,
      combo: 0,
      perfectClear: false,
      attack: 0,
    };
    expect(clearLabel(none)).toBeNull();
  });

  it('never uses the name the game avoids', () => {
    for (let lines = 1; lines <= 4; lines++) {
      for (const tspin of [false, true]) {
        for (const b2b of [false, true]) {
          expect(clearLabel(clear(lines, { tspin, b2b }))?.text).not.toMatch(/tetris/i);
        }
      }
    }
  });
});
