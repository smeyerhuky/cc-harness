import { handle } from '@garbage-day/protocol';
import { describe, expect, it } from 'vitest';
import { HANDLE_WORDS, randomHandle } from './handles';

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
    const at = (...rs: number[]) => {
      let i = 0;
      return () => rs[i++] ?? 0;
    };
    expect(randomHandle(at(0, 0, 0))).toBe(
      `${HANDLE_WORDS.adjectives[0]} ${HANDLE_WORDS.birds[0]} 1`,
    );
    expect(randomHandle(at(0.9999, 0.9999, 0.9999))).toBe(
      `${HANDLE_WORDS.adjectives.at(-1)} ${HANDLE_WORDS.birds.at(-1)} 99`,
    );
  });

  it('makes a valid handle from the secure generator', () => {
    for (let i = 0; i < 50; i++) expect(handle.safeParse(randomHandle()).success).toBe(true);
  });
});
