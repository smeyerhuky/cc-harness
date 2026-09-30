import { PIECE_TYPES, POWER_KINDS } from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { contrast, luminance } from './contrast';
import {
  CONTRAST_PAIRS,
  PIECE_COLOR,
  PIECE_MARK,
  POWER_COLOR,
  THEMES,
  resolve,
  tokensCss,
} from './tokens';

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.48, 2);
    expect(luminance('#FFFFFF')).toBe(1);
  });
});

describe('the colour tokens', () => {
  for (const theme of THEMES) {
    for (const p of CONTRAST_PAIRS) {
      it(`${theme}, ${p.on}: ${p.fg} on ${p.bg} reaches ${p.min}:1 (${p.use})`, () => {
        const ratio = contrast(resolve(p.fg, theme, p.on), resolve(p.bg, theme, p.on));
        expect(ratio).toBeGreaterThanOrEqual(p.min);
      });
    }
  }

  it('gives every piece and power a colour, and every piece a mark of its own', () => {
    expect(Object.keys(PIECE_COLOR).sort()).toEqual([...PIECE_TYPES].sort());
    expect(Object.keys(POWER_COLOR).sort()).toEqual([...POWER_KINDS].sort());
    expect(new Set(Object.values(PIECE_MARK)).size).toBe(PIECE_TYPES.length);
    expect(new Set(Object.values(PIECE_COLOR)).size).toBe(PIECE_TYPES.length);
  });

  it('uses none of the guideline piece colours', () => {
    const guideline = ['#00FFFF', '#FFFF00', '#800080', '#00FF00', '#FF0000', '#0000FF', '#FFA500'];
    for (const c of Object.values(PIECE_COLOR)) expect(guideline).not.toContain(c.toUpperCase());
  });
});

describe('tokens.css', () => {
  it('is generated from tokens.ts (pnpm --filter @garbage-day/ui tokens:update)', async () => {
    await expect(tokensCss()).toMatchFileSnapshot('./tokens.css');
  });
});
