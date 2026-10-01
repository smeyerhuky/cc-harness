import { describe, expect, it } from 'vitest';
import { dropBottomRows, emptyBoard, GARBAGE, setCell, snapshot } from './board';
import { Bot, botConfig } from './bot';
import { ClientMatch } from './client-match';
import { TPS, type PlayerIndex } from './constants';
import type { ClientMessage, PlayerEvent, ServerMessage } from './messages';
import { Referee } from './referee';

/**
 * Two clients and a referee joined by a one-tick network, as the Match DO joins two browsers:
 * every message waits for the next tick, and only `ClientMatch` sees the clients' side.
 */
function online(seed: number) {
  const toReferee: { from: PlayerIndex; msg: ClientMessage }[] = [];
  const toClient: { to: PlayerIndex; msg: ServerMessage }[] = [];
  /** Seats whose connection is dead: what either end sends them, or they send, is lost. */
  const cut = new Set<PlayerIndex>();
  /** Seats whose browser has stalled: they don't step, and what they are sent waits for them. */
  const stalled = new Set<PlayerIndex>();
  const held: { to: PlayerIndex; msg: ServerMessage }[] = [];
  const sentBy: [ClientMessage[], ClientMessage[]] = [[], []];
  const heard: [ServerMessage[], ServerMessage[]] = [[], []];
  const holes = [0x1111, 0x2222] as const;
  const clients = ([0, 1] as const).map(
    (seat) =>
      new ClientMatch({
        send: (msg) => {
          sentBy[seat].push(msg);
          if (!cut.has(seat)) toReferee.push({ from: seat, msg });
        },
      }),
  ) as [ClientMatch, ClientMatch];
  const sentTo: [PlayerIndex, ServerMessage][] = [];
  const referee = new Referee(seed, clients[0].rules, {
    send: (to, msg) => {
      sentTo.push([to, msg]);
      toClient.push({ to, msg });
    },
    emit: () => undefined,
  });
  let T = 0;
  referee.start(T);
  const step = () => {
    T++;
    for (const { from, msg } of toReferee.splice(0)) referee.onMessage(from, msg, T);
    referee.tick(T);
    // The Match DO's clock, every second (GD-STORY-013).
    if (T % 60 === 0) {
      for (const to of [0, 1] as const) {
        toClient.push({ to, msg: { type: 'clock', tick: T, active: referee.activeTicks } });
      }
    }
    const due = [...held.filter((x) => !stalled.has(x.to)), ...toClient.splice(0)];
    held.splice(0, held.length, ...held.filter((x) => stalled.has(x.to)));
    for (const { to, msg } of due) {
      if (cut.has(to)) continue;
      if (stalled.has(to)) {
        held.push({ to, msg });
        continue;
      }
      heard[to].push(msg);
      clients[to].receive(msg, { holes: holes[to], you: to });
    }
    for (const c of clients) {
      if (c.me && !c.controller) c.controller = new Bot(c.me, seed, botConfig(6, 10));
      if (!stalled.has(c.seat)) c.step();
      // A heartbeat each second, as the socket's ping does.
      if (T % 60 === 0 && !cut.has(c.seat)) toReferee.push({ from: c.seat, msg: { type: 'hb' } });
    }
  };
  const run = (ticks: number) => {
    for (let i = 0; i < ticks; i++) step();
  };
  return { clients, referee, sentBy, sentTo, heard, cut, stalled, step, run, now: () => T };
}

