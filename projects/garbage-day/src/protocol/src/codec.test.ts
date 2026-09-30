import {
  Bot,
  botConfig,
  type ClientMessage,
  emptyBoard,
  LocalMatch,
  type PlayerStats,
  type ServerMessage,
  snapshot,
} from '@garbage-day/engine';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type ClientToLobby,
  type ClientToMatch,
  encodeClientToLobby,
  encodeClientToMatch,
  encodeLobbyToClient,
  encodeMatchToClient,
  type LobbyToClient,
  MAX_MESSAGE_LENGTH,
  MESSAGE_TYPES,
  type MatchToClient,
  parseClientToLobby,
  parseClientToMatch,
  parseLobbyToClient,
  parseMatchToClient,
} from './codec';
import { PING, PONG, PROTOCOL_VERSION } from './schemas';
import { DEFAULT_SETTINGS } from './settings';

const stats: PlayerStats = {
  pieces: 40,
  lines: 12,
  sent: 7,
  received: 5,
  cancelled: 2,
  fourLineClears: 1,
  tspins: 0,
  perfectClears: 0,
  powersUsed: 1,
  powersGot: 2,
  maxCombo: 3,
  garbageRows: 4,
};
const board = snapshot(emptyBoard()).replace(/^.{30}/, 'XXXX.XXXXXXXXX.XXXXXIIII..T...');
const quad = { lines: 4, tspin: false, b2b: true, combo: 1, perfectClear: false, attack: 6 };
const cur = { t: 'T', r: 2, x: 3, y: 17 } as const;
const token = 'tok_0123456789abcdef';

const clientToMatch: ClientToMatch[] = [
  { type: 'hello', token, handle: 'Brisk Heron 42' },
  { type: 'ready' },
  { type: 'settings', settings: { ...DEFAULT_SETTINGS, mode: 'classic' } },
  { type: 'hb' },
  { type: 'pos', cur, meter: 3, gack: 2, power: 'fog', hold: 'I' },
  { type: 'pos', cur: null, meter: 0, gack: 0, power: null, hold: null },
  {
    type: 'lock',
    board,
    lines: 4,
    attack: 6,
    clear: quad,
    meter: 0,
    gack: 2,
    hold: 'S',
    power: null,
    stats,
  },
  { type: 'attack', rows: 5, clear: quad },
  { type: 'bagReq' },
  { type: 'use', power: 'shield' },
  { type: 'topout', why: 'buried' },
  { type: 'away', reason: 'tab' },
  { type: 'back', awayMs: 47000 },
  { type: 'back' },
  { type: 'rejoin', gack: 9 },
  { type: 'rejoin', gack: 9, awayMs: 1200 },
  { type: 'extend' },
  { type: 'leave' },
];

const matchToClient: MatchToClient[] = [
  { type: 'pong' },
  {
    type: 'lobby',
    handles: ['Brisk Heron 42', null],
    settings: DEFAULT_SETTINGS,
    ready: [true, false],
    you: 0,
  },
  { type: 'start', goAt: 180 },
  { type: 'start', goAt: 180, settings: DEFAULT_SETTINGS },
  {
    type: 'bag',
    pieces: [
      { t: 'Z', gem: null },
      { t: 'T', gem: null },
      { t: 'L', gem: { i: 3, type: 'shield' } },
      { t: 'J', gem: null },
      { t: 'I', gem: null },
      { t: 'O', gem: null },
      { t: 'S', gem: null },
    ],
  },
  { type: 'garbage', rows: 4, id: 12 },
  { type: 'opp', kind: 'pos', cur, meter: 1, power: null, hold: 'O' },
  {
    type: 'opp',
    kind: 'lock',
    board,
    meter: 2,
    stats,
    lines: 0,
    clear: null,
    power: 'bomb',
    hold: null,
  },
  { type: 'power', kind: 'rush', by: 1, at: 4000 },
  { type: 'showdown', kind: 'double', phase: 'soon', startsAt: 60 },
  { type: 'showdown', kind: 'double', phase: 'start', until: 4500 },
  { type: 'showdown', kind: 'sudden', phase: 'start', until: null },
  { type: 'showdown', kind: 'double', phase: 'end' },
  { type: 'paused', by: 1, reason: 'lost', deadline: 9000, pausesLeft: 2, budgeted: false },
  { type: 'resume', at: 9100, by: 1, away: 840, pausesLeft: 2, free: true },
  { type: 'deadline', deadline: 12600 },
  { type: 'bothAway', endsAt: 27000 },
  { type: 'grace', by: 0, until: 5000 },
  { type: 'back', by: 0, away: 360, pausesLeft: 0 },
  { type: 'result', winner: null, reason: 'left-while-paused', by: 0 },
  { type: 'error', code: 'full', message: 'This game is full.' },
];

