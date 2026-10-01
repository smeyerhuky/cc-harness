import { emptyBoard, snapshot, type PlayerStats } from '@garbage-day/engine';
import {
  DEFAULT_SETTINGS,
  encodeClientToMatch,
  parseMatchToClient,
  type MatchToClient,
} from '@garbage-day/protocol';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { CLOSE_BAD_TOKEN, CLOSE_REPLACED } from './match';
import { connect, openMatch, seat, TOKENS } from './testkit';

type Socket = Awaited<ReturnType<typeof seat>>;

/** The next message, parsed; fails the test if it doesn't parse. */
async function read(s: Socket): Promise<MatchToClient> {
  const r = parseMatchToClient(await s.next());
  if (!r.ok) throw r.error;
  return r.msg;
}

/** Reads until a message of `type` arrives; returns it and what came before. */
async function until<T extends MatchToClient['type']>(s: Socket, type: T) {
  const before: MatchToClient[] = [];
  for (;;) {
    const m = await read(s);
    if (m.type === type) return { msg: m as Extract<MatchToClient, { type: T }>, before };
    before.push(m);
  }
}

const stats: PlayerStats = {
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

/** Both seats taken on a freshly opened match, each past its `start`. */
async function started(id: string) {
  await openMatch(id);
  const a = await seat(id, 0);
  const b = await seat(id, 1);
  const startA = await until(a, 'start');
  const startB = await until(b, 'start');
  return { a, b, startA, startB };
}

describe('the Match DO', () => {
  it('starts when both seats are taken: two bags each, then a countdown', async () => {
    const { startA, startB } = await started('GD-DEAL');
    for (const s of [startA, startB]) {
      expect(s.before.map((m) => m.type)).toEqual(['bag', 'bag']);
      expect(s.msg.goAt).toBe(180);
    }
    expect(await env.MATCH.getByName('GD-DEAL').state()).toEqual({
      seated: expect.arrayContaining([0, 1]) as unknown,
      referee: 'countdown',
    });
  });

  it('deals both players the same pieces and gems, one bag at a time', async () => {
    const { a, b, startA, startB } = await started('GD-SAME');
    expect(startA.before).toEqual(startB.before);
    a.ws.send(encodeClientToMatch({ type: 'bagReq' }));
    b.ws.send(encodeClientToMatch({ type: 'bagReq' }));
    const third = [await read(a), await read(b)];
    expect(third[0]).toMatchObject({ type: 'bag' });
    expect(third[0]).toEqual(third[1]);
    // Each bag is a permutation of the seven pieces.
    for (const bag of [...startA.before, third[0]]) {
      if (bag?.type !== 'bag') throw new Error('not a bag');
      expect(bag.pieces.map((p) => p.t).sort()).toEqual(['I', 'J', 'L', 'O', 'S', 'T', 'Z']);
    }
  });

  it('never sends the match seed: each player gets only their own garbage-hole seed', async () => {
    const { startA, startB } = await started('GD-SEED');
    expect(Object.keys(startA.msg).sort()).toEqual(['goAt', 'holes', 'type']);
    expect(startA.msg.holes).not.toBe(startB.msg.holes);
  });

  it('relays positions and locks to the other player, never the next pieces', async () => {
    const { a, b } = await started('GD-RELAY');
    const cur = { t: 'T', r: 0, x: 3, y: 19 } as const;
    a.ws.send(encodeClientToMatch({ type: 'pos', cur, meter: 2, gack: 0, power: null, hold: 'I' }));
    expect(await read(b)).toEqual({
      type: 'opp',
      kind: 'pos',
      cur,
      meter: 2,
      power: null,
      hold: 'I',
    });
    const board = snapshot(emptyBoard()).replace(/^.{10}/, 'IIII......');
    b.ws.send(
      encodeClientToMatch({
        type: 'lock',
        board,
        lines: 0,
        attack: 0,
        clear: null,
        meter: 0,
        gack: 0,
        hold: null,
        power: null,
        stats,
      }),
    );
    const lock = await read(a);
    expect(lock).toMatchObject({ type: 'opp', kind: 'lock', board, stats });
    // A board, never the other player's queue.
    expect(Object.keys(lock).sort()).toEqual([
      'board',
      'clear',
      'hold',
      'kind',
      'lines',
      'meter',
      'power',
      'stats',
      'type',
    ]);
  });

  it('refuses a token that seats nobody, and a message before hello', async () => {
    await openMatch('GD-NOPE');
    const stranger = await connect('/ws/match/GD-NOPE');
    stranger.ws.send(
      encodeClientToMatch({
        type: 'hello',
        token: 'not-a-seat-token-0000',
        handle: 'Brisk Heron 42',
      }),
    );
    expect(await read(stranger)).toMatchObject({ type: 'error', code: 'bad-token' });
    expect((await stranger.closed).code).toBe(CLOSE_BAD_TOKEN);

    const rude = await connect('/ws/match/GD-NOPE');
    rude.ws.send(encodeClientToMatch({ type: 'bagReq' }));
    expect(await read(rude)).toMatchObject({ type: 'error', code: 'bad-token' });
    expect((await rude.closed).code).toBe(CLOSE_BAD_TOKEN);

    // A match nobody opened seats nobody either.
    const lost = await connect('/ws/match/GD-NEVER');
    lost.ws.send(
      encodeClientToMatch({ type: 'hello', token: TOKENS[0], handle: 'Brisk Heron 42' }),
    );
    expect(await read(lost)).toMatchObject({ type: 'error', code: 'bad-token' });
  });

  it('gives a seat to its newer socket, closing the older', async () => {
    await openMatch('GD-AGAIN');
    const first = await seat('GD-AGAIN', 0);
    // A ping round trip, so the first hello is handled before the second.
    first.ws.send('{"v":1,"t":"ping"}');
    await first.next();
    const second = await seat('GD-AGAIN', 0);
    expect((await first.closed).code).toBe(CLOSE_REPLACED);
    second.ws.close(1000);
  });

  it('opens a match once', async () => {
    expect(await openMatch('GD-ONCE')).toBe(true);
    expect(
      await env.MATCH.getByName('GD-ONCE').open({ tokens: TOKENS, settings: DEFAULT_SETTINGS }),
    ).toBe(false);
  });
});
