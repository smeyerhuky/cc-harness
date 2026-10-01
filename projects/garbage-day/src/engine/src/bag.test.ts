import { describe, expect, it } from 'vitest';
import { Dealer } from './bag';
import { PIECE_TYPES, POWER_KINDS } from './constants';

describe('Dealer', () => {
  it('deals the proof of concept’s bags and gems for its showcase seed', () => {
    const d = new Dealer(0xcdd72, 0.16);
    // From spikes/proof-of-concept/live/live-engine.js: new Match({ seed: 0xCDD72 }).do.bag(0..1).
    expect(d.bag(0)).toEqual([
      { t: 'Z', gem: null },
      { t: 'T', gem: null },
      { t: 'L', gem: { i: 3, type: 'shield' } },
      { t: 'J', gem: null },
      { t: 'I', gem: null },
      { t: 'O', gem: null },
      { t: 'S', gem: null },
    ]);
    expect(d.bag(1).map((p) => p.t)).toEqual(['J', 'T', 'Z', 'S', 'L', 'O', 'I']);
  });

  it('deals from a 128-bit seed: seven-piece bags, the same for the same seed', () => {
    const seed = [0x9e3779b9, 0x243f6a88, 0xb7e15162, 0xdeadbeef] as const;
    const [a, b] = [new Dealer(seed, 0.16), new Dealer(seed, 0.16)];
    for (let k = 0; k < 20; k++) {
      expect(
        a
          .bag(k)
          .map((p) => p.t)
          .sort(),
      ).toEqual([...PIECE_TYPES].sort());
      expect(b.bag(k)).toEqual(a.bag(k));
    }
    const other = new Dealer([0x9e3779b9, 0x243f6a88, 0xb7e15162, 0xdeadbeee], 0.16);
    expect([0, 1, 2].map((k) => other.bag(k))).not.toEqual([0, 1, 2].map((k) => a.bag(k)));
  });

  it('puts all seven pieces in every bag', () => {
    const d = new Dealer(42, 0.16);
    for (let k = 0; k < 100; k++) {
      expect(
        d
          .bag(k)
          .map((p) => p.t)
          .sort(),
      ).toEqual([...PIECE_TYPES].sort());
    }
  });

  it('deals the same bags for the same seed, in any order of asking', () => {
    const a = new Dealer(7, 0.16);
    const b = new Dealer(7, 0.16);
    const late = b.bag(5);
    expect(a.bag(5)).toEqual(late);
    expect(a.bag(0)).toEqual(b.bag(0));
    expect(new Dealer(8, 0.16).bag(0)).not.toEqual(a.bag(0));
  });

  it('hands out copies, so a player cannot change the other’s bag', () => {
    const d = new Dealer(1, 1);
    const first = d.bag(0);
    first.pop();
    expect(d.bag(0)).toHaveLength(7);
  });

  it('puts a gem on about one piece in six, on one of its four cells', () => {
    const d = new Dealer(3, 0.16);
    let gems = 0;
    const kinds = new Set<string>();
    for (let k = 0; k < 1000; k++) {
      for (const p of d.bag(k)) {
        if (!p.gem) continue;
        gems++;
        kinds.add(p.gem.type);
        expect(p.gem.i).toBeGreaterThanOrEqual(0);
        expect(p.gem.i).toBeLessThan(4);
      }
    }
    expect(gems / 7000).toBeGreaterThan(0.14);
    expect(gems / 7000).toBeLessThan(0.18);
    expect([...kinds].sort()).toEqual([...POWER_KINDS].sort());
  });

  it('deals no gems when they are off, without changing the pieces', () => {
    const off = new Dealer(3, 0);
    const on = new Dealer(3, 0.16);
    for (let k = 0; k < 20; k++) {
      expect(off.bag(k).every((p) => p.gem === null)).toBe(true);
      expect(off.bag(k).map((p) => p.t)).toEqual(on.bag(k).map((p) => p.t));
    }
  });
});