describe('ClientMatch', () => {
  it('plays a whole match against the referee, ending the same way on both sides', () => {
    const m = online(0x5eed11);
    while (!m.referee.result && m.now() < 60 * 60 * 5) m.step();
    for (let i = 0; i < 5; i++) m.step();
    const r = m.referee.result;
    expect(r).not.toBeNull();
    for (const c of m.clients) {
      expect(c.result).toMatchObject({ type: 'result', winner: r?.winner, reason: r?.reason });
    }
  });

  it('takes its seat from start, so power-ups fall on the right player', () => {
    const m = online(12);
    for (let i = 0; i < 3; i++) m.step();
    expect(m.clients.map((c) => c.seat)).toEqual([0, 1]);
    expect(m.clients.map((c) => c.me?.idx)).toEqual([0, 1]);
  });

  it('starts each player on the start the referee sent, with the bags that came before it', () => {
    const m = online(7);
    for (let i = 0; i < 5; i++) m.step();
    for (const c of m.clients) {
      expect(c.me).not.toBeNull();
      expect(c.t).toBe(m.now());
      // Two bags dealt, none drawn yet: the countdown hasn't ended.
      expect(c.me?.queue).toHaveLength(14);
      expect(c.me?.resumeAt).toBe(180);
    }
    expect(m.clients[0].me?.queue).toEqual(m.clients[1].me?.queue);
    expect(m.clients[0].activeTicks).toBe(0);
  });

  it('counts active ticks as the referee does', () => {
    const m = online(8);
    for (let i = 0; i < 600; i++) m.step();
    for (const c of m.clients)
      expect(Math.abs(c.activeTicks - m.referee.activeTicks)).toBeLessThanOrEqual(1);
  });

  it('sees the other board as of its last lock, and its piece as of its last position', () => {
    const m = online(9);
    for (let i = 0; i < 60 * 20; i++) m.step();
    const [a, b] = m.clients;
    const lastLock = (seat: PlayerIndex) => m.sentBy[seat].filter((x) => x.type === 'lock').at(-1);
    for (const [viewer, other] of [
      [a, 1],
      [b, 0],
    ] as const) {
      const lock = lastLock(other);
      if (lock?.type !== 'lock') throw new Error('no lock yet');
      expect(snapshot(viewer.opponent.board)).toBe(lock.board);
      expect(viewer.opponent.stats).toEqual(lock.stats);
    }
  });

  it('never hears the other player’s next pieces', () => {
    const m = online(10);
    for (let i = 0; i < 60 * 10; i++) m.step();
    for (const seat of [0, 1] as const) {
      const theirs = m.heard[seat].filter((x) => x.type === 'opp');
      for (const msg of theirs) expect(Object.keys(msg)).not.toContain('pieces');
      expect(m.heard[seat].filter((x) => x.type === 'bag').length).toBeGreaterThan(2);
    }
  });

  it('sends positions at most 15 times a second', () => {
    const m = online(11);
    for (let i = 0; i < 60 * 10; i++) m.step();
    for (const seat of [0, 1] as const) {
      const pos = m.sentBy[seat].filter((x) => x.type === 'pos').length;
      expect(pos).toBeLessThanOrEqual(15 * 10);
      expect(pos).toBeGreaterThan(0);
    }
  });
});

