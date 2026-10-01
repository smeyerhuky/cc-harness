import { PIECE_TYPES, POWER_KINDS } from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { contrast, luminance } from './contrast';
import {
  CONTRAST_PAIRS,
  EFFECTS,
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

describe('the effects', () => {
  /** A translucent `rgb(r g b / a)` laid over an opaque hex colour, as hex. */
  const over = (effect: string, base: string): string => {
    const m = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(effect);
    if (!m) throw new Error(`not an rgb() effect: ${effect}`);
    const a = Number(m[4]);
    return `#${[1, 3, 5]
      .map((i, k) => {
        const under = parseInt(base.slice(i, i + 2), 16);
        const v = Math.round(Number(m[k + 1]) * a + under * (1 - a));
        return v.toString(16).padStart(2, '0');
      })
      .join('')}`;
  };

  it('blends as the browser does', () => {
    expect(over('rgb(255 255 255 / 0.5)', '#000000')).toBe('#808080');
  });

  // The slots' captions and the rival's "hidden" sit on the tint over the cabinet. A tint of 0.06
  // left the light theme's muted caption at 4.51:1 by this sum, and axe, blending in the
  // browser, found it under 4.5 (GD-TICKET-025): so a margin.
  for (const theme of THEMES) {
    it(`${theme}: stage text on a tinted tile keeps 4.6:1`, () => {
      const tile = over(EFFECTS.tint, resolve('cabinet', theme, 'stage'));
      for (const fg of ['muted', 'well-ink'] as const) {
        expect(contrast(resolve(fg, theme, 'stage'), tile)).toBeGreaterThanOrEqual(4.6);
      }
    });
  }
});

describe('tokens.css', () => {
  it('is generated from tokens.ts (pnpm --filter @garbage-day/ui tokens:update)', async () => {
    await expect(tokensCss()).toMatchFileSnapshot('./tokens.css');
  });
});
