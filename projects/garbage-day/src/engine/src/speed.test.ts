import { describe, expect, it } from 'vitest';
import { MAX_BOOSTED_LEVEL } from './constants';
import { DEFAULT_RULES } from './rules';
import { FIXED_ONE, gravity, levelAt, softGravity } from './speed';
import { ROWS_PER_TICK } from './speed-table';
import { generateSpeedTable, secondsPerRow } from './speed-table-gen';

const none = { sudden: false, rush: false };

describe('the speed table', () => {
  it('is the committed output of the generator', () => {
    expect(ROWS_PER_TICK).toEqual(generateSpeedTable());
  });

  it('covers levels 1 to 20 and gets faster at every level', () => {
    expect(ROWS_PER_TICK).toHaveLength(MAX_BOOSTED_LEVEL);
    for (let l = 2; l <= MAX_BOOSTED_LEVEL; l++) expect(gravity(l)).toBeGreaterThan(gravity(l - 1));
  });

  it('keeps every level within a hair of the formula, never slower', () => {
    for (let l = 1; l <= MAX_BOOSTED_LEVEL; l++) {
      const exact = FIXED_ONE / (secondsPerRow(l) * 60);
      expect(gravity(l)).toBeGreaterThanOrEqual(exact);
      expect(gravity(l) - exact).toBeLessThan(1);
    }
  });

  it('drops one row every 60 ticks at level 1, and about 2.4 rows a tick at level 15', () => {
    let g = 0;
    const falls: number[] = [];
    for (let t = 1; t <= 180; t++) {
      g += gravity(1);
      if (g >= FIXED_ONE) {
        g -= FIXED_ONE;
        falls.push(t);
      }
    }
    expect(falls).toEqual([60, 120, 180]);
    expect(gravity(15) / FIXED_ONE).toBeCloseTo(2.36, 2);
  });

  it('soft-drops at 20 times gravity, and at least half a row per tick', () => {
    expect(softGravity(gravity(1), 20)).toBe(FIXED_ONE / 2);
    expect(softGravity(gravity(10), 20)).toBe(gravity(10) * 20);
  });
});

describe('levels', () => {
  it('rise by one every 15 s of active play, up to 15', () => {
    expect(levelAt(0, DEFAULT_RULES, none)).toBe(1);
    expect(levelAt(899, DEFAULT_RULES, none)).toBe(1);
    expect(levelAt(900, DEFAULT_RULES, none)).toBe(2);
    expect(levelAt(14 * 900, DEFAULT_RULES, none)).toBe(15);
    expect(levelAt(60 * 900, DEFAULT_RULES, none)).toBe(15);
  });

  it('add 4 for Sudden death and 4 for Rush, up to 20', () => {
    const at230 = 150 * 60;
    expect(levelAt(at230, DEFAULT_RULES, { sudden: true, rush: false })).toBe(15);
    expect(levelAt(14 * 900, DEFAULT_RULES, { sudden: true, rush: false })).toBe(19);
    expect(levelAt(0, DEFAULT_RULES, { sudden: false, rush: true })).toBe(5);
    expect(levelAt(14 * 900, DEFAULT_RULES, { sudden: true, rush: true })).toBe(20);
  });
});
