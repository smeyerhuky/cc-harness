import { handle } from '@garbage-day/protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HANDLE_WORDS, randomHandle, secureInt } from './handles';

describe('randomHandle', () => {
  it('every word, with the longest number, passes the protocol handle schema', () => {
    for (const adj of HANDLE_WORDS.adjectives) {
      for (const bird of HANDLE_WORDS.birds) {
        const h = `${adj} ${bird} 99`;
        expect({ h, ok: handle.safeParse(h).success }).toEqual({ h, ok: true });
      }
    }
  });

  it('has forty of each, none repeated', () => {
    for (const list of [HANDLE_WORDS.adjectives, HANDLE_WORDS.birds]) {
      expect(list).toHaveLength(40);
      expect(new Set(list).size).toBe(40);
    }
  });

  it('picks from the ends of both lists and numbers 1 to 99', () => {
    expect(randomHandle(() => 0)).toBe(`${HANDLE_WORDS.adjectives[0]} ${HANDLE_WORDS.birds[0]} 1`);
    expect(randomHandle((n) => n - 1)).toBe(
      `${HANDLE_WORDS.adjectives.at(-1)} ${HANDLE_WORDS.birds.at(-1)} 99`,
    );
  });

  it('makes a valid handle from the secure generator', () => {
    for (let i = 0; i < 50; i++) expect(handle.safeParse(randomHandle()).success).toBe(true);
  });
});

describe('secureInt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** Makes the secure generator return these 32-bit values in turn. */
  const draws = (...values: number[]) =>
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((a) => {
      if (a instanceof Uint32Array) a[0] = values.shift() ?? 0;
      return a;
    });

  it('keeps only the bits it needs, and draws again when they are out of range', () => {
    const spy = draws(0xffff_ff27, 0xffff_ffff, 0x0000_0040 + 39);
    // 40 needs 6 bits: 0x…27 keeps 39, which is in range.
    expect(secureInt(40)).toBe(39);
    // 0x…ff keeps 63, out of range, so it draws again: 0x67 keeps 39.
    expect(secureInt(40)).toBe(39);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('covers the whole range and nothing outside it', () => {
    for (const n of [1, 2, 40, 99]) {
      const seen = new Set<number>();
      for (let i = 0; i < 2000; i++) seen.add(secureInt(n));
      expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
    }
  });
});
