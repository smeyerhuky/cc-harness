import { describe, expect, it } from 'vitest';
import { TPS, type PlayerIndex } from './constants';
import type { ClientMessage, PlayerStats, ServerMessage } from './messages';
import { COUNTDOWN_TICKS, Referee, type RefereeEvent, type RefereeHost } from './referee';
import { DEFAULT_RULES, type Rules } from './rules';

const GO = COUNTDOWN_TICKS;
const sec = (s: number) => s * TPS;

const STATS: PlayerStats = {
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
};

const lockMsg = (board: string): ClientMessage => ({
  type: 'lock',
  board,
  lines: 0,
  attack: 0,
  clear: null,
  meter: 0,
  gack: 0,
  hold: null,
  power: null,
  stats: STATS,
});

const posMsg = (gack = 0): ClientMessage => ({
  type: 'pos',
  cur: { t: 'T', r: 0, x: 3, y: 19 },
  meter: 0,
  gack,
  power: null,
  hold: null,
});

/**
 * A referee with both players connected, driven tick by tick. Both players send a heartbeat
 * every second unless marked silent.
 */
function setup(rules: Partial<Rules> = {}, o: { start?: boolean } = {}) {
  const sent: [PlayerIndex, ServerMessage][] = [];
  const events: RefereeEvent[] = [];
  const host: RefereeHost = {
    send: (to, m) => sent.push([to, m]),
    emit: (e) => events.push(e),
  };
  let ref = new Referee(0x5eed, { ...DEFAULT_RULES, ...rules }, host);
  let t = 0;
  const silent = new Set<PlayerIndex>();
  const h = {
    get ref() {
      return ref;
    },
    sent,
    events,
    silent,
    get t() {
      return t;
    },
    /** Advances to tick `to`. */
    until(to: number) {
      while (t < to) {
        t++;
        for (const i of [0, 1] as const) {
          if (!silent.has(i) && t % TPS === 0) ref.onMessage(i, { type: 'hb' }, t);
        }
        ref.tick(t);
      }
    },
    wait(ticks: number) {
      h.until(t + ticks);
    },
    /** Sets the clock without ticking, for a referee restored mid-match. */
    jump(to: number) {
      t = to;
    },
    /** Advances until the match has been active for `s` seconds. */
    untilActive(s: number) {
      while (ref.activeTicks < sec(s) && ref.state !== 'over') h.wait(1);
    },
    msg(i: PlayerIndex, m: ClientMessage) {
      ref.onMessage(i, m, t);
    },
    to(i: PlayerIndex) {
      return sent.filter(([to]) => to === i).map(([, m]) => m);
    },
    last<T extends ServerMessage['type']>(i: PlayerIndex, type: T) {
      return h
        .to(i)
        .filter((m): m is Extract<ServerMessage, { type: T }> => m.type === type)
        .at(-1);
    },
    count(i: PlayerIndex, type: ServerMessage['type']) {
      return h.to(i).filter((m) => m.type === type).length;
    },
    swap(next: Referee) {
      ref = next;
    },
    host,
  };
  if (o.start !== false) {
    ref.start(0);
    h.until(GO);
  }
  return h;
}

describe('Referee: starting', () => {
  it('deals two bags to each player and starts both after a 3-second countdown', () => {
    const h = setup({}, { start: false });
    expect(h.ref.state).toBe('lobby');
    h.ref.start(0);
    expect(h.ref.state).toBe('countdown');
    for (const i of [0, 1] as const) {
      expect(h.count(i, 'bag')).toBe(2);
      expect(h.last(i, 'start')).toEqual({ type: 'start', goAt: GO });
    }
    expect(h.to(0).filter((m) => m.type === 'bag')).toEqual(
      h.to(1).filter((m) => m.type === 'bag'),
    );
    h.until(GO - 1);
    expect(h.ref.state).toBe('countdown');
    expect(h.ref.activeTicks).toBe(0);
    h.wait(1);
    expect(h.ref.state).toBe('playing');
    expect(h.ref.activeTicks).toBe(1);
  });

  it('deals the next bag on request, the same bags in the same order to both', () => {
    const h = setup();
    h.msg(0, { type: 'bagReq' });
    h.msg(1, { type: 'bagReq' });
    expect(h.last(0, 'bag')).toEqual(h.last(1, 'bag'));
    expect(h.count(0, 'bag')).toBe(3);
  });
});

