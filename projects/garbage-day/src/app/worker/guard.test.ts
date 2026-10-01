import { emptyBoard, snapshot } from '@garbage-day/engine';
import { encodeClientToMatch, parseClientToMatch, type ClientToMatch } from '@garbage-day/protocol';
import { describe, expect, it } from 'vitest';
import { MessageGuard } from './guard';

const limits = { rate: 10, burst: 5, locks: 2, strikes: 4 };
const ready = encodeClientToMatch({ type: 'ready' });
const guard = () => new MessageGuard<ClientToMatch>(parseClientToMatch, limits);

describe('MessageGuard', () => {
  it('passes a valid message through, parsed', () => {
    expect(guard().check(ready, 0)).toEqual({ ok: true, msg: { type: 'ready' } });
  });

  it('allows a burst, then the sustained rate', () => {
    const g = guard();
    for (let i = 0; i < 5; i++) expect(g.check(ready, 0).ok).toBe(true);
    expect(g.check(ready, 0)).toMatchObject({ ok: false, reason: 'rate' });
    // 10 a second: one more every 100 ms.
    expect(g.check(ready, 100).ok).toBe(true);
    expect(g.check(ready, 100).ok).toBe(false);
  });

  it('refuses binary frames and anything the protocol refuses, with its reason', () => {
    const g = guard();
    expect(g.check(new ArrayBuffer(4), 0)).toMatchObject({ reason: 'binary' });
    expect(g.check('nope', 1000)).toMatchObject({ reason: 'malformed' });
    expect(g.check('{"v":9,"t":"ready"}', 2000)).toMatchObject({ reason: 'version' });
    expect(g.check('{"v":1,"t":"ready","x":1}', 3000)).toMatchObject({ reason: 'invalid' });
  });

  it('refuses an attack worth more than its clear', () => {
    const clear = { lines: 2, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 1 };
    const g = guard();
    expect(g.check(encodeClientToMatch({ type: 'attack', rows: 1, clear }), 0).ok).toBe(true);
    const greedy = g.check(encodeClientToMatch({ type: 'attack', rows: 4, clear }), 0);
    expect(greedy).toMatchObject({ ok: false, reason: 'invalid' });
    const inflated = g.check(
      encodeClientToMatch({ type: 'attack', rows: 4, clear: { ...clear, attack: 4 } }),
      0,
    );
    expect(inflated).toMatchObject({ ok: false, reason: 'invalid' });
  });

  it('tells the client about the first refusal, then at most once a second', () => {
    const g = guard();
    expect(g.check('x', 0)).toMatchObject({ notify: true });
    expect(g.check('x', 500)).toMatchObject({ notify: false });
    expect(g.check('x', 1000)).toMatchObject({ notify: true });
  });

  it('closes a socket that keeps failing, and forgives one that slows down', () => {
    const g = guard();
    // Four refusals at once reach the limit.
    expect([0, 0, 0, 0].map((t) => g.check('x', t))).toMatchObject([
      { close: false },
      { close: false },
      { close: false },
      { close: true },
    ]);
    // One refusal every two seconds drains faster than it fills.
    const slow = guard();
    for (let t = 0; t < 60_000; t += 2000)
      expect(slow.check('x', t)).toMatchObject({ close: false });
  });

  it('caps locks separately from the overall rate', () => {
    const g = new MessageGuard<ClientToMatch>(parseClientToMatch, {
      ...limits,
      burst: 50,
      rate: 50,
    });
    const lock = encodeClientToMatch({
      type: 'lock',
      board: snapshot(emptyBoard()),
      lines: 0,
      attack: 0,
      clear: null,
      meter: 0,
      gack: 0,
      hold: null,
      power: null,
      stats: {
        pieces: 1,
        lines: 0,
        sent: 0,
        received: 0,
        cancelled: 0,
        fourLineClears: 0,
        tspins: 0,
        perfectClears: 0,
        powersUsed: 0,
        powersGot: 0,
        maxCombo: 0,
        garbageRows: 0,
      },
    });
    expect([0, 0, 0].map((t) => g.check(lock, t).ok)).toEqual([true, true, false]);
    expect(g.check(lock, 0)).toMatchObject({ reason: 'locks' });
    expect(g.check(ready, 0).ok).toBe(true);
    expect(g.check(lock, 500).ok).toBe(true);
  });
});
