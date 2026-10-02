import { emptyBoard, snapshot, type PlayerStats } from '@garbage-day/engine';
import { CLOSE, DEFAULT_SETTINGS, encodeClientToMatch } from '@garbage-day/protocol';
import { runInDurableObject } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { MatchDO } from './match';
import { connect, openMatch, read, seat, TOKENS, until } from './testkit';

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
    expect(Object.keys(startA.msg).sort()).toEqual(['goAt', 'holes', 'settings', 'type', 'you']);
    expect([startA.msg.you, startB.msg.you]).toEqual([0, 1]);
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
    expect((await stranger.closed).code).toBe(CLOSE.badToken);

    const rude = await connect('/ws/match/GD-NOPE');
    rude.ws.send(encodeClientToMatch({ type: 'bagReq' }));
    expect(await read(rude)).toMatchObject({ type: 'error', code: 'bad-token' });
    expect((await rude.closed).code).toBe(CLOSE.badToken);

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
    expect((await first.closed).code).toBe(CLOSE.replaced);
    second.ws.close(1000);
  });

  it('takes a player back mid-match: the new socket rejoins, and nothing starts again', async () => {
    const { a, b } = await started('GD-BACK');
    const again = await seat('GD-BACK', 0, '203.0.113.9');
    expect((await a.closed).code).toBe(CLOSE.replaced);
    again.ws.send(encodeClientToMatch({ type: 'rejoin', gack: 0 }));
    const { msg, before } = await until(again, 'resume');
    expect(msg).toMatchObject({ type: 'resume', by: 0, free: true });
    expect(before.map((m) => m.type)).not.toContain('start');
    expect((await env.MATCH.getByName('GD-BACK').state()).seated).toHaveLength(2);
    again.ws.close(1000);
    b.ws.close(1000);
  });

  it('says a match it lost is gone, rather than dealing it again', async () => {
    const { a, b } = await started('GD-GONE');
    // What a restart leaves behind: the stored setup and the mark that it started, no referee.
    await runInDurableObject(env.MATCH.getByName('GD-GONE'), (instance: MatchDO) => {
      (instance as unknown as { running: unknown }).running = null;
    });
    const back = await seat('GD-GONE', 0, '203.0.113.10');
    expect(await read(back)).toMatchObject({ type: 'error', code: 'expired' });
    expect((await back.closed).code).toBe(CLOSE.gone);
    a.ws.close(1000);
    b.ws.close(1000);
  });

  it('tells both players the referee’s clock every second once play starts', async () => {
    const { a, b, startA } = await started('GD-CLOCK');
    const [ca, cb] = [await until(a, 'clock'), await until(b, 'clock')];
    for (const { msg } of [ca, cb]) {
      // Not before go: the countdown ends at the start's go tick.
      expect(msg.tick).toBeGreaterThanOrEqual(startA.msg.goAt);
      expect(msg.active).toBeGreaterThanOrEqual(0);
      expect(msg.active).toBeLessThanOrEqual(msg.tick - startA.msg.goAt + 1);
    }
    const next = await until(a, 'clock');
    expect(next.msg.tick - ca.msg.tick).toBeGreaterThanOrEqual(50);
    a.ws.close(1000);
    b.ws.close(1000);
  }, 15_000);

  it('tells a player their rival is a bot when the bot says so, and only them', async () => {
    await openMatch('GD-BOTS');
    const person = await seat('GD-BOTS', 0);
    const bot = await connect('/ws/match/GD-BOTS', '203.0.113.20');
    bot.ws.send(
      encodeClientToMatch({
        type: 'hello',
        token: TOKENS[1],
        handle: 'Steady Bot 1',
        bot: { skill: 8, speed: 3 },
      }),
    );
    const [toPerson, toBot] = [await until(person, 'start'), await until(bot, 'start')];
    expect(toPerson.msg).toMatchObject({ you: 0, rivalBot: { skill: 8, speed: 3 } });
    expect(toBot.msg.you).toBe(1);
    expect(toBot.msg).not.toHaveProperty('rivalBot');
    person.ws.close(1000);
    bot.ws.close(1000);
  });

  it('opens a match once', async () => {
    expect(await openMatch('GD-ONCE')).toBe(true);
    expect(
      await env.MATCH.getByName('GD-ONCE').open({ tokens: TOKENS, settings: DEFAULT_SETTINGS }),
    ).toBe(false);
  });
});
