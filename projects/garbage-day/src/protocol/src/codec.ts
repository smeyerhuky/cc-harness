import { z } from 'zod';
import { decodeBoard, encodeBoard } from './board-codec';
import { type ParseResult, ProtocolError, type ProtocolErrorCode } from './errors';
import {
  clientToLobby,
  type ClientToLobbyWire,
  clientToMatch,
  type ClientToMatchWire,
  lobbyToClient,
  type LobbyToClientWire,
  matchToClient,
  type MatchToClientWire,
  PING,
  PONG,
  PROTOCOL_VERSION,
} from './schemas';

/** The longest message either side accepts, in characters. */
export const MAX_MESSAGE_LENGTH = 2048;

/**
 * A wire message in the shape the app and the engine use: its type under `type` instead of `t`,
 * no `v`, and a lock's board as the engine's snapshot string. `ping` is the engine's `hb`.
 */
type AppShape<W> = W extends { t: 'ping' }
  ? { readonly type: 'hb' }
  : W extends { t: infer T }
    ? { readonly type: T } & Omit<W, 'v' | 't'>
    : never;

export type ClientToMatch = AppShape<ClientToMatchWire>;
export type MatchToClient = AppShape<MatchToClientWire>;
export type ClientToLobby = AppShape<ClientToLobbyWire>;
export type LobbyToClient = AppShape<LobbyToClientWire>;

const hasBoard = (type: unknown, kind: unknown): boolean =>
  type === 'lock' || (type === 'opp' && kind === 'lock');

function toWire(m: { readonly type: string; readonly [k: string]: unknown }): string {
  if (m.type === 'hb') return PING;
  if (m.type === 'pong') return PONG;
  const wire: Record<string, unknown> = { v: PROTOCOL_VERSION, t: m.type, ...m };
  delete wire.type;
  if (hasBoard(m.type, m.kind) && typeof m.board === 'string') wire.board = encodeBoard(m.board);
  return JSON.stringify(wire);
}

function fromWire(w: { readonly t: string; readonly [k: string]: unknown }): unknown {
  if (w.t === 'ping') return { type: 'hb' };
  const out: Record<string, unknown> = { type: w.t, ...w };
  delete out.v;
  delete out.t;
  if (hasBoard(w.t, w.kind) && typeof w.board === 'string') out.board = decodeBoard(w.board);
  return out;
}

const fail = (code: ProtocolErrorCode, message: string) =>
  ({ ok: false, error: new ProtocolError(code, message) }) as const;

function parseWith<T>(
  schema: z.ZodType<{ t: string }>,
  types: ReadonlySet<string>,
  text: string,
): ParseResult<T> {
  if (text.length > MAX_MESSAGE_LENGTH)
    return fail('too-large', `Longer than ${MAX_MESSAGE_LENGTH} characters`);
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return fail('malformed', 'Not JSON');
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return fail('malformed', 'Not a JSON object');
  }
  const { v, t } = data as { v?: unknown; t?: unknown };
  if (v !== PROTOCOL_VERSION)
    return fail('version', `Protocol version ${String(v)}, expected ${PROTOCOL_VERSION}`);
  if (typeof t !== 'string' || !types.has(t))
    return fail('unknown-type', `Unknown message type ${String(t)}`);
  const r = schema.safeParse(data);
  if (!r.success) return fail('invalid', z.prettifyError(r.error));
  try {
    return { ok: true, msg: fromWire(r.data) as T };
  } catch (e) {
    if (e instanceof ProtocolError) return { ok: false, error: e };
    throw e;
  }
}

const set = (...types: string[]): ReadonlySet<string> => new Set(types);
/** The types each direction accepts; a test checks they match the schemas. */
export const MESSAGE_TYPES = {
  clientToMatch: set(
    'hello',
    'ready',
    'settings',
    'ping',
    'pos',
    'lock',
    'attack',
    'bagReq',
    'use',
    'topout',
    'away',
    'back',
    'rejoin',
    'extend',
    'leave',
    'rematch',
  ),
  matchToClient: set(
    'pong',
    'lobby',
    'start',
    'bag',
    'garbage',
    'opp',
    'power',
    'showdown',
    'paused',
    'resume',
    'deadline',
    'clock',
    'bothAway',
    'grace',
    'back',
    'result',
    'error',
    'rematch',
    'agreed',
    'lapsed',
  ),
  clientToLobby: set('ping', 'queue', 'cancel'),
  lobbyToClient: set('pong', 'waiting', 'matched', 'error'),
} as const;

export const encodeClientToMatch = (m: ClientToMatch): string => toWire(m);
export const encodeMatchToClient = (m: MatchToClient): string => toWire(m);
export const encodeClientToLobby = (m: ClientToLobby): string => toWire(m);
export const encodeLobbyToClient = (m: LobbyToClient): string => toWire(m);

export const parseClientToMatch = (text: string): ParseResult<ClientToMatch> =>
  parseWith(clientToMatch, MESSAGE_TYPES.clientToMatch, text);
export const parseMatchToClient = (text: string): ParseResult<MatchToClient> =>
  parseWith(matchToClient, MESSAGE_TYPES.matchToClient, text);
export const parseClientToLobby = (text: string): ParseResult<ClientToLobby> =>
  parseWith(clientToLobby, MESSAGE_TYPES.clientToLobby, text);
export const parseLobbyToClient = (text: string): ParseResult<LobbyToClient> =>
  parseWith(lobbyToClient, MESSAGE_TYPES.lobbyToClient, text);