describe('Referee: relaying and routing', () => {
  it('relays positions and locks to the other player, and counts what it receives', () => {
    const h = setup();
    h.msg(0, posMsg());
    h.msg(0, lockMsg('x'.repeat(240)));
    expect(h.last(1, 'opp')).toMatchObject({ kind: 'lock', board: 'x'.repeat(240) });
    expect(h.to(1).filter((m) => m.type === 'opp')).toHaveLength(2);
    expect(h.count(0, 'opp')).toBe(0);
    expect(h.ref.counts).toMatchObject({ pos: 1, lock: 1, relayed: 2 });
  });

  it('routes attacks to the other player with increasing ids', () => {
    const h = setup();
    const clear = { lines: 4, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 4 };
    h.msg(0, { type: 'attack', rows: 4, clear });
    h.msg(1, { type: 'attack', rows: 2, clear });
    h.msg(0, { type: 'attack', rows: 1, clear });
    expect(h.to(1).filter((m) => m.type === 'garbage')).toEqual([
      { type: 'garbage', rows: 4, id: 1 },
      { type: 'garbage', rows: 1, id: 3 },
    ]);
    expect(h.last(0, 'garbage')).toEqual({ type: 'garbage', rows: 2, id: 2 });
  });

  it('stamps a power-up 0.2 s ahead for both, and a shield blocks attacks for 5 s from then', () => {
    const h = setup();
    const clear = { lines: 2, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 1 };
    h.msg(1, { type: 'use', power: 'shield' });
    const at = h.t + 12;
    for (const i of [0, 1] as const) {
      expect(h.last(i, 'power')).toEqual({ type: 'power', kind: 'shield', by: 1, at });
    }
    h.msg(0, { type: 'attack', rows: 3, clear });
    expect(h.count(1, 'garbage')).toBe(0);
    expect(h.events).toContainEqual({ type: 'blocked', p: 1, rows: 3 });
    h.until(at + sec(5));
    h.msg(0, { type: 'attack', rows: 3, clear });
    expect(h.count(1, 'garbage')).toBe(1);
  });

  it('announces showdowns 5 s ahead: double garbage at 1:00 for 15 s, sudden death at 2:30 to the end', () => {
    const h = setup();
    const clear = { lines: 3, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 2 };
    h.untilActive(55);
    expect(h.last(0, 'showdown')).toEqual({
      type: 'showdown',
      kind: 'double',
      phase: 'soon',
      startsAt: 60,
    });
    h.untilActive(60);
    expect(h.last(1, 'showdown')).toMatchObject({ kind: 'double', phase: 'start', until: sec(75) });
    h.msg(0, { type: 'attack', rows: 2, clear });
    expect(h.last(1, 'garbage')?.rows).toBe(4);
    h.untilActive(75);
    expect(h.last(1, 'showdown')).toMatchObject({ kind: 'double', phase: 'end' });
    h.msg(0, { type: 'attack', rows: 2, clear });
    expect(h.last(1, 'garbage')?.rows).toBe(2);
    h.untilActive(145);
    expect(h.last(0, 'showdown')).toMatchObject({ kind: 'sudden', phase: 'soon' });
    h.untilActive(150);
    expect(h.last(0, 'showdown')).toMatchObject({ kind: 'sudden', phase: 'start', until: null });
    h.untilActive(400);
    expect(h.last(0, 'showdown')?.phase).toBe('start');
    h.msg(1, { type: 'attack', rows: 1, clear });
    expect(h.last(0, 'garbage')?.rows).toBe(2);
  });

  it('ends the match for the other player when one tops out', () => {
    const h = setup();
    h.msg(1, { type: 'topout', why: 'block out' });
    expect(h.ref.state).toBe('over');
    expect(h.last(0, 'result')).toEqual({ type: 'result', winner: 0, reason: 'topout', by: 1 });
    const clear = { lines: 4, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 4 };
    h.msg(0, { type: 'attack', rows: 4, clear });
    expect(h.count(1, 'garbage')).toBe(0);
  });
});