const clientToLobby: ClientToLobby[] = [
  { type: 'hb' },
  { type: 'queue', handle: 'Quiet Wren 7' },
  { type: 'cancel' },
];

const lobbyToClient: LobbyToClient[] = [
  { type: 'pong' },
  { type: 'waiting', count: 3 },
  { type: 'matched', matchId: 'q-3f9a2c', token, opponent: 'Brisk Heron 42' },
  { type: 'error', code: 'rate', message: 'Too many requests.' },
];

const wireType = (m: { type: string }) => (m.type === 'hb' ? 'ping' : m.type);

describe.each([
  [
    'client → Match DO',
    clientToMatch,
    encodeClientToMatch,
    parseClientToMatch,
    MESSAGE_TYPES.clientToMatch,
  ],
  [
    'Match DO → client',
    matchToClient,
    encodeMatchToClient,
    parseMatchToClient,
    MESSAGE_TYPES.matchToClient,
  ],
  [
    'client → Lobby DO',
    clientToLobby,
    encodeClientToLobby,
    parseClientToLobby,
    MESSAGE_TYPES.clientToLobby,
  ],
  [
    'Lobby DO → client',
    lobbyToClient,
    encodeLobbyToClient,
    parseLobbyToClient,
    MESSAGE_TYPES.lobbyToClient,
  ],
] as const)('%s', (_, samples, encode, parse, types) => {
  it('has a sample of every message type', () => {
    expect(new Set(samples.map(wireType))).toEqual(types);
  });

  it('round-trips every message through encode and parse, carrying v and t on the wire', () => {
    for (const m of samples) {
      const wire = (encode as (m: unknown) => string)(m);
      expect(JSON.parse(wire)).toMatchObject({ v: PROTOCOL_VERSION, t: wireType(m) });
      expect(wire.length).toBeLessThan(MAX_MESSAGE_LENGTH);
      const back = parse(wire);
      expect(back).toEqual({ ok: true, msg: m });
    }
  });
});

describe('agreement with the engine', () => {
  // Checked by the typecheck: every message the engine sends has a wire form, and every wire
  // message outside the lobby, errors and pongs is one the engine understands
  // (src/engine/src/messages.ts).
  it('covers the engine’s messages in both directions', () => {
    expectTypeOf<ClientMessage>().toExtend<ClientToMatch>();
    expectTypeOf<
      Exclude<ClientToMatch, { type: 'hello' | 'ready' | 'settings' }>
    >().toExtend<ClientMessage>();
    expectTypeOf<ServerMessage>().toExtend<MatchToClient>();
    expectTypeOf<
      Exclude<MatchToClient, { type: 'lobby' | 'error' | 'pong' }>
    >().toExtend<ServerMessage>();
  });
});

describe('the wire form', () => {
  it('uses one exact string for ping and pong, for the WebSocket auto-response', () => {
    expect(encodeClientToMatch({ type: 'hb' })).toBe(PING);
    expect(PING).toBe('{"v":1,"t":"ping"}');
    expect(encodeMatchToClient({ type: 'pong' })).toBe(PONG);
  });

  it('sends a lock’s board encoded, not as 240 characters', () => {
    const wire = JSON.parse(encodeClientToMatch(clientToMatch[6] as ClientToMatch)) as {
      board: string;
    };
    expect(wire.board).toBe('rX4.X9.X5I4.2T');
  });
});

