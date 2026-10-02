import {
  DEFAULT_RULES,
  Referee,
  snapshot,
  type PlayerIndex,
  type ServerMessage,
} from '@garbage-day/engine';
import {
  DEFAULT_SETTINGS,
  encodeMatchToClient,
  parseClientToMatch,
  type BotMark,
  type ClientToMatch,
  type MatchToClient,
} from '@garbage-day/protocol';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  /** Each session's links, newest last; a dead one carries nothing either way. */
  const links: [Wire[], Wire[]] = [[], []];
  const toClient: { to: PlayerIndex; msg: MatchToClient }[] = [];
  const sentTo: { to: PlayerIndex; msg: ServerMessage }[] = [];
  let referee = new Referee(seed, DEFAULT_RULES, {
    send: (to: PlayerIndex, msg: ServerMessage) => {
      sentTo.push({ to, msg });
      toClient.push({
        to,
        msg: msg.type === 'start' ? { ...msg, holes: 7 + to, you: to } : msg,
      });
    },
    emit: () => undefined,
  });
  let T = 0;
  let started = false;
  let rematchWanted: [boolean, boolean] = [false, false];
  const connectFor =
    (i: PlayerIndex): Connect =>
    (h) => {
      const wire: Wire = { h, dead: false };
      links[i].push(wire);
      queueMicrotask(() => {
        if (!wire.dead) h.open();
      });
      return {
        send: (text) => {
          if (!wire.dead) toReferee.push({ from: h, text });
        },
        close: () => {
          wire.dead = true;
        },
      };
    };
  const wireOf = (h: LinkHandlers) => [...links[0], ...links[1]].find((w) => w.h === h);
  const inputs = [new InputController(), new InputController()] as const;
  const effects: [MatchEffect[], MatchEffect[]] = [[], []];
  const sessions = ([0, 1] as const).map((i) => {
    const s = new OnlineSession({ handle: 'Brisk Heron 42', input: inputs[i] });
    s.onEffect((e) => effects[i].push(e));
    s.start({ connect: connectFor(i), token: TOKENS[i] });
    return s;
  }) as [OnlineSession, OnlineSession];
  let now = 1000;
  const tick = () => {
    T++;
    for (const { from, text } of toReferee.splice(0)) {
      if (wireOf(from)?.dead) continue;
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
    // The DO's auto-response answers each live socket's ping, which the referee hears as a heartbeat.
    if (started && T % 60 === 0) {
      for (const seat of [0, 1] as const) {
        const h = handlers[seat];
        if (h && !wireOf(h)?.dead) referee.onMessage(seat, { type: 'hb' }, T);
      }
    }
    if (started) referee.tick(T);
    for (const { to, msg } of toClient.splice(0)) {
      const h = handlers[to];
      if (h && !wireOf(h)?.dead) h.message(encodeMatchToClient(msg));
    }
    now += FRAME;
    for (const s of sessions) s.frame(now);
  };
  const ticks = async (n: number) => {
    await Promise.resolve();
    for (let i = 0; i < n; i++) tick();
  };
  /** Session `i`'s connection dies: nothing more crosses it. With `notice`, its client sees it close. */
  const kill = (i: PlayerIndex, notice = true) => {
    const wire = links[i].at(-1);
    if (!wire) throw new Error('no link');
    wire.dead = true;
    if (notice) wire.h.close(1006);
  };
  /** The garbage the referee routed to `seat`, by id; a resend counts once. */
  const routedTo = (seat: PlayerIndex) => {
    const byId = new Map<number, number>();
    for (const { to, msg } of sentTo)
      if (to === seat && msg.type === 'garbage') byId.set(msg.id, msg.rows);
    return byId;
  };
  return { sessions, inputs, effects, get referee() { return referee; }, ticks, links, kill, routedTo, now: () => T };
}

interface Wire {
  readonly h: LinkHandlers;
  dead: boolean;
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


