import { describe, expect, it } from 'vitest';
import { DEFAULT_TIMING, InputController, TIMING_TICKS, toMs, toTicks } from './InputController';

const ticks = (c: InputController, n: number) => Array.from({ length: n }, () => c.tick());

describe('InputController', () => {
  it('acts once on a press and not again until pressed again', () => {
    const c = new InputController();
    c.down('hard');
    c.down('cw');
    expect(c.hasPending()).toBe(true);
    expect(c.tick()).toMatchObject({ hard: true, cw: true });
    expect(c.hasPending()).toBe(false);
    expect(c.tick()).toMatchObject({ hard: false, cw: false });
    c.down('hard');
    expect(c.tick().hard).toBe(false);
    c.up('hard');
    c.down('hard');
    expect(c.tick().hard).toBe(true);
  });

  it('soft-drops while held', () => {
    const c = new InputController();
    c.down('soft');
    expect(ticks(c, 3).every((i) => i.soft)).toBe(true);
    c.up('soft');
    expect(c.tick().soft).toBe(false);
  });

  it('moves once, waits the delay, then repeats at the rate (167 ms, 33 ms)', () => {
    const c = new InputController();
    c.down('right');
    const dx = ticks(c, 16).map((i) => i.dx);
    // One move now, a 10-tick delay, then one every 2 ticks.
    expect(dx).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0]);
  });

  it('follows the most recent direction, and falls back to one still held', () => {
    const c = new InputController();
    c.down('left');
    expect(c.tick().dx).toBe(-1);
    c.down('right');
    expect(c.tick().dx).toBe(1);
    c.up('right');
    expect(c.tick().dx).toBe(-1);
    c.up('left');
    expect(ticks(c, 12).every((i) => i.dx === 0)).toBe(true);
  });

  it('takes new timings in milliseconds, at least one tick each', () => {
    const c = new InputController();
    c.setTiming(50, 0);
    c.down('left');
    expect(ticks(c, 6).map((i) => i.dx)).toEqual([-1, 0, 0, -1, -1, -1]);
  });

  it('shows whole ticks as milliseconds that convert back exactly', () => {
    expect([toTicks(DEFAULT_TIMING.dasMs), toTicks(DEFAULT_TIMING.arrMs)]).toEqual([10, 2]);
    for (const { min, max } of Object.values(TIMING_TICKS)) {
      for (let t = min; t <= max; t++) expect(toTicks(toMs(t))).toBe(t);
    }
    expect([toMs(TIMING_TICKS.das.min), toMs(TIMING_TICKS.das.max)]).toEqual([50, 333]);
    expect([toMs(TIMING_TICKS.arr.min), toMs(TIMING_TICKS.arr.max)]).toEqual([17, 100]);
  });

  it('forgets everything on reset', () => {
    const c = new InputController();
    c.down('left');
    c.down('hard');
    c.reset();
    expect(c.hasPending()).toBe(false);
    expect(c.tick()).toMatchObject({ dx: 0, hard: false, soft: false });
  });
});
