import {
  DEFAULT_RULES,
  Referee,
  snapshot,
  type PlayerIndex,
  type ServerMessage,
} from '@garbage-day/engine';
import {
  encodeMatchToClient,
  parseClientToMatch,
  type ClientToMatch,
  type MatchToClient,
} from '@garbage-day/protocol';
import { describe, expect, it } from 'vitest';
import { InputController } from '../input/InputController';
import type { Connect, LinkHandlers } from '../net/link';
import type { MatchEffect, WireEntry } from './MatchSession';
import { OnlineSession } from './OnlineSession';

const TOKENS = ['token-seat-zero-0000', 'token-seat-one-11111'] as const;
const FRAME = 1000 / 60;

/**
 * Two online sessions and a referee, joined by text through the protocol's codec as the Match
 * DO joins them: seated by their `hello`, started together, and stepped a tick at a time.
 */
function court(seed = 0x0dd) {
  const seats = new Map<LinkHandlers, PlayerIndex>();
  const handlers: (LinkHandlers | null)[] = [null, null];
  const toReferee: { from: LinkHandlers; text: string }[] = [];
  const toClient: { to: PlayerIndex; msg: MatchToClient }[] = [];
  const referee = new Referee(seed, DEFAULT_RULES, {
    send: (to: PlayerIndex, msg: ServerMessage) =>
      toClient.push({
        to,
        msg: msg.type === 'start' ? { ...msg, holes: 7 + to, you: to } : msg,
      }),
    emit: () => undefined,
  });
  let T = 0;
  let started = false;
  const connect: Connect = (h) => {
    queueMicrotask(() => h.open());
    return {
      send: (text) => toReferee.push({ from: h, text }),
      close: () => undefined,
    };
  };
  const inputs = [new InputController(), new InputController()] as const;
  const effects: [MatchEffect[], MatchEffect[]] = [[], []];
  const sessions = ([0, 1] as const).map((i) => {
    const s = new OnlineSession({
      connect,
      token: TOKENS[i],
      handle: 'Brisk Heron 42',
      input: inputs[i],
    });
    s.onEffect((e) => effects[i].push(e));
    return s;
  }) as [OnlineSession, OnlineSession];
  let now = 1000;
  const tick = () => {
    T++;
    for (const { from, text } of toReferee.splice(0)) {
      const r = parseClientToMatch(text);
      if (!r.ok) throw r.error;
      const msg: ClientToMatch = r.msg;
      if (msg.type === 'hello') {
        const seat = TOKENS.indexOf(msg.token as (typeof TOKENS)[number]) as PlayerIndex;
        seats.set(from, seat);
        handlers[seat] = from;
        if (!started && handlers[0] && handlers[1]) {
          started = true;
          referee.start(T);
        }
        continue;
      }
      if (msg.type === 'ready' || msg.type === 'settings') continue;
      const seat = seats.get(from);
      if (seat !== undefined) referee.onMessage(seat, msg, T);
    }
    if (started) referee.tick(T);
    for (const { to, msg } of toClient.splice(0)) handlers[to]?.message(encodeMatchToClient(msg));
    now += FRAME;
    for (const s of sessions) s.frame(now);
  };
  const ticks = async (n: number) => {
    await Promise.resolve();
    for (let i = 0; i < n; i++) tick();
  };
  return { sessions, inputs, effects, referee, ticks };
}

describe('OnlineSession', () => {
  it('says hello with its token, and counts down from the start it hears', async () => {
    const c = court();
    const up: WireEntry[] = [];
    c.sessions[1].onWire((e) => up.push(e));
    expect(c.sessions[0].getSnapshot()).toMatchObject({ phase: 'countdown', countdown: 3 });
    await c.ticks(3);
    expect(c.referee.state).toBe('countdown');
    expect(up.filter((e) => e.dir === 'down').map((e) => e.msg.type)).toEqual([
      'bag',
      'bag',
      'start',
    ]);
    expect(c.sessions[1].match.seat).toBe(1);
    expect(c.sessions[1].getSnapshot().players[0].next).toHaveLength(5);
    await c.ticks(200);
    for (const s of c.sessions) expect(s.getSnapshot().phase).toBe('playing');
  });

  it('shows the other player as the referee relays them', async () => {
    const c = court();
    await c.ticks(200);
    c.inputs[0].press('hard');
    await c.ticks(30);
    const [a, b] = c.sessions;
    expect(snapshot(b.board(1).board)).toBe(snapshot(a.board(0).board));
    expect(b.getSnapshot().players[1].totals.pieces).toBe(1);
    expect(c.effects[1]).toContainEqual({ kind: 'lock', p: 1 });
    // The other player's next pieces are never known.
    expect(b.getSnapshot().players[1].next).toEqual([]);
  });

  it('ends the same way on both screens, each seeing it from its own side', async () => {
    const c = court();
    await c.ticks(200);
    // Seat 0 drops every piece at once, and tops out first.
    for (let i = 0; i < 60 * 40 && !c.referee.result; i++) {
      if (i % 3 === 0) c.inputs[0].press('hard');
      await c.ticks(1);
    }
    await c.ticks(5);
    expect(c.referee.result).toMatchObject({ winner: 1, reason: 'topout', by: 0 });
    expect(c.sessions[0].getSnapshot().result).toMatchObject({ winner: 1, by: 0 });
    expect(c.sessions[1].getSnapshot().result).toMatchObject({ winner: 0, by: 1 });
    expect(c.sessions[1].getSnapshot().players[1].alive).toBe(false);
    for (const s of c.sessions) expect(s.getSnapshot().phase).toBe('over');
  });
});
