import {
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
import { CLOSE_REFUSED } from './sockets';
import { connect as open, openMatch, ORIGIN, seat } from './testkit';

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
    expect((await s.closed).code).toBe(CLOSE_REFUSED);
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
    for (let i = 0; i < 50; i++) s.ws.send('{"v":1,"t":"cancel"}');
    expect(parseLobbyToClient(await s.next())).toMatchObject({
      msg: { type: 'error', code: 'rate' },
    });
    expect((await s.closed).code).toBe(CLOSE_REFUSED);
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
