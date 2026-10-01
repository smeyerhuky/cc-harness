import {
  botMatch,
  CLOSE,
  DEFAULT_SETTINGS,
  encodeClientToMatch,
  parseLobbyToClient,
  parseMatchToClient,
  PING,
  PONG,
} from '@garbage-day/protocol';
import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Health } from './index';
import { MATCH_LIMITS } from './match';
import { connect as open, openMatch, ORIGIN, seat, until } from './testkit';

const ready = encodeClientToMatch({ type: 'ready' });

describe('the Worker', () => {
  it('answers /api/health from both Durable Objects', async () => {
    const res = await exports.default.fetch(`${ORIGIN}/api/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json<Health>()).toEqual({
      ok: true,
      environment: 'production',
      protocol: 1,
      lobby: 'ok',
      match: 'ok',
    });
  });

  it('reports a local request as development', async () => {
    const res = await exports.default.fetch('http://localhost/api/health');
    expect((await res.json<Health>()).environment).toBe('development');
  });

  it('answers 404 for an unknown API or socket path, not the app page', async () => {
    for (const path of [
      '/api/nope',
      '/ws/nope',
      '/ws/match/',
      '/ws/match/a/b',
      '/ws/match/bad%20id',
    ]) {
      const res = await exports.default.fetch(`${ORIGIN}${path}`, {
        headers: { Upgrade: 'websocket' },
      });
      expect({ path, status: res.status }).toEqual({ path, status: 404 });
    }
  });

  it('answers 426 to a socket path asked for without an upgrade', async () => {
    for (const path of ['/ws/lobby', '/ws/match/GD-7KQ4']) {
      const res = await exports.default.fetch(`${ORIGIN}${path}`);
      expect({ path, status: res.status }).toEqual({ path, status: 426 });
    }
  });

  it('binds both Durable Object classes', async () => {
    expect(await env.LOBBY.getByName('quick').health()).toBe('ok');
    expect(await env.MATCH.getByName('GD-7KQ4').health()).toBe('ok');
  });
});

describe('sockets', () => {
  it('upgrade to the lobby and to a match, and answer a ping with a pong', async () => {
    for (const path of ['/ws/lobby', '/ws/match/GD-PING']) {
      const s = await open(path);
      s.ws.send(PING);
      expect(await s.next()).toBe(PONG);
      s.ws.close(1000);
    }
  });

  it('take a valid message without complaint, and count it', async () => {
    await openMatch('GD-GOOD');
    const s = await seat('GD-GOOD', 0);
    s.ws.send(ready);
    // A bad message after it: its error proves the DO has handled both.
    s.ws.send('nope');
    const error = parseMatchToClient(await s.next());
    expect(error).toMatchObject({ ok: true, msg: { type: 'error', code: 'invalid' } });
    const counts = await env.MATCH.getByName('GD-GOOD').wireCounts();
    // The hello and the ready.
    expect(counts).toMatchObject({ accepted: 2, malformed: 1, closed: 0 });
    s.ws.close(1000);
  });

  it('refuse another protocol version, and an attack worth more than its clear', async () => {
    const s = await open('/ws/match/GD-BADS');
    s.ws.send('{"v":2,"t":"ready"}');
    expect(parseMatchToClient(await s.next())).toMatchObject({
      msg: { type: 'error', code: 'version' },
    });
    const clear = { lines: 1, tspin: false, b2b: false, combo: 0, perfectClear: false, attack: 0 };
    // A second later, so the error isn't held back.
    await new Promise((r) => setTimeout(r, 1000));
    s.ws.send(encodeClientToMatch({ type: 'attack', rows: 10, clear }));
    const error = parseMatchToClient(await s.next());
    expect(error).toMatchObject({ msg: { type: 'error', code: 'invalid' } });
    expect(error.ok && error.msg.type === 'error' && error.msg.message).toMatch(/attack/);
    expect(await env.MATCH.getByName('GD-BADS').wireCounts()).toMatchObject({
      version: 1,
      invalid: 1,
      accepted: 0,
    });
    s.ws.close(1000);
  });

  it('close a match socket that floods, after its burst', async () => {
    await openMatch('GD-FLOOD');
    const s = await seat('GD-FLOOD', 0);
    for (let i = 0; i < 200; i++) s.ws.send(ready);
    expect(parseMatchToClient(await s.next())).toMatchObject({
      msg: { type: 'error', code: 'rate' },
    });
    expect((await s.closed).code).toBe(CLOSE.refused);
    const counts = await env.MATCH.getByName('GD-FLOOD').wireCounts();
    expect(counts.accepted).toBeGreaterThanOrEqual(MATCH_LIMITS.burst);
    expect(counts.accepted).toBeLessThan(MATCH_LIMITS.burst + MATCH_LIMITS.strikes);
    // Refusals drain as time passes, so the close comes at the limit or just after it.
    expect(counts.rate).toBeGreaterThanOrEqual(MATCH_LIMITS.strikes);
    expect(counts.rate).toBeLessThanOrEqual(MATCH_LIMITS.strikes + 2);
    expect(counts.closed).toBe(1);
  });

  it('close a lobby socket that floods, with the lobby error shape', async () => {
    const s = await open('/ws/lobby', '198.51.100.9');
    for (let i = 0; i < 50; i++) s.ws.send('{"v":1,"t":"queue","handle":"Brisk Heron 42"}');
    // Past the waiting counts its accepted messages earned, the refusal.
    let msg = parseLobbyToClient(await s.next());
    while (msg.ok && msg.msg.type === 'waiting') msg = parseLobbyToClient(await s.next());
    expect(msg).toMatchObject({ msg: { type: 'error', code: 'rate' } });
    expect((await s.closed).code).toBe(CLOSE.refused);
  });

  it('limit socket upgrades from one address, and not from another', async () => {
    // The limiter counts 60 a minute in fixed windows: a run that crosses into the next window
    // starts the count again, so the refusal comes within two windows' worth.
    const opened: WebSocket[] = [];
    let refused = 0;
    for (let i = 0; i < 120 && refused === 0; i++) {
      const res = await exports.default.fetch(`${ORIGIN}/ws/match/GD-MANY`, {
        headers: { Upgrade: 'websocket', 'CF-Connecting-IP': '192.0.2.60' },
      });
      if (res.status === 429) refused = i + 1;
      else if (res.webSocket) {
        res.webSocket.accept();
        opened.push(res.webSocket);
      }
    }
    expect(refused).toBeGreaterThan(60);
    const other = await open('/ws/match/GD-MANY', '192.0.2.61');
    other.ws.close(1000);
    for (const ws of opened) ws.close(1000);
  });
});

describe('bot matches (GD-STORY-015)', () => {
  const create = (address = '203.0.113.20', method = 'POST') =>
    exports.default.fetch(`${ORIGIN}/api/bot-matches`, {
      method,
      headers: { 'CF-Connecting-IP': address },
    });

  it('open a match for a player and a bot, who play it like any two clients', async () => {
    const res = await create();
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    const ticket = botMatch.parse(await res.json());
    expect(ticket.matchId).toMatch(/^B-[0-9A-Z]{10}$/);
    expect(ticket.token).not.toBe(ticket.botToken);
    const player = await open(`/ws/match/${ticket.matchId}`);
    player.ws.send(
      encodeClientToMatch({ type: 'hello', token: ticket.token, handle: 'Brisk Heron 42' }),
    );
    const bot = await open(`/ws/match/${ticket.matchId}`);
    bot.ws.send(
      encodeClientToMatch({
        type: 'hello',
        token: ticket.botToken,
        handle: 'Steady Bot 1',
        bot: { skill: 5, speed: 5 },
      }),
    );
    const startOf = async (s: Awaited<ReturnType<typeof open>>) => {
      for (;;) {
        const r = parseMatchToClient(await s.next());
        if (r.ok && r.msg.type === 'start') return r.msg;
      }
    };
    expect(await startOf(player)).toMatchObject({ you: 0, rivalBot: { skill: 5, speed: 5 } });
    expect(await startOf(bot)).not.toHaveProperty('rivalBot');
    player.ws.close(1000);
    bot.ws.close(1000);
  });

  it('are made on the settings posted, or the defaults', async () => {
    const classic = { ...DEFAULT_SETTINGS, mode: 'classic' as const, rampSec: 30 as const };
    const res = await exports.default.fetch(`${ORIGIN}/api/bot-matches`, {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.22', 'content-type': 'application/json' },
      body: JSON.stringify({ settings: classic }),
    });
    const { matchId, token, botToken } = botMatch.parse(await res.json());
    const player = await open(`/ws/match/${matchId}`);
    player.ws.send(encodeClientToMatch({ type: 'hello', token, handle: 'Brisk Heron 42' }));
    const bot = await open(`/ws/match/${matchId}`);
    bot.ws.send(encodeClientToMatch({ type: 'hello', token: botToken, handle: 'Steady Bot 1' }));
    expect((await until(player, 'start')).msg.settings).toEqual(classic);
    player.ws.close(1000);
    bot.ws.close(1000);
    const bad = await exports.default.fetch(`${ORIGIN}/api/bot-matches`, {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.22' },
      body: '{"settings":{"mode":"turbo"}}',
    });
    expect(bad.status).toBe(400);
    const garbled = await exports.default.fetch(`${ORIGIN}/api/bot-matches`, {
      method: 'POST',
      headers: { 'CF-Connecting-IP': '203.0.113.22' },
      body: 'not json',
    });
    expect(garbled.status).toBe(400);
  });

  it('are only made by POST', async () => {
    const res = await create('203.0.113.21', 'GET');
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('POST');
  });

  it('count against the address’s upgrades', async () => {
    // As for upgrades: the refusal comes within two of the limiter's fixed windows.
    let refused = 0;
    for (let i = 0; i < 120 && refused === 0; i++) {
      if ((await create('192.0.2.70')).status === 429) refused = i + 1;
    }
    expect(refused).toBeGreaterThan(60);
    const res = await exports.default.fetch(`${ORIGIN}/ws/match/GD-LATE`, {
      headers: { Upgrade: 'websocket', 'CF-Connecting-IP': '192.0.2.70' },
    });
    expect(res.status).toBe(429);
  });
});
