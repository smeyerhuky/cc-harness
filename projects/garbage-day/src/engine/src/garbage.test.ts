import { describe, expect, it } from 'vitest';
import { snapshot } from './board';
import { cancelGarbage, landGarbage, type MeterEntry, meterReady, meterTotal } from './garbage';
import { boardFrom, rowsOf } from './testing';

const holesFrom = (...cols: number[]) => {
  let i = 0;
  return () => (cols[i++ % cols.length] ?? 0) / 10 + 0.05;
};

describe('cancelling', () => {
  it('cancels the oldest waiting attack first and sends the rest', () => {
    const meter: MeterEntry[] = [
      { id: 1, rows: 3, ready: 0 },
      { id: 2, rows: 2, ready: 0 },
    ];
    expect(cancelGarbage(meter, 4)).toEqual({ sent: 0, cancelled: 4 });
    expect(meter).toEqual([{ id: 2, rows: 1, ready: 0 }]);
    expect(cancelGarbage(meter, 6)).toEqual({ sent: 5, cancelled: 1 });
    expect(meter).toEqual([]);
    expect(cancelGarbage(meter, 2)).toEqual({ sent: 2, cancelled: 0 });
  });

  it('totals the meter, and what is ready at a tick', () => {
    const meter: MeterEntry[] = [
      { id: 1, rows: 3, ready: 10 },
      { id: 2, rows: 2, ready: 40 },
    ];
    expect(meterTotal(meter)).toBe(5);
    expect(meterReady(meter, 9)).toBe(0);
    expect(meterReady(meter, 10)).toBe(3);
    expect(meterReady(meter, 40)).toBe(5);
  });
});

describe('landing', () => {
  const stack = ['..........', '....T.....', '...TTT....'];

  it('lands nothing before the attack is ready', () => {
    const meter: MeterEntry[] = [{ id: 1, rows: 2, ready: 30 }];
    const r = landGarbage(boardFrom(stack), meter, 29, 8, holesFrom(0));
    expect(r.landed).toBe(0);
    expect(snapshot(r.board)).toBe(snapshot(boardFrom(stack)));
  });

  it('pushes the stack up with ready rows that share one hole per attack', () => {
    const meter: MeterEntry[] = [
      { id: 1, rows: 2, ready: 30 },
      { id: 2, rows: 1, ready: 30 },
    ];
    const r = landGarbage(boardFrom(stack), meter, 30, 8, holesFrom(7, 2));
    expect(r).toMatchObject({ landed: 3, overflow: false });
    expect(rowsOf(r.board, 4)).toEqual([
      '....T.....',
      '...TTT....',
      'XXXXXXX.XX',
      'XXXXXXX.XX',
      'XX.XXXXXXX',
    ]);
    expect(meter).toEqual([]);
  });

  it('lands at most 8 rows per lock and keeps the attack’s hole for the rest', () => {
    const meter: MeterEntry[] = [{ id: 1, rows: 10, ready: 0 }];
    const holes = holesFrom(4, 9);
    const first = landGarbage(boardFrom([]), meter, 1, 8, holes);
    expect(first.landed).toBe(8);
    expect(meter).toEqual([{ id: 1, rows: 2, ready: 0, hole: 4 }]);
    const second = landGarbage(first.board, meter, 2, 8, holes);
    expect(second.landed).toBe(2);
    expect(rowsOf(second.board, 9).every((row) => row === 'XXXX.XXXXX')).toBe(true);
  });

  it('stops at an attack that is not ready yet, even with room under the cap', () => {
    const meter: MeterEntry[] = [
      { id: 1, rows: 1, ready: 0 },
      { id: 2, rows: 1, ready: 50 },
    ];
    expect(landGarbage(boardFrom([]), meter, 10, 8, holesFrom(0)).landed).toBe(1);
    expect(meter).toEqual([{ id: 2, rows: 1, ready: 50 }]);
  });

  it('overflows when landing pushes blocks beyond the hidden rows', () => {
    const tall = boardFrom(['....I.....', ...Array.from({ length: 23 }, () => '....I.....')]);
    const r = landGarbage(tall, [{ id: 1, rows: 1, ready: 0 }], 1, 8, holesFrom(0));
    expect(r.overflow).toBe(true);
    const short = boardFrom(Array.from({ length: 23 }, () => '....I.....'));
    expect(landGarbage(short, [{ id: 1, rows: 1, ready: 0 }], 1, 8, holesFrom(0)).overflow).toBe(
      false,
    );
  });
});
