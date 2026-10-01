import {
  CLOSE,
  createdGame,
  DEFAULT_SETTINGS,
  encodeClientToMatch,
  joinedGame,
  type MatchSettings,
} from '@garbage-day/protocol';
import { runDurableObjectAlarm, runInDurableObject } from 'cloudflare:test';
import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { EXPIRY_MS, type MatchDO } from './match';
import { connect, ORIGIN, read, until, type Socket } from './testkit';

// Private games (GD-STORY-010): made by the Worker, joined by code, held in the Match DO's lobby
// until both players are ready, and expired after 30 minutes with nothing happening.

const CLASSIC: MatchSettings = { ...DEFAULT_SETTINGS, mode: 'classic', rampSec: 30 };

let address = 0;
/** Each test from its own address, so none runs into another's limit. */
const from = () => `198.18.0.${++address}`;

async function create(settings: MatchSettings = DEFAULT_SETTINGS, ip = from()) {
  const res = await exports.default.fetch(`${ORIGIN}/api/games`, {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip, 'content-type': 'application/json' },
    body: JSON.stringify({ settings }),
  });
  expect(res.status).toBe(200);
  expect(res.headers.get('cache-control')).toBe('no-store');
  return createdGame.parse(await res.json());
}

async function join(code: string, ip = from()) {
  const res = await exports.default.fetch(`${ORIGIN}/api/games/${code}/join`, {
    method: 'POST',
    headers: { 'CF-Connecting-IP': ip },
  });
  return { status: res.status, body: joinedGame.parse(await res.json()) };
}

/** A socket on game `code` that has said hello with `token`. */
async function enter(code: string, token: string, handle: string): Promise<Socket> {
  const s = await connect(`/ws/match/${code}`, from());
  s.ws.send(encodeClientToMatch({ type: 'hello', token, handle }));
  return s;
}

/** A game with both players in its lobby, past the lobby messages their arrival sent. */
async function lobbyOfTwo(settings?: MatchSettings) {
  const { code, token } = await create(settings);
  const host = await enter(code, token, 'Brisk Heron 42');
  await until(host, 'lobby');
  const guestJoin = await join(code);
  if (!('token' in guestJoin.body)) throw new Error('no guest token');
  const guest = await enter(code, guestJoin.body.token, 'Rowdy Puffin 22');
  await until(guest, 'lobby');
  await until(host, 'lobby');
  return { code, host, guest };
}