const rejects = (text: string, code: string) => {
  const r = parseClientToMatch(text);
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.error.code).toBe(code);
};
const wire = (o: Record<string, unknown>) => JSON.stringify({ v: 1, ...o });

describe('rejecting messages', () => {
  it('rejects an oversized message before parsing it', () => {
    rejects(`{"v":1,"t":"ping","x":"${'a'.repeat(MAX_MESSAGE_LENGTH)}"}`, 'too-large');
  });

  it.each(['nope', '[]', 'null', '42', '"ping"'])('rejects %s as malformed', (text) => {
    rejects(text, 'malformed');
  });

  it('rejects another protocol version', () => {
    rejects(JSON.stringify({ v: 2, t: 'ping' }), 'version');
    rejects(JSON.stringify({ t: 'ping' }), 'version');
  });

  it('rejects a type this side does not accept', () => {
    rejects(wire({ t: 'bogus' }), 'unknown-type');
    rejects(wire({ t: 'garbage', rows: 4, id: 1 }), 'unknown-type');
    rejects(wire({}), 'unknown-type');
  });

  it.each([
    ['a missing field', { t: 'use' }],
    ['a wrong kind of value', { t: 'use', power: 'laser' }],
    ['an extra key', { t: 'bagReq', sneaky: true }],
    [
      'a position off the board',
      { t: 'pos', cur: { t: 'T', r: 0, x: 40, y: 3 }, meter: 0, gack: 0, power: null, hold: null },
    ],
    ['a fractional number', { t: 'rejoin', gack: 1.5 }],
    ['a handle typed freely', { t: 'hello', token, handle: '<script>' }],
    ['a short token', { t: 'hello', token: 'abc', handle: 'Brisk Heron 42' }],
    ['more rows than the clear allows', { t: 'attack', rows: 7, clear: quad }],
    [
      'a clear that claims more than it is worth',
      { t: 'attack', rows: 9, clear: { ...quad, attack: 9 } },
    ],
    [
      'a bad board encoding',
      { ...(clientToMatch[6] as object), type: undefined, t: 'lock', board: 'rQ' },
    ],
  ])('rejects %s', (_, o) => {
    rejects(wire(o), 'invalid');
  });

  it('lets the server add fields a client does not know yet', () => {
    const r = parseMatchToClient(
      JSON.stringify({ v: 1, t: 'garbage', rows: 2, id: 3, later: 'x' }),
    );
    expect(r.ok).toBe(true);
  });
});

describe('a whole match over the wire', () => {
  it('plays out exactly as it does without it', () => {
    const play = (wire: boolean) => {
      const m = new LocalMatch({
        seed: 0x5eed01,
        latencyMs: [35, 55],
        ...(wire
          ? {
              wire: {
                client: (msg: ClientMessage) => {
                  const r = parseClientToMatch(encodeClientToMatch(msg));
                  if (!r.ok) throw r.error;
                  return r.msg as ClientMessage;
                },
                server: (msg: ServerMessage) => {
                  const r = parseMatchToClient(encodeMatchToClient(msg));
                  if (!r.ok) throw r.error;
                  return r.msg as ServerMessage;
                },
              },
            }
          : {}),
      });
      m.controllers[0] = new Bot(m.players[0], 0x5eed01, botConfig(9, 9));
      m.controllers[1] = new Bot(m.players[1], 0x5eed01, botConfig(7, 8));
      return m
        .start()
        .run(60 * 60 * 15)
        .summary();
    };
    const direct = play(false);
    expect(direct.result).not.toBeNull();
    expect(play(true)).toEqual(direct);
  }, 60_000);
});