describe('Referee: pauses', () => {
  it('pauses both players for a hidden tab, using one of two pauses, with a 2:00 deadline', () => {
    const h = setup();
    h.wait(100);
    h.msg(1, { type: 'away', reason: 'tab' });
    expect(h.ref.state).toBe('paused');
    expect(h.ref.presence(1)).toBe('away');
    const paused = {
      type: 'paused',
      by: 1,
      reason: 'tab',
      deadline: h.t + sec(120),
      pausesLeft: 1,
      budgeted: true,
    };
    expect(h.last(0, 'paused')).toEqual(paused);
    expect(h.last(1, 'paused')).toEqual(paused);
    const active = h.ref.activeTicks;
    h.wait(sec(10));
    expect(h.ref.activeTicks).toBe(active);
  });

  it('hides both boards while paused: nothing is relayed until the resume', () => {
    const h = setup();
    h.msg(0, lockMsg('a'.repeat(240)));
    h.msg(1, { type: 'away', reason: 'tab' });
    const before = h.count(1, 'opp');
    h.msg(0, posMsg());
    h.msg(0, lockMsg('b'.repeat(240)));
    expect(h.count(1, 'opp')).toBe(before);
    h.msg(1, { type: 'back' });
    expect(h.last(1, 'opp')).toMatchObject({ kind: 'lock', board: 'b'.repeat(240) });
  });

  it('lets only the waiting player extend the deadline, by 1:00 each time', () => {
    const h = setup();
    h.msg(1, { type: 'away', reason: 'step' });
    const deadline = h.last(0, 'paused')?.deadline ?? 0;
    h.msg(0, { type: 'extend' });
    h.msg(0, { type: 'extend' });
    expect(h.last(1, 'deadline')).toEqual({ type: 'deadline', deadline: deadline + sec(120) });
    h.msg(1, { type: 'extend' });
    expect(h.count(0, 'deadline')).toBe(2);
  });

  it('forfeits the absent player when the deadline passes', () => {
    const h = setup();
    h.msg(1, { type: 'away', reason: 'tab' });
    h.wait(sec(120) - 1);
    expect(h.ref.state).toBe('paused');
    h.wait(1);
    expect(h.last(0, 'result')).toEqual({ type: 'result', winner: 0, reason: 'timeout', by: 1 });
    expect(h.ref.presence(1)).toBe('forfeit');
  });

  it('resumes both after a 3-second countdown, telling them how long the player was away', () => {
    const h = setup();
    h.msg(1, { type: 'away', reason: 'tab' });
    h.wait(sec(47));
    h.msg(1, { type: 'back' });
    const at = h.t + GO;
    expect(h.last(0, 'resume')).toEqual({
      type: 'resume',
      at,
      by: 1,
      away: sec(47),
      pausesLeft: 1,
      free: false,
    });
    expect(h.ref.state).toBe('resuming');
    h.until(at - 1);
    expect(h.ref.state).toBe('resuming');
    h.wait(1);
    expect(h.ref.state).toBe('playing');
  });

  it('runs out of pauses after two', () => {
    const h = setup();
    for (let k = 0; k < 2; k++) {
      h.msg(0, { type: 'away', reason: 'tab' });
      h.msg(0, { type: 'back' });
      h.wait(GO + 1);
    }
    expect(h.ref.pausesLeft(0)).toBe(0);
    h.msg(0, { type: 'away', reason: 'tab' });
    expect(h.ref.state).toBe('playing');
    expect(h.ref.presence(0)).toBe('grace');
  });
});