describe('private games: making and joining', () => {
  it('are made with the host’s settings, under a code, with the host’s token', async () => {
    const { code, token } = await create(CLASSIC);
    expect(code).toMatch(/^GD-[0-9A-HJKMNP-TV-Z]{4}$/);
    const host = await enter(code, token, 'Brisk Heron 42');
    expect(await read(host)).toEqual({
      type: 'lobby',
      handles: ['Brisk Heron 42', null],
      settings: CLASSIC,
      ready: [false, false],
      you: 0,
    });
    host.ws.close(1000);
  });

  it('give the guest seat once, then say the game is full', async () => {
    const { code } = await create();
    const first = await join(code);
    expect(first.status).toBe(200);
    expect(first.body).toHaveProperty('token');
    expect(await join(code)).toEqual({ status: 409, body: { error: 'full' } });
  });

  it('say no game has a code nobody made, or one that is no code at all', async () => {
    expect(await join('GD-ZZZZ')).toEqual({ status: 404, body: { error: 'none' } });
    expect(await join('Q-0123456789')).toEqual({ status: 404, body: { error: 'none' } });
  });

  it('take a quick or bot match for no private game', async () => {
    await env.MATCH.getByName('GD-QQQQ').open({
      tokens: ['token-seat-zero-0000', 'token-seat-one-11111'],
      settings: DEFAULT_SETTINGS,
    });
    expect(await join('GD-QQQQ')).toEqual({ status: 404, body: { error: 'none' } });
  });

  it('refuse settings outside the PRD’s choices, and anything but POST', async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/games`, {
      method: 'POST',
      body: JSON.stringify({ settings: { ...DEFAULT_SETTINGS, rampSec: 12 } }),
    });
    expect(res.status).toBe(400);
    for (const path of ['/api/games', '/api/games/GD-7KQ4/join']) {
      const get = await exports.default.fetch(`${ORIGIN}${path}`);
      expect({ path, status: get.status }).toEqual({ path, status: 405 });
    }
  });
});

describe('private games: the lobby', () => {
  it('shows both handles to both, each told its own seat', async () => {
    const { code, token } = await create();
    const host = await enter(code, token, 'Brisk Heron 42');
    await until(host, 'lobby');
    const g = await join(code);
    if (!('token' in g.body)) throw new Error('no guest token');
    const guest = await enter(code, g.body.token, 'Rowdy Puffin 22');
    const both = ['Brisk Heron 42', 'Rowdy Puffin 22'];
    expect((await until(guest, 'lobby')).msg).toMatchObject({ handles: both, you: 1 });
    expect((await until(host, 'lobby')).msg).toMatchObject({ handles: both, you: 0 });
    host.ws.close(1000);
    guest.ws.close(1000);
  });

  it('lets only the host change the settings, which asks both to be ready again', async () => {
    const { host, guest } = await lobbyOfTwo();
    guest.ws.send(encodeClientToMatch({ type: 'ready' }));
    expect((await until(host, 'lobby')).msg.ready).toEqual([false, true]);
    await until(guest, 'lobby');
    // The guest can't change them: nothing is sent, so the host's change is the next lobby.
    guest.ws.send(encodeClientToMatch({ type: 'settings', settings: CLASSIC }));
    host.ws.send(
      encodeClientToMatch({ type: 'settings', settings: { ...CLASSIC, pauseBudget: 0 } }),
    );
    for (const s of [host, guest]) {
      expect((await until(s, 'lobby')).msg).toMatchObject({
        settings: { ...CLASSIC, pauseBudget: 0 },
        ready: [false, false],
      });
    }
    host.ws.close(1000);
    guest.ws.close(1000);
  });

  it('starts the match when both are ready, on the game’s settings', async () => {
    const { host, guest } = await lobbyOfTwo(CLASSIC);
    host.ws.send(encodeClientToMatch({ type: 'ready' }));
    await until(guest, 'lobby');
    guest.ws.send(encodeClientToMatch({ type: 'ready' }));
    const [h, g] = [(await until(host, 'start')).msg, (await until(guest, 'start')).msg];
    expect(h).toMatchObject({ settings: CLASSIC, you: 0 });
    expect(g).toMatchObject({ settings: CLASSIC, you: 1 });
    host.ws.close(1000);
    guest.ws.close(1000);
  });

  it('forgets a player’s Ready when they leave the lobby', async () => {
    const { host, guest } = await lobbyOfTwo();
    guest.ws.send(encodeClientToMatch({ type: 'ready' }));
    expect((await until(host, 'lobby')).msg.ready).toEqual([false, true]);
    guest.ws.close(1000);
    expect((await until(host, 'lobby')).msg.ready).toEqual([false, false]);
    host.ws.close(1000);
  });
});

describe('private games: expiry', () => {
  it('waits 30 minutes from the last thing that happened', async () => {
    const { code, token } = await create();
    const stub = env.MATCH.getByName(code);
    const before = Date.now();
    const host = await enter(code, token, 'Brisk Heron 42');
    await until(host, 'lobby');
    const alarm = await runInDurableObject(stub, (_: MatchDO, state) => state.storage.getAlarm());
    expect(alarm).toBeGreaterThanOrEqual(before + EXPIRY_MS);
    host.ws.close(1000);
  });

  it('expires an unplayed game: the lobby hears so, and the link says so after', async () => {
    const { code, token } = await create();
    const host = await enter(code, token, 'Brisk Heron 42');
    await until(host, 'lobby');
    expect(await runDurableObjectAlarm(env.MATCH.getByName(code))).toBe(true);
    expect(await read(host)).toMatchObject({ type: 'error', code: 'expired' });
    expect((await host.closed).code).toBe(CLOSE.gone);
    expect(await join(code)).toEqual({ status: 410, body: { error: 'expired' } });
    const again = await enter(code, token, 'Brisk Heron 42');
    expect(await read(again)).toMatchObject({ type: 'error', code: 'expired' });
    // Its code is never handed out again, so an old link can't lead into a new game.
    expect(
      await env.MATCH.getByName(code).open({ tokens: [token, token], settings: DEFAULT_SETTINGS }),
    ).toBe(false);
  });

  it('does not expire a game once its match has started', async () => {
    const { code, host, guest } = await lobbyOfTwo();
    host.ws.send(encodeClientToMatch({ type: 'ready' }));
    guest.ws.send(encodeClientToMatch({ type: 'ready' }));
    await until(host, 'start');
    const stub = env.MATCH.getByName(code);
    expect(
      await runInDurableObject(stub, (_: MatchDO, state) => state.storage.getAlarm()),
    ).toBeNull();
    host.ws.close(1000);
    guest.ws.close(1000);
  });
});