describe('ClientMatch: dropping and rejoining (GD-TICKET-013)', () => {
  /** The garbage the referee routed to `seat`, by id, resends counted once. */
  const routedTo = (m: ReturnType<typeof online>, seat: PlayerIndex) => {
    const byId = new Map<number, number>();
    for (const [to, msg] of m.sentTo)
      if (to === seat && msg.type === 'garbage') byId.set(msg.id, msg.rows);
    return byId;
  };

  it('keeps game messages made offline, in order, and sends them before rejoin', () => {
    const sent: ClientMessage[] = [];
    const c = new ClientMatch({ send: (msg) => sent.push(msg) });
    c.receive({ type: 'start', goAt: 180 }, { you: 0, holes: 1 });
    c.drop();
    c.send({ type: 'use', power: 'bomb' });
    c.send({ type: 'pos', cur: null, meter: 0, gack: 0, power: null, hold: null });
    c.send({ type: 'hb' });
    c.send({ type: 'leave' });
    expect(sent).toEqual([]);
    c.rejoin(2500);
    expect(sent).toEqual([
      { type: 'use', power: 'bomb' },
      { type: 'leave' },
      { type: 'rejoin', gack: 0, awayMs: 2500 },
    ]);
  });

  it('stands still from the drop, and stays frozen after rejoining until the referee says go', () => {
    const m = online(21);
    m.run(60 * 8);
    const c = m.clients[0];
    const t = c.activeTicks;
    c.drop();
    m.run(30);
    expect(c.activeTicks).toBe(t);
    c.rejoin(500);
    expect(c.me?.frozen).toBe(true);
    m.run(3);
    // The referee never noticed, so play resumes at once.
    expect(c.me?.frozen).toBe(false);
    expect(c.activeTicks).toBeGreaterThan(t);
  });

  for (const [what, cutFor, noticeAfter] of [
    ['a short drop the referee never notices', 60 * 2, 20],
    ['a long one it notices, which pauses both', 60 * 8, 60 * 3],
  ] as const) {
    it(`loses and doubles no garbage over ${what}`, () => {
      const m = online(0x5eed13);
      m.run(60 * 25);
      const [c] = m.clients;
      // The connection dies, and an attack comes in over it; the client notices later, and
      // comes back after the rest.
      m.cut.add(0);
      m.run(5);
      const clear = {
        lines: 2,
        tspin: false,
        b2b: false,
        combo: 0,
        perfectClear: false,
        attack: 1,
      };
      m.referee.onMessage(1, { type: 'attack', rows: 1, clear }, m.now());
      m.run(noticeAfter - 5);
      c.drop();
      m.run(cutFor - noticeAfter);
      m.cut.delete(0);
      c.rejoin(((cutFor - noticeAfter) * 1000) / 60);
      m.run(60 * 10);
      const routed = routedTo(m, 0);
      // Garbage was lost on the wire and sent again: the test isn't passing for want of any.
      const sends = m.sentTo.filter(([to, msg]) => to === 0 && msg.type === 'garbage').length;
      expect(sends).toBeGreaterThan(routed.size);
      const total = [...routed.values()].reduce((a, b) => a + b, 0);
      expect(c.me?.gotGarbage).toBe(Math.max(...routed.keys()));
      expect(c.me?.stats.received).toBe(total);
    });
  }

  it('resumes on the same tick as the other player after a pause it missed', () => {
    const m = online(0x5eed14);
    m.run(60 * 20);
    const [a, b] = m.clients;
    m.cut.add(0);
    a.drop();
    m.run(60 * 7);
    expect(m.referee.state).toBe('paused');
    expect(b.me?.frozen).toBe(true);
    m.cut.delete(0);
    a.rejoin(7000);
    const back: [number, number] = [-1, -1];
    for (let i = 0; i < 60 * 5; i++) {
      m.step();
      for (const seat of [0, 1] as const) {
        if (back[seat] < 0 && m.clients[seat].me?.frozen === false) back[seat] = m.now();
      }
    }
    expect(back[0]).toBeGreaterThan(0);
    expect(back[0]).toBe(back[1]);
  });

  it('hears the result if the match ended while it was gone', () => {
    const m = online(0x5eed15);
    m.run(60 * 5);
    const [a] = m.clients;
    m.cut.add(0);
    a.drop();
    m.referee.onMessage(1, { type: 'leave' }, m.now());
    m.run(10);
    expect(a.result).toBeNull();
    m.cut.delete(0);
    a.rejoin(1000);
    m.run(3);
    expect(a.result).toMatchObject({ type: 'result', winner: 0, reason: 'left' });
  });
});

describe('ClientMatch: the opponent’s power-ups (GD-STORY-012)', () => {
  it('lands what falls on the opponent on the referee’s tick, and says when they use one', () => {
    const events: PlayerEvent[] = [];
    const c = new ClientMatch({ send: () => undefined, onPlayerEvent: (ev) => events.push(ev) });
    c.receive({ type: 'start', goAt: 180 }, { you: 0, holes: 1 });
    while (c.t < 185) c.step();
    // The opponent's stack: three rows of garbage at the bottom.
    const rows = emptyBoard();
    for (let y = 0; y < 3; y++) for (let x = 1; x < 10; x++) setCell(rows, x, y, GARBAGE);
    c.opponent.board = rows;
    const at = c.t + 10;
    c.receive({ type: 'power', kind: 'bomb', by: 1, at });
    c.receive({ type: 'power', kind: 'shield', by: 1, at });
    c.receive({ type: 'power', kind: 'fog', by: 0, at });
    // Lands on me, not on them.
    c.receive({ type: 'power', kind: 'rush', by: 1, at });
    expect(events.filter((e) => e.type === 'powerUse')).toEqual([
      { type: 'powerUse', p: 1, kind: 'bomb' },
      { type: 'powerUse', p: 1, kind: 'shield' },
      { type: 'powerUse', p: 1, kind: 'rush' },
    ]);
    while (c.t < at - 1) c.step();
    expect(events.some((e) => e.type === 'powerApply' && e.p === 1)).toBe(false);
    c.step();
    expect(
      events
        .filter((e) => e.type === 'powerApply' && e.p === 1)
        .map((e) => e.type === 'powerApply' && e.kind),
    ).toEqual(['bomb', 'shield', 'fog']);
    expect(snapshot(c.opponent.board)).toBe(snapshot(dropBottomRows(rows, c.rules.bombRows)));
    expect(c.opponent.fx.shieldUntil).toBe(at + c.rules.shieldSec * 60);
    expect(c.opponent.fx.fogUntil).toBe(at + c.rules.powerSec * 60);
    expect(c.opponent.fx.rushUntil).toBe(-1);
    // My own simulation took the rush the opponent sent.
    expect(c.me?.fx.rushUntil).toBe(at + c.rules.powerSec * 60);
  });
});

