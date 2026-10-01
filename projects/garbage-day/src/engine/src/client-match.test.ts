import { describe, expect, it } from 'vitest';
import { snapshot } from './board';
import { Bot, botConfig } from './bot';
import { ClientMatch } from './client-match';
import type { PlayerIndex } from './constants';
import type { ClientMessage, ServerMessage } from './messages';
import { Referee } from './referee';

/**
 * Two clients and a referee joined by a one-tick network, as the Match DO joins two browsers:
 * every message waits for the next tick, and only `ClientMatch` sees the clients' side.
 */
function online(seed: number) {
  const toReferee: { from: PlayerIndex; msg: ClientMessage }[] = [];
  const toClient: { to: PlayerIndex; msg: ServerMessage }[] = [];
  const sentBy: [ClientMessage[], ClientMessage[]] = [[], []];
  const heard: [ServerMessage[], ServerMessage[]] = [[], []];
  const holes = [0x1111, 0x2222] as const;
  const clients = ([0, 1] as const).map(
    (seat) =>
      new ClientMatch({
        send: (msg) => {
          sentBy[seat].push(msg);
          toReferee.push({ from: seat, msg });
        },
      }),
  ) as [ClientMatch, ClientMatch];
  const referee = new Referee(seed, clients[0].rules, {
    send: (to, msg) => toClient.push({ to, msg }),
    emit: () => undefined,
  });
  let T = 0;
  referee.start(T);
  const step = () => {
    T++;
    for (const { from, msg } of toReferee.splice(0)) referee.onMessage(from, msg, T);
    referee.tick(T);
    for (const { to, msg } of toClient.splice(0)) {
      heard[to].push(msg);
      clients[to].receive(msg, { holes: holes[to], you: to });
    }
    for (const c of clients) {
      if (c.me && !c.controller) c.controller = new Bot(c.me, seed, botConfig(6, 10));
      c.step();
      // A heartbeat each second, as the socket's ping does.
      if (T % 60 === 0) toReferee.push({ from: c.seat, msg: { type: 'hb' } });
    }
  };
  return { clients, referee, sentBy, heard, step, now: () => T };
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
