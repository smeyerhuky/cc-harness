import { describe, expect, it } from 'vitest';
import { mulberry32, seeded, xoshiro128ss } from './rng';

describe('mulberry32', () => {
  it('matches the proof of concept for its showcase seed', () => {
    const rng = mulberry32(0xcdd72);
    expect([rng(), rng(), rng()]).toEqual(EXPECTED_CDD72);
  });

  it('gives the same stream for the same seed and a different one for another seed', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const c = mulberry32(43);
    const first = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(first);
    expect(Array.from({ length: 5 }, c)).not.toEqual(first);
  });

  it('stays in [0, 1)', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 10_000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

// First three draws of spikes/proof-of-concept/live/live-engine.js mulberry32(0xCDD72).
const EXPECTED_CDD72 = [0.47425999538972974, 0.2358820994850248, 0.1303092280868441];

describe('xoshiro128**', () => {
  it('matches the reference implementation', () => {
    // The C reference's first eight outputs from the state {1, 2, 3, 4}, as fractions of 2^32.
    const rng = xoshiro128ss([1, 2, 3, 4]);
    const words = Array.from({ length: 8 }, () => rng() * 4294967296);
    expect(words).toEqual([
      11520, 0, 5927040, 70819200, 2031721883, 1637235492, 1287239034, 3734860849,
    ]);
    const big = xoshiro128ss([0x9e3779b9, 0x243f6a88, 0xb7e15162, 0xdeadbeef]);
    expect(Array.from({ length: 4 }, () => big() * 4294967296)).toEqual([
      2463954730, 5524658, 74256371, 1905451993,
    ]);
  });

  it('never sticks at zero, and stays in [0, 1)', () => {
    const zero = xoshiro128ss([0, 0, 0, 0]);
    expect(Array.from({ length: 4 }, zero).some((x) => x > 0)).toBe(true);
    const rng = xoshiro128ss([5, 6, 7, 8]);
    for (let i = 0; i < 10_000; i++) {
      const x = rng();
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe('seeded', () => {
  it('is mulberry32 for a number, salted as the engine always salted it', () => {
    const a = seeded(0xcdd72, 0xc2b2ae35);
    const b = mulberry32((0xcdd72 ^ 0xc2b2ae35) >>> 0);
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b));
    expect(seeded(0xcdd72)()).toBe(EXPECTED_CDD72[0]);
  });

  it('is xoshiro128** for 128 bits, and a salt gives another stream', () => {
    const seed = [11, 22, 33, 44] as const;
    const plain = seeded(seed);
    const ref = xoshiro128ss(seed);
    expect(Array.from({ length: 5 }, plain)).toEqual(Array.from({ length: 5 }, ref));
    expect(Array.from({ length: 5 }, seeded(seed, 1))).not.toEqual(
      Array.from({ length: 5 }, seeded(seed)),
    );
  });
});