  it('agrees to a rematch, renews the match, and plays again', async () => {
    const c = court();
    await c.ticks(200);
    for (let i = 0; i < 60 * 40 && !c.referee.result; i++) {
      if (i % 3 === 0) c.inputs[0].press('hard');
      await c.ticks(1);
    }
    await c.ticks(5);
    expect(c.referee.state).toBe('over');
    
    // Rematch
    c.sessions[0].rematch();
    await c.ticks(1);
    expect(c.sessions[0].getSnapshot().rematch?.mine).toBe(true);
    expect(c.sessions[1].getSnapshot().rematch?.theirs).toBe(true);

    c.sessions[1].rematch();
    await c.ticks(1);
    
    // Both agreed, so match is renewed and restarts
    await c.ticks(5);
    expect(c.sessions[0].getSnapshot().phase).toBe('countdown');
    expect(c.sessions[1].getSnapshot().phase).toBe('countdown');
  });

describe('OnlineSession: a bot rival (GD-TICKET-016)', () => {
  it('passes on that the rival is a bot when the Match DO says so', async () => {
    const link: { h?: LinkHandlers } = {};
    const connect: Connect = (h) => {
      link.h = h;
      queueMicrotask(() => h.open());
      return { send: () => undefined, close: () => undefined };
    };
    const marks: BotMark[] = [];
    const s = new OnlineSession({
      handle: 'Brisk Heron 42',
      input: new InputController(),
      onRivalBot: (bot) => marks.push(bot),
    });
    s.start({ connect, token: TOKENS[0] });
    await Promise.resolve();
    link.h?.message(encodeMatchToClient({ type: 'start', goAt: 180, holes: 1, you: 0 }));
    expect(marks).toEqual([]);
    link.h?.message(
      encodeMatchToClient({
        type: 'start',
        goAt: 180,
        holes: 1,
        you: 0,
        rivalBot: { skill: 8, speed: 3 },
      }),
    );
    expect(marks).toEqual([{ skill: 8, speed: 3 }]);
    s.close();
  });
});

describe('OnlineSession: a private game’s lobby (GD-STORY-010)', () => {
  it('keeps the lobby, says Ready and the settings, and starts on the game’s rules', async () => {
    const link: { h?: LinkHandlers } = {};
    const sent: string[] = [];
    const connect: Connect = (h) => {
      link.h = h;
      queueMicrotask(() => h.open());
      return { send: (text) => sent.push(text), close: () => undefined };
    };
    const starts: unknown[] = [];
    const s = new OnlineSession({
      handle: 'Brisk Heron 42',
      input: new InputController(),
      onStart: (lobby) => starts.push(lobby?.handles),
    });
    const changes = vi.fn();
    s.subscribe(changes);
    s.start({ connect, token: TOKENS[0] });
    await Promise.resolve();
    expect(s.getLobby()).toBeNull();
    const lobby: MatchToClient = {
      type: 'lobby',
      handles: ['Brisk Heron 42', 'Rowdy Puffin 22'],
      settings: { ...DEFAULT_SETTINGS, rampSec: 30 },
      ready: [false, true],
      you: 0,
    };
    link.h?.message(encodeMatchToClient(lobby));
    expect(s.getLobby()).toEqual(lobby);
    expect(changes).toHaveBeenCalled();
    s.ready();
    s.changeSettings({ ...DEFAULT_SETTINGS, mode: 'classic' });
    const said = sent.map((t) => parseClientToMatch(t)).flatMap((r) => (r.ok ? [r.msg] : []));
    expect(said.slice(-2)).toEqual([
      { type: 'ready' },
      { type: 'settings', settings: { ...DEFAULT_SETTINGS, mode: 'classic' } },
    ]);
    link.h?.message(
      encodeMatchToClient({
        type: 'start',
        goAt: 180,
        holes: 1,
        you: 0,
        settings: { ...DEFAULT_SETTINGS, rampSec: 30 },
      }),
    );
    expect(starts).toEqual([['Brisk Heron 42', 'Rowdy Puffin 22']]);
    expect(s.match.rules.rampSec).toBe(30);
    s.close();
  });

  it('says why the Match DO turned the seat away', async () => {
    const link: { h?: LinkHandlers } = {};
    const connect: Connect = (h) => {
      link.h = h;
      queueMicrotask(() => h.open());
      return { send: () => undefined, close: () => undefined };
    };
    const s = new OnlineSession({ handle: 'Brisk Heron 42', input: new InputController() });
    s.start({ connect, token: TOKENS[0] });
    await Promise.resolve();
    expect(s.getRefusal()).toBeNull();
    link.h?.message(encodeMatchToClient({ type: 'error', code: 'rate', message: 'Slow down' }));
    expect(s.getRefusal()).toBeNull();
    link.h?.message(encodeMatchToClient({ type: 'error', code: 'expired', message: 'Gone' }));
    expect(s.getRefusal()).toBe('expired');
    s.close();
  });
});

describe('OnlineSession: the other player’s power-ups (GD-STORY-012)', () => {
  it('shows them used and landing, from each player’s own side', async () => {
    const c = court();
    await c.ticks(200);
    // Seat 1 fires a Shield; the referee stamps it for both screens.
    c.referee.onMessage(1, { type: 'use', power: 'shield' }, c.now());
    await c.ticks(40);
    expect(c.effects[0]).toContainEqual({ kind: 'powerUse', p: 1, power: 'shield' });
    expect(c.effects[0]).toContainEqual({ kind: 'powerApply', p: 1, power: 'shield', by: 1 });
    expect(c.sessions[0].getSnapshot().players[1].shielded).toBe(true);
    // On seat 1's own screen it is theirs: side 0.
    expect(c.effects[1]).toContainEqual({ kind: 'powerApply', p: 0, power: 'shield', by: 0 });
    expect(c.sessions[1].getSnapshot().players[0].shielded).toBe(true);
  });
});

describe('OnlineSession: losing the connection (GD-TICKET-013)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Lets the socket's backoff run out, and its new link open. */
  const reconnect = async (ms = 1000) => {
    vi.advanceTimersByTime(ms);
    await Promise.resolve();
  };

  it('freezes, says it is reconnecting, comes back, and loses no garbage', async () => {
    const c = court(0x5eed16);
    await c.ticks(60 * 6);
    const [a] = c.sessions;
    const t = a.match.activeTicks;
    // The connection dies unnoticed, an attack is lost on it, then the client notices.
    c.kill(0, false);
    const clear = { lines: 3, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 2 };
    c.referee.onMessage(1, { type: 'attack', rows: 2, clear }, c.now());
    await c.ticks(30);
    c.links[0].at(-1)?.h.close(1006);
    await c.ticks(30);
    expect(a.getSnapshot().connection).toBe('reconnecting');
    const frozenAt = a.match.activeTicks;
    await c.ticks(60);
    expect(a.match.activeTicks).toBe(frozenAt);
    expect(frozenAt - t).toBeLessThanOrEqual(31);
    // The socket comes back on its own: hello, then rejoin, and play goes on.
    await reconnect();
    expect(c.links[0]).toHaveLength(2);
    await c.ticks(60 * 2);
    expect(a.getSnapshot().connection).toBe('online');
    expect(a.getSnapshot().phase).toBe('playing');
    expect(a.match.activeTicks).toBeGreaterThan(frozenAt);
    const routed = c.routedTo(0);
    expect(routed.size).toBeGreaterThan(0);
    const total = [...routed.values()].reduce((x, y) => x + y, 0);
    expect(a.match.me?.stats.received).toBe(total);
    expect(a.match.me?.gotGarbage).toBe(Math.max(...routed.keys()));
  });

  it('after a drop long enough to pause both, resumes on the same tick as the other player', async () => {
    const c = court(0x5eed17);
    await c.ticks(60 * 6);
    const [a, b] = c.sessions;
    c.kill(0);
    await c.ticks(60 * 7);
    expect(c.referee.state).toBe('paused');
    expect(b.getSnapshot().phase).toBe('paused');
    await reconnect();
    const back: [number, number] = [-1, -1];
    const last = [a.match.activeTicks, b.match.activeTicks];
    for (let i = 0; i < 60 * 5; i++) {
      await c.ticks(1);
      for (const [k, s] of [a, b].entries()) {
        if (back[k] === -1 && s.match.activeTicks > (last[k] ?? 0)) back[k] = c.now();
      }
    }
    expect(back[0]).toBeGreaterThan(0);
    expect(back[0]).toBe(back[1]);
  });

  it('gives up for good when the server closes it meaning it, and says the connection is lost', async () => {
    const c = court();
    await c.ticks(60 * 4);
    const [a] = c.sessions;
    c.links[0].at(-1)?.h.close(4000);
    await reconnect(10_000);
    expect(c.links[0]).toHaveLength(1);
    expect(a.getSnapshot().connection).toBe('lost');
    expect(a.inspect().referee).toBe('lost');
  });
});
