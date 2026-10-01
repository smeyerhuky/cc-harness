import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Connect, LinkHandlers } from './link';
import { BACKOFF, backoffMs, Socket, type SocketStatus } from './Socket';

/** Links the test opens and drops by hand; each `connect` makes the next one. */
function links() {
  const made: { h: LinkHandlers; sent: string[]; closed: boolean }[] = [];
  const connect: Connect = (h) => {
    const l = { h, sent: [] as string[], closed: false };
    made.push(l);
    return {
      send: (text) => l.sent.push(text),
      close: () => {
        l.closed = true;
      },
    };
  };
  const last = () => {
    const l = made.at(-1);
    if (!l) throw new Error('no link');
    return l;
  };
  return { made, connect, last };
}

function socket(o: { final?: (code: number) => boolean; random?: () => number } = {}) {
  const l = links();
  const statuses: SocketStatus[] = [];
  const opened: boolean[] = [];
  const heard: string[] = [];
  const s = new Socket(
    l.connect,
    {
      open: (again) => opened.push(again),
      message: (text) => heard.push(text),
      status: (st) => statuses.push(st),
    },
    { random: () => 0.5, ...o },
  );
  s.start();
  return { s, l, statuses, opened, heard };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('backoffMs', () => {
  it('doubles from 0.5 s to 8 s, jittered between half and one and a half times', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map((n) => backoffMs(n, () => 0.5))).toEqual([
      500, 1000, 2000, 4000, 8000, 8000, 8000,
    ]);
    for (let n = 0; n < 12; n++) {
      for (const r of [0, 0.25, 0.75, 0.999]) {
        const ms = backoffMs(n, () => r);
        expect(ms).toBeGreaterThanOrEqual(BACKOFF.minMs);
        expect(ms).toBeLessThanOrEqual(BACKOFF.maxMs);
      }
    }
    expect(backoffMs(2, () => 0)).toBe(1000);
    expect(backoffMs(2, () => 0.999)).toBe(2998);
  });
});

describe('Socket', () => {
  it('reconnects after a drop, after the backoff, and says it is a return', () => {
    const { s, l, statuses, opened } = socket();
    l.last().h.open();
    expect(s.send('hello')).toBe(true);
    l.last().h.close(1006);
    expect(statuses).toEqual(['open', 'reconnecting']);
    expect(s.send('lost')).toBe(false);
    vi.advanceTimersByTime(499);
    expect(l.made).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(l.made).toHaveLength(2);
    l.last().h.open();
    expect(opened).toEqual([false, true]);
    expect(statuses).toEqual(['open', 'reconnecting', 'open']);
    expect(l.made[0]?.sent).toEqual(['hello']);
  });

  it('waits longer each time it fails, and from the start again once heard from', () => {
    const { l } = socket();
    const waits: number[] = [];
    const failNext = () => {
      const before = l.made.length;
      l.last().h.close(1006);
      let waited = 0;
      while (l.made.length === before) {
        vi.advanceTimersByTime(100);
        waited += 100;
      }
      waits.push(waited);
    };
    for (let i = 0; i < 6; i++) failNext();
    expect(waits).toEqual([500, 1000, 2000, 4000, 8000, 8000]);
    l.last().h.open();
    l.last().h.message('{"v":1,"t":"pong"}');
    failNext();
    expect(waits.at(-1)).toBe(500);
  });

  it('stays closed after a close the server meant', () => {
    const { l, statuses } = socket({ final: (code) => code === 4000 });
    l.last().h.open();
    l.last().h.close(4000);
    vi.advanceTimersByTime(BACKOFF.maxMs * 2);
    expect(l.made).toHaveLength(1);
    expect(statuses).toEqual(['open', 'closed']);
  });

  it('closes for good when asked, even while waiting to reconnect', () => {
    const { s, l, statuses } = socket();
    l.last().h.open();
    l.last().h.close(1006);
    s.close();
    vi.advanceTimersByTime(BACKOFF.maxMs * 2);
    expect(l.made).toHaveLength(1);
    expect(statuses).toEqual(['open', 'reconnecting', 'closed']);
    // A link closed by hand is closed, and what it says after is ignored.
    const t = socket();
    t.l.last().h.open();
    t.s.close();
    expect(t.l.last().closed).toBe(true);
    t.l.last().h.message('late');
    t.l.last().h.close(1000);
    expect(t.heard).toEqual([]);
    expect(t.statuses).toEqual(['open', 'closed']);
  });
});
