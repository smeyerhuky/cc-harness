/**
 * The engine's seeded generators. Every random choice that decides a board (the piece sequence,
 * gems, garbage holes, the bot) draws from one of these streams, so the same seed always gives the
 * same match (kb/design/architecture.md, "Determinism contract").
 */
export type Rng = () => number;

/** A 128-bit seed: four 32-bit words. */
export type Seed128 = readonly [number, number, number, number];

/**
 * A match's dealing seed: a number for local and replayed matches, or 128 bits for an online
 * match, whose dealing must stay secret from the players (GD-TICKET-030).
 */
export type Seed = number | Seed128;

/** mulberry32: a small, fast 32-bit generator, for every stream a player may know the seed of. */
export function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rotl = (x: number, k: number) => (x << k) | (x >>> (32 - k));

/**
 * xoshiro128** (Blackman and Vigna): 128 bits of state, for the dealing an online match keeps
 * secret. A 32-bit seed can be found by trying them all against the few bags a player has seen,
 * which would show them every piece to come; 128 bits can't be.
 */
export function xoshiro128ss(seed: Seed128): Rng {
  let [s0, s1, s2, s3] = seed;
  // An all-zero state only ever gives zeros.
  if ((s0 | s1 | s2 | s3) === 0) s0 = 1;
  return () => {
    const out = Math.imul(rotl(Math.imul(s1, 5), 7), 9);
    const t = s1 << 9;
    s2 ^= s0;
    s3 ^= s1;
    s1 ^= s2;
    s0 ^= s3;
    s2 ^= t;
    s3 = rotl(s3, 11);
    return (out >>> 0) / 4294967296;
  };
}

/** A generator for `seed`, with each 32-bit word of it XORed with `salt` first. */
export function seeded(seed: Seed, salt = 0): Rng {
  if (typeof seed === 'number') return mulberry32((seed ^ salt) >>> 0);
  const [a, b, c, d] = seed;
  return xoshiro128ss([a ^ salt, b ^ salt, c ^ salt, d ^ salt]);
}