describe('Referee: lost connections', () => {
  it('treats 5 s of silence as a free reconnect, three times, then as a pause', () => {
    const h = setup();
    for (let k = 1; k <= 4; k++) {
      h.silent.add(1);
      const lastHb = h.t - (h.t % TPS);
      h.until(lastHb + sec(5) + 1);
      expect(h.ref.state).toBe('paused');
      const paused = h.last(0, 'paused');
      expect(paused).toMatchObject({ by: 1, reason: 'lost', budgeted: k === 4 });
      expect(h.ref.reconnectsLeft(1)).toBe(Math.max(0, 3 - k));
      expect(h.ref.pausesLeft(1)).toBe(k === 4 ? 1 : 2);
      h.silent.delete(1);
      h.msg(1, { type: 'rejoin', gack: 0 });
      expect(h.last(0, 'resume')?.free).toBe(k !== 4);
      h.wait(GO + 1);
    }
  });

  it('resends every garbage attack the player had not acknowledged when it rejoins', () => {
    const h = setup();
    const clear = { lines: 4, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 4 };
    for (const rows of [1, 2, 3]) h.msg(0, { type: 'attack', rows, clear });
    h.msg(1, posMsg(1));
    h.msg(1, { type: 'away', reason: 'closed' });
    expect(h.ref.presence(1)).toBe('gone');
    const before = h.count(1, 'garbage');
    h.msg(1, { type: 'rejoin', gack: 2 });
    const resent = h
      .to(1)
      .filter((m) => m.type === 'garbage')
      .slice(before);
    expect(resent).toEqual([{ type: 'garbage', rows: 3, id: 3 }]);
    expect(h.events).toContainEqual({ type: 'rejoin', p: 1, resent: 1 });
  });
});

describe('Referee: no pauses left', () => {
  it('keeps the match running and gives the absent player 15 s to return', () => {
    const h = setup({ pauseBudget: 0 });
    h.msg(1, { type: 'away', reason: 'tab' });
    expect(h.ref.state).toBe('playing');
    expect(h.last(0, 'grace')).toEqual({ type: 'grace', by: 1, until: h.t + sec(15) });
    h.wait(sec(10));
    h.msg(1, { type: 'back' });
    expect(h.last(0, 'back')).toEqual({ type: 'back', by: 1, away: sec(10), pausesLeft: 0 });
    expect(h.ref.presence(1)).toBe('present');
    h.wait(sec(20));
    expect(h.ref.state).toBe('playing');
  });

  it('forfeits the absent player after the 15 s', () => {
    const h = setup({ pauseBudget: 0 });
    h.msg(1, { type: 'away', reason: 'tab' });
    h.wait(sec(15));
    expect(h.last(0, 'result')).toEqual({ type: 'result', winner: 0, reason: 'grace', by: 1 });
  });
});

describe('Referee: both players away', () => {
  it('starts a 5:00 session timer when the waiting player leaves too, and ends with no result', () => {
    const h = setup();
    h.msg(1, { type: 'away', reason: 'tab' });
    h.wait(sec(2));
    h.msg(0, { type: 'away', reason: 'tab' });
    expect(h.last(1, 'bothAway')).toEqual({ type: 'bothAway', endsAt: h.t + sec(300) });
    expect(h.ref.pausesLeft(0)).toBe(2);
    h.wait(sec(300));
    expect(h.last(0, 'result')).toEqual({
      type: 'result',
      winner: null,
      reason: 'abandoned',
      by: null,
    });
  });

  it('cancels the session timer when either returns, and keeps waiting for the other', () => {
    const h = setup();
    h.msg(1, { type: 'away', reason: 'tab' });
    const deadline = h.last(0, 'paused')?.deadline;
    h.wait(sec(2));
    h.msg(0, { type: 'away', reason: 'tab' });
    h.wait(sec(10));
    h.msg(0, { type: 'back' });
    expect(h.events).toContainEqual({ type: 'bothAwayCancelled', waitingFor: 1 });
    expect(h.last(0, 'paused')).toMatchObject({ by: 1, deadline });
    h.wait(sec(300));
    expect(h.last(0, 'result')?.reason).toBe('timeout');
  });

  it('switches the pause to the other player, with a fresh deadline, if the first one returns first', () => {
    const h = setup();
    h.msg(1, { type: 'away', reason: 'tab' });
    h.wait(sec(2));
    h.msg(0, { type: 'away', reason: 'step' });
    h.wait(sec(20));
    h.msg(1, { type: 'back' });
    expect(h.last(1, 'paused')).toMatchObject({ by: 0, reason: 'step', deadline: h.t + sec(120) });
    expect(h.ref.state).toBe('paused');
    h.msg(0, { type: 'back' });
    expect(h.ref.state).toBe('resuming');
  });
});

