import {
  DEFAULT_SETTINGS,
  encodeClientToMatch,
  parseMatchToClient,
  type MatchToClient,
} from '@garbage-day/protocol';
import { env, exports } from 'cloudflare:workers';
import { expect } from 'vitest';

// Sockets as a test's client sees them (the Worker and Match DO tests).

export const ORIGIN = 'https://garbage-day.example';

/** One join token per seat, as whoever opens a match hands them out. */
export const TOKENS = ['token-seat-zero-0000', 'token-seat-one-11111'] as const;

/** Opens a socket at `path`, from `address`: its messages, in order, and its close. */
export async function connect(path: string, address = '203.0.113.7') {
  const res = await exports.default.fetch(`${ORIGIN}${path}`, {
    headers: { Upgrade: 'websocket', 'CF-Connecting-IP': address },
  });
  expect(res.status).toBe(101);
  const ws = res.webSocket;
  if (!ws) throw new Error('no socket');
  ws.accept();
  const inbox: string[] = [];
  const waiting: ((m: string) => void)[] = [];
  ws.addEventListener('message', (e) => {
    const text = String(e.data);
    const next = waiting.shift();
    if (next) next(text);
    else inbox.push(text);
  });
  const closed = new Promise<CloseEvent>((resolve) => {
    ws.addEventListener('close', resolve);
  });
  /** The next message from the server. */
  const next = () =>
    new Promise<string>((resolve) => {
      const queued = inbox.shift();
      if (queued !== undefined) resolve(queued);
      else waiting.push(resolve);
    });
  return { ws, next, closed };
}

/** Opens match `id` with the test tokens. */
export const openMatch = (id: string) =>
  env.MATCH.getByName(id).open({ tokens: TOKENS, settings: DEFAULT_SETTINGS });

/** A socket on match `id` that has said hello for `seat`. */
export async function seat(id: string, seat: 0 | 1, address?: string) {
  const s = await connect(`/ws/match/${id}`, address);
  s.ws.send(encodeClientToMatch({ type: 'hello', token: TOKENS[seat], handle: 'Brisk Heron 42' }));
  return s;
}

export type Socket = Awaited<ReturnType<typeof connect>>;

/** The next message, parsed; fails the test if it doesn't parse. */
export async function read(s: Socket): Promise<MatchToClient> {
  const r = parseMatchToClient(await s.next());
  if (!r.ok) throw r.error;
  return r.msg;
}

/** Reads until a message of `type` arrives; returns it and what came before. */
export async function until<T extends MatchToClient['type']>(s: Socket, type: T) {
  const before: MatchToClient[] = [];
  for (;;) {
    const m = await read(s);
    if (m.type === type) return { msg: m as Extract<MatchToClient, { type: T }>, before };
    before.push(m);
  }
}
