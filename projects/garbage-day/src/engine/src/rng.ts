/**
 * mulberry32: a small, fast, seeded 32-bit generator. Every random choice that decides a board
 * (the piece sequence, gems, garbage holes, the bot) draws from one of these streams, so the same
 * seed always gives the same match (kb/design/architecture.md, "Determinism contract").
 */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
