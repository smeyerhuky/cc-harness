import { emptyBoard, H, mulberry32, snapshot, W } from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { decodeBoard, encodeBoard, MAX_ENCODED_BOARD } from './board-codec';
import { ProtocolError } from './errors';

const CELLS = '.IOTSZJLX1234';
const EMPTY = snapshot(emptyBoard());

/** Rows from the floor up, padded to a full snapshot. */
const boardOf = (...rows: string[]) => rows.join('').padEnd(W * H, '.');

describe('board encoding', () => {
  it('encodes an empty board as a single character', () => {
    expect(encodeBoard(EMPTY)).toBe('r');
    expect(decodeBoard('r')).toBe(EMPTY);
  });

  it('run-length encodes a garbage stack in a few dozen bytes', () => {
    const b = boardOf(
      ...Array.from({ length: 12 }, () => 'XXXX.XXXXX'),
      'II..OOT...',
      '....T.....',
    );
    const wire = encodeBoard(b);
    expect(wire.startsWith('r')).toBe(true);
    expect(wire.length).toBeLessThan(80);
    expect(decodeBoard(wire)).toBe(b);
  });

  it('writes gems as letters so run lengths stay unambiguous', () => {
    const b = boardOf('11122.4433', 'XXXXXXXXXX');
    const wire = encodeBoard(b);
    expect(wire).toBe('ra3b2.d2c2X10');
    expect(decodeBoard(wire)).toBe(b);
  });

  it('keeps any full board under 200 bytes, packing it when runs would be longer', () => {
    const rng = mulberry32(99);
    for (let n = 0; n < 500; n++) {
      let s = '';
      for (let i = 0; i < W * H; i++) s += CELLS.charAt(1 + Math.floor(rng() * 12));
      const wire = encodeBoard(s);
      expect(wire.length).toBeLessThanOrEqual(MAX_ENCODED_BOARD);
      expect(wire.length).toBeLessThan(200);
      expect(decodeBoard(wire)).toBe(s);
    }
    expect(MAX_ENCODED_BOARD).toBe(161);
  });

  it('round-trips boards of every height and mix', () => {
    const rng = mulberry32(7);
    for (let n = 0; n < 500; n++) {
      const height = Math.floor(rng() * (H + 1));
      let s = '';
      for (let i = 0; i < height * W; i++) {
        const r = rng();
        s += r < 0.3 ? '.' : r < 0.7 ? 'X' : CELLS.charAt(1 + Math.floor(rng() * 12));
      }
      const b = s.padEnd(W * H, '.');
      expect(decodeBoard(encodeBoard(b))).toBe(b);
    }
  });

  it('refuses to encode something that is not a snapshot', () => {
    expect(() => encodeBoard('...')).toThrow(RangeError);
    expect(() => encodeBoard('Q'.repeat(W * H))).toThrow(RangeError);
  });

  it.each([
    ['an unknown format', 'z12'],
    ['an unknown cell', 'rQ'],
    ['a run length with a leading zero', 'rX05'],
    ['a run length of four digits', 'rX1000'],
    ['more than 240 cells', 'rX200.41'],
    ['a packed cell value above 12', 'p__'],
    ['a packed body of impossible length', 'pAAAAA'],
    ['a packed character outside base64url', 'pA*'],
    ['too long', `r${'X.'.repeat(81)}`],
    ['empty', ''],
  ])('rejects %s', (_, wire) => {
    expect(() => decodeBoard(wire)).toThrow(ProtocolError);
  });
});
