import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputController } from '../../input/InputController';
import { MatchSession, type WireEntry } from '../../state/MatchSession';
import { detail, isChatter, WIRE_LOG_SIZE, WIRE_REFRESH_MS, WireLog } from './wireLog';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function setup() {
  const session = new MatchSession({
    seed: 77,
    bot: { skill: 6, speed: 6 },
    input: new InputController(),
  });
  const log = new WireLog(session);
  let now = 1000;
  const frames = (n: number) => {
    for (let i = 0; i < n; i++) session.frame((now += 1000 / 60));
  };
  return { session, log, frames };
}

const entry = (msg: WireEntry['msg']): WireEntry =>
  ({ tick: 1, dir: 'down', seat: 0, msg }) as WireEntry;

describe('WireLog', () => {
  it('records from the first message, and refreshes its view a few times a second', () => {
    const { log, frames } = setup();
    const changed = vi.fn();
    const stop = log.subscribe(changed);
    frames(600);
    expect(changed).not.toHaveBeenCalled();
    expect(log.getSnapshot().total).toBe(0);
    vi.advanceTimersByTime(WIRE_REFRESH_MS);
    expect(changed).toHaveBeenCalledTimes(1);
    const v = log.getSnapshot();
    expect(v.total).toBeGreaterThan(0);
    expect(v.referee).toBe('playing');
    expect(v.tick).toBeGreaterThan(0);
    // Newest first, back to the match's first messages: the referee deals, then starts.
    const types = v.events.map((e) => e.msg.type);
    expect(types.at(-1)).toBe('bag');
    expect(types).toContain('start');
    expect(v.events[0]?.tick).toBeGreaterThanOrEqual(v.events.at(-1)?.tick ?? 0);
    // Nothing new: no refresh.
    vi.advanceTimersByTime(WIRE_REFRESH_MS);
    expect(changed).toHaveBeenCalledTimes(1);
    stop();
  });

  it('keeps positions and heartbeats out of the events, and at most its size of each', () => {
    const { log, frames } = setup();
    const stop = log.subscribe(() => undefined);
    frames(60 * 40);
    vi.advanceTimersByTime(WIRE_REFRESH_MS);
    const v = log.getSnapshot();
    expect(v.all.some(isChatter)).toBe(true);
    expect(v.events.some(isChatter)).toBe(false);
    expect(v.all).toHaveLength(WIRE_LOG_SIZE);
    expect(v.total).toBeGreaterThan(WIRE_LOG_SIZE);
    stop();
  });

  it('stops listening when nobody watches it', () => {
    const { log, frames } = setup();
    const stop = log.subscribe(() => undefined);
    frames(60);
    stop();
    frames(600);
    const again = log.subscribe(() => undefined);
    vi.advanceTimersByTime(WIRE_REFRESH_MS);
    const counted = log.getSnapshot().total;
    frames(1);
    vi.advanceTimersByTime(WIRE_REFRESH_MS);
    expect(counted).toBeGreaterThan(0);
    // Only the first second's messages, none from the ten seconds unwatched.
    expect(counted).toBeLessThan(60);
    again();
  });
});

describe('detail', () => {
  it('lists a message’s fields after its type, shortened', () => {
    expect(detail(entry({ type: 'garbage', rows: 2, id: 3 }))).toBe('rows 2 · id 3');
    expect(detail(entry({ type: 'bag', pieces: [] }))).toBe('pieces [0]');
    expect(detail(entry({ type: 'grace', by: 1, until: 900 }))).toBe('by 1 · until 900');
    const board = detail(
      entry({
        type: 'opp',
        kind: 'pos',
        cur: { t: 'T', r: 0, x: 4, y: 18 },
        meter: 0,
        power: null,
        hold: null,
      }),
    );
    expect(board).toBe('kind pos · cur {"t":"T","r":0,"x":4,"y":18} · meter 0 · power – · hold –');
    const long = detail(
      entry({
        type: 'opp',
        kind: 'lock',
        board: 'x'.repeat(200),
        meter: 0,
        stats: { pieces: 4, lines: 0, sent: 0 },
        lines: 0,
      } as never),
    );
    expect(long).toHaveLength(73);
    expect(long.endsWith('…')).toBe(true);
    expect(detail(entry({ type: 'deadline', deadline: 12 }))).toBe('deadline 12');
  });
});
