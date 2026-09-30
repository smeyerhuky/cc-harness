import { describe, expect, it } from 'vitest';
import { mulberry32 } from './rng';

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
