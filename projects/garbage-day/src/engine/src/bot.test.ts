import { describe, expect, it } from 'vitest';
import { Bot, botConfig } from './bot';
import { TPS } from './constants';
import { LocalMatch } from './local-match';

const match = (seed: number, a: [number, number], b: [number, number] | null) => {
  const m = new LocalMatch({ seed, latencyMs: [35, 55] });
  m.controllers[0] = new Bot(m.players[0], seed, botConfig(...a));
  if (b) m.controllers[1] = new Bot(m.players[1], seed, botConfig(...b));
  return m.start();
};

describe('bot settings', () => {
  it('maps skill 1 and speed 1 to the proof of concept’s rookie', () => {
    expect(botConfig(1, 1)).toEqual({
      noise: 1.4,
      style: 'safe',
      hold: false,
      think: 26,
      jitter: 14,
      move: 9,
    });
  });

  it('maps skill 10 and speed 10 past its pro', () => {
    expect(botConfig(10, 10)).toEqual({
      noise: 0.05,
      style: 'fourLine',
      hold: true,
      think: 4,
      jitter: 4,
      move: 2,
    });
  });

  it('moves from safe to mixed to four-line play as skill rises, and clamps settings to 1–10', () => {
    expect([1, 3, 4, 6, 7, 10].map((s) => botConfig(s, 5).style)).toEqual([
      'safe',
      'safe',
      'mixed',
      'mixed',
      'fourLine',
      'fourLine',
    ]);
    expect(botConfig(0, 99)).toEqual(botConfig(1, 10));
    expect(botConfig(5.4, 5.6)).toEqual(botConfig(5, 6));
  });
});

describe('bot play', () => {
  it('beats the weakest, slowest bot at skill 10 and speed 10 in at least 9 of 10 matches', () => {
    let wins = 0;
    for (let k = 0; k < 10; k++) {
      const m = match(1000 + k, [10, 10], [1, 1]).run(60 * 60 * 15);
      if (m.referee.result?.winner === 0) wins++;
    }
    expect(wins).toBeGreaterThanOrEqual(9);
  }, 60_000);

  it('places pieces faster at a higher speed setting', () => {
    const placed = (speed: number) =>
      match(77, [5, speed], null).run(40 * TPS).players[0].stats.pieces;
    expect(placed(10)).toBeGreaterThan(placed(5));
    expect(placed(5)).toBeGreaterThan(placed(1));
  });

  it('clears lines on its own, and uses its power-ups', () => {
    const m = match(5, [8, 8], null).run(120 * TPS);
    const s = m.players[0].stats;
    expect(s.lines).toBeGreaterThan(20);
    expect(s.powersUsed).toBeGreaterThan(0);
  });
});