describe('ClientMatch: the referee’s clock (GD-STORY-013)', () => {
  /** How far a client's active time is from the referee's. */
  const apart = (m: ReturnType<typeof online>, seat: PlayerIndex) =>
    Math.abs(m.clients[seat].activeTicks - m.referee.activeTicks);

  for (const [what, cutFor] of [
    ['a drop the referee never notices', 60 * 3],
    ['a drop long enough to pause both', 60 * 8],
  ] as const) {
    it(`counts active time with the referee after ${what}`, () => {
      const m = online(0x5eed21);
      m.run(60 * 20);
      const [c] = m.clients;
      m.cut.add(0);
      c.drop();
      m.run(cutFor);
      m.cut.delete(0);
      c.rejoin((cutFor * 1000) / 60);
      m.run(60 * 6);
      // Paused time counted for nobody, and the dropped player's frozen time is made up.
      expect(apart(m, 0)).toBeLessThanOrEqual(4);
      expect(apart(m, 1)).toBeLessThanOrEqual(4);
      const levels = m.clients.map((x) => x.me?.level(x.t, x.activeTicks));
      expect(levels[0]).toBe(levels[1]);
    });
  }

  it('jumps a stalled client to the referee’s tick, without simulating the gap', () => {
    const m = online(0x5eed22);
    m.run(60 * 20);
    const [c] = m.clients;
    const pieces = c.me?.stats.pieces;
    m.stalled.add(0);
    m.run(60 * 2);
    m.stalled.delete(0);
    expect(m.now() - c.t).toBeGreaterThanOrEqual(110);
    // The next clock catches it up.
    m.run(60);
    expect(Math.abs(m.now() - c.t)).toBeLessThanOrEqual(2);
    expect(apart(m, 0)).toBeLessThanOrEqual(4);
    // The stall placed no pieces: the time passed without the player.
    expect((c.me?.stats.pieces ?? 0) - (pieces ?? 0)).toBeLessThan(5);
  });

  it('leaves a client that keeps time alone', () => {
    const m = online(0x5eed23);
    m.run(60 * 30);
    const before = m.clients.map((x) => x.activeTicks - m.referee.activeTicks);
    m.run(60 * 10);
    const after = m.clients.map((x) => x.activeTicks - m.referee.activeTicks);
    expect(after).toEqual(before);
    for (const seat of [0, 1] as const) expect(apart(m, seat)).toBeLessThanOrEqual(1);
  });
});

describe('ClientMatch: the match’s settings (GD-STORY-010)', () => {
  it('plays on the rules `start` brings, not its defaults', () => {
    const slow = new ClientMatch({ send: () => undefined });
    expect(slow.rules.rampSec).toBe(15);
    slow.receive({ type: 'start', goAt: 180 }, { you: 1, holes: 3, rules: { rampSec: 30 } });
    expect(slow.rules.rampSec).toBe(30);
    const plain = new ClientMatch({ send: () => undefined });
    plain.receive({ type: 'start', goAt: 180 }, { you: 1, holes: 3 });
    // 20 s of play: a level up every 15 s by default, every 30 s on these settings.
    expect(plain.me?.level(plain.t, 20 * TPS)).toBe(2);
    expect(slow.me?.level(slow.t, 20 * TPS)).toBe(1);
  });
});