describe('Referee: leaving', () => {
  it('makes leaving during the other’s pause a no contest by default', () => {
    const h = setup();
    h.msg(1, { type: 'away', reason: 'tab' });
    h.msg(0, { type: 'leave' });
    expect(h.last(1, 'result')).toEqual({
      type: 'result',
      winner: null,
      reason: 'left-while-paused',
      by: 0,
    });
  });

  it('can give the player who left the win instead, by setting', () => {
    const h = setup({ leaveResult: 'win' });
    h.msg(1, { type: 'away', reason: 'tab' });
    h.msg(0, { type: 'leave' });
    expect(h.last(1, 'result')).toMatchObject({ winner: 0, reason: 'left-while-paused' });
  });

  it('gives the other player the win when someone leaves a running match', () => {
    const h = setup();
    h.msg(0, { type: 'leave' });
    expect(h.last(1, 'result')).toEqual({ type: 'result', winner: 1, reason: 'left', by: 0 });
  });
});

describe('Referee: snapshots', () => {
  it('restores from a JSON snapshot mid-pause and carries on exactly as the original', () => {
    const drive = (h: ReturnType<typeof setup>) => {
      h.msg(1, { type: 'bagReq' });
      h.msg(0, { type: 'extend' });
      h.wait(sec(30));
      h.msg(1, { type: 'rejoin', gack: 0 });
      h.wait(GO + sec(2));
      h.msg(0, { type: 'bagReq' });
    };
    const clear = { lines: 4, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 4 };
    const a = setup();
    a.msg(0, { type: 'attack', rows: 4, clear });
    a.msg(1, { type: 'away', reason: 'closed' });
    const snap = JSON.parse(JSON.stringify(a.ref.snapshot())) as ReturnType<Referee['snapshot']>;
    const b = setup({}, { start: false });
    b.swap(Referee.restore(snap, b.host));
    b.jump(a.t);
    const mark = a.sent.length;
    drive(a);
    drive(b);
    expect(b.sent).toEqual(a.sent.slice(mark));
    expect(b.ref.snapshot()).toEqual(a.ref.snapshot());
    expect(b.ref.state).toBe('playing');
  });

  it('keeps a 128-bit dealing seed through a snapshot', () => {
    const sent: [ServerMessage[], ServerMessage[]] = [[], []];
    const host = (k: 0 | 1): RefereeHost => ({
      send: (_to, m) => sent[k].push(m),
      emit: () => undefined,
    });
    const a = new Referee([1, 2, 3, 0xffffffff], DEFAULT_RULES, host(0));
    a.start(0);
    const snap = JSON.parse(JSON.stringify(a.snapshot())) as ReturnType<Referee['snapshot']>;
    expect(snap.seed).toEqual([1, 2, 3, 0xffffffff]);
    const b = Referee.restore(snap, host(1));
    a.onMessage(0, { type: 'bagReq' }, 1);
    b.onMessage(0, { type: 'bagReq' }, 1);
    expect(sent[1]).toEqual([sent[0].at(-1)]);
    expect(sent[1][0]).toMatchObject({ type: 'bag' });
  });
});
