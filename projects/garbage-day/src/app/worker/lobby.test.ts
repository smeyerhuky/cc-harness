import {
  CLOSE,
  encodeClientToLobby,
  encodeClientToMatch,
  parseLobbyToClient,
  parseMatchToClient,
  type LobbyToClient,
} from '@garbage-day/protocol';
import { env } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { connect } from './testkit';

type Socket = Awaited<ReturnType<typeof connect>>;

async function read(s: Socket): Promise<LobbyToClient> {
  const r = parseLobbyToClient(await s.next());
  if (!r.ok) throw r.error;
  return r.msg;
}

/** A lobby socket from its own address, queued as `handle`. */
async function queue(handle: string, n: number) {
  const s = await connect('/ws/lobby', `198.18.0.${n}`);
  s.ws.send(encodeClientToLobby({ type: 'queue', handle }));
  return s;
}

describe('the Lobby DO', () => {
  it('pairs two waiting players into one match, each with their own token', async () => {
    const a = await queue('Brisk Heron 42', 1);
    expect(await read(a)).toEqual({ type: 'waiting', count: 1 });
    const b = await queue('Quiet Wren 7', 2);
    const [ma, mb] = [await read(a), await read(b)];
    if (ma.type !== 'matched' || mb.type !== 'matched') throw new Error('not matched');
    expect(ma.matchId).toBe(mb.matchId);
    expect(ma.matchId).toMatch(/^Q-[0-9A-Z]{10}$/);
    expect(ma.token).not.toBe(mb.token);
    expect([ma.opponent, mb.opponent]).toEqual(['Quiet Wren 7', 'Brisk Heron 42']);
    expect((await a.closed).code).toBe(CLOSE.done);
    expect((await b.closed).code).toBe(CLOSE.done);

    // The match is open for exactly those tokens: both seated, it starts.
    const seats = await Promise.all(
      [ma, mb].map(async (m, i) => {
        const s = await connect(`/ws/match/${m.matchId}`, `198.18.0.${10 + i}`);
        s.ws.send(encodeClientToMatch({ type: 'hello', token: m.token, handle: 'Brisk Heron 42' }));
        return s;
      }),
    );
    for (const s of seats) {
      const types: string[] = [];
      for (let i = 0; i < 3; i++) {
        const r = parseMatchToClient(await s.next());
        if (r.ok) types.push(r.msg.type);
      }
      expect(types).toEqual(['bag', 'bag', 'start']);
      s.ws.close(1000);
    }
  });

  it('tells everyone waiting how many are waiting, and forgets whoever leaves', async () => {
    const a = await queue('Brisk Heron 1', 21);
    expect(await read(a)).toEqual({ type: 'waiting', count: 1 });
    a.ws.send(encodeClientToLobby({ type: 'cancel' }));
    expect((await a.closed).code).toBe(CLOSE.done);
    expect(await env.LOBBY.getByName('quick').waiting()).toBe(0);

    const b = await queue('Brisk Heron 2', 22);
    expect(await read(b)).toEqual({ type: 'waiting', count: 1 });
    // Closing the socket leaves the queue too.
    b.ws.close(1000);
    await b.closed;
    const c = await queue('Brisk Heron 3', 23);
    expect(await read(c)).toEqual({ type: 'waiting', count: 1 });
    c.ws.close(1000);
  });

  it('pairs the two who waited longest, and keeps the third waiting', async () => {
    const [a, b] = [await queue('Early Owl 1', 31), await queue('Early Owl 2', 32)];
    await Promise.all([read(a), read(b)]);
    const c = await queue('Late Owl 3', 33);
    expect(await read(c)).toEqual({ type: 'waiting', count: 1 });
    c.ws.close(1000);
  });
});
