import { PIECE_TYPES, POWER_KINDS, scoreClear } from '@garbage-day/engine';
import { z } from 'zod';
import { MAX_ENCODED_BOARD } from './board-codec';
import { HANDLE_MAX_LENGTH, HANDLE_PATTERN } from './handle';
import { SETTING_CHOICES } from './settings';

/** Bumped when a message changes shape; each side rejects other versions. */
export const PROTOCOL_VERSION = 1;

// Every message on the wire is a JSON object with the protocol version `v` and its type `t`
// (kb/design/architecture.md, "Messages"). Messages the server receives are strict: an unknown
// key is an error. Messages the client receives tolerate extra keys, so the server can add
// optional fields without breaking older clients.

const v = z.literal(PROTOCOL_VERSION);
const int = (min: number, max: number) => z.int().min(min).max(max);
const count = int(0, 1_000_000);
/** A match tick, or a tick count. */
const tick = int(0, 2_147_483_647);
const player = z.union([z.literal(0), z.literal(1)]);
const pieceType = z.enum(PIECE_TYPES);
const powerKind = z.enum(POWER_KINDS);
const rotation = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
/** An encoded board (board-codec.ts). */
const board = z.string().min(1).max(MAX_ENCODED_BOARD);

const piecePosition = z.object({ t: pieceType, r: rotation, x: int(-3, 12), y: int(-4, 30) });

const clear = z.object({
  lines: int(1, 4),
  tspin: z.boolean(),
  b2b: z.boolean(),
  combo: int(0, 10_000),
  perfectClear: z.boolean(),
  attack: int(0, 100),
});

const stats = z.object({
  pieces: count,
  lines: count,
  sent: count,
  received: count,
  cancelled: count,
  fourLineClears: count,
  tspins: count,
  perfectClears: count,
  powersUsed: count,
  powersGot: count,
  maxCombo: count,
  garbageRows: count,
});

const dealtPiece = z.object({
  t: pieceType,
  gem: z.object({ i: int(0, 3), type: powerKind }).nullable(),
});

const awayReason = z.enum(['tab', 'step', 'closed', 'lost']);

/** A handle as the client generates it: two capitalized words and a number (PRD US-04). */
export const handle = z.string().max(HANDLE_MAX_LENGTH).regex(HANDLE_PATTERN);
/** A join token: opaque, URL-safe. */
export const token = z.string().regex(/^[A-Za-z0-9_-]{16,128}$/);
/** A match id: a private game's code (`GD-7KQ4`) or a quick or bot match's generated id. */
export const matchId = z.string().regex(/^[A-Za-z0-9-]{4,64}$/);
/** A private game's code: `GD-` and four letters or digits (PRD US-02). */
export const gameCode = z.string().regex(/^GD-[A-Z0-9]{4}$/);

/** The settings a player may change for a private or bot game (PRD, "Match settings"). */
export const matchSettings = z.strictObject({
  mode: z.enum(SETTING_CHOICES.mode),
  rampSec: z.literal(SETTING_CHOICES.rampSec),
  pauseBudget: z.literal(SETTING_CHOICES.pauseBudget),
  pauseSec: z.literal(SETTING_CHOICES.pauseSec),
  leaveResult: z.enum(SETTING_CHOICES.leaveResult),
});
export type MatchSettings = z.infer<typeof matchSettings>;

const toServer = <T extends string, S extends z.ZodRawShape>(t: T, shape: S) =>
  z.strictObject({ v, t: z.literal(t), ...shape });
const toClient = <T extends string, S extends z.ZodRawShape>(t: T, shape: S) =>
  z.object({ v, t: z.literal(t), ...shape });

// ---- Client → Match DO ----

/** The same exact string both ways, so the Match DO's WebSocket auto-response can answer it. */
export const PING = `{"v":${PROTOCOL_VERSION},"t":"ping"}`;
export const PONG = `{"v":${PROTOCOL_VERSION},"t":"pong"}`;

const attack = toServer('attack', { rows: int(1, 100), clear }).refine(
  (m) =>
    m.rows <= m.clear.attack &&
    scoreClear({
      lines: m.clear.lines,
      tspin: m.clear.tspin,
      perfectClear: m.clear.perfectClear,
      backToBack: m.clear.b2b,
      combo: m.clear.combo,
    }).clear.attack === m.clear.attack,
  { message: 'The attack is more than the declared clear allows' },
);

/**
 * A bot's settings. A bot client says so in its `hello`, and the Match DO tells the other player
 * in `start`, so a bot always reads as a bot (PRD, open question 5; GD-TICKET-016). No handle can
 * pass for one: a handle is two words and a number.
 */
export const botMark = z.strictObject({ skill: int(1, 10), speed: int(1, 10) });
export type BotMark = z.infer<typeof botMark>;

/** Messages the Match DO accepts; `ping` is answered without waking it. */
export const clientToMatch = z.discriminatedUnion('t', [
  toServer('hello', { token, handle, bot: botMark.exactOptional() }),
  toServer('ready', {}),
  toServer('settings', { settings: matchSettings }),
  toServer('ping', {}),
  toServer('pos', {
    cur: piecePosition.nullable(),
    meter: count,
    gack: count,
    power: powerKind.nullable(),
    hold: pieceType.nullable(),
  }),
  toServer('lock', {
    board,
    lines: int(0, 4),
    attack: int(0, 100),
    clear: clear.nullable(),
    meter: count,
    gack: count,
    hold: pieceType.nullable(),
    power: powerKind.nullable(),
    stats,
  }),
  attack,
  toServer('bagReq', {}),
  toServer('use', { power: powerKind }),
  toServer('topout', { why: z.enum(['block out', 'lock out', 'buried']) }),
  toServer('away', { reason: awayReason }),
  toServer('back', { awayMs: count.exactOptional() }),
  toServer('rejoin', { gack: count, awayMs: count.exactOptional() }),
  toServer('extend', {}),
  toServer('leave', {}),
]);

// ---- Match DO → client ----

const oppPos = toClient('opp', {
  kind: z.literal('pos'),
  cur: piecePosition.nullable(),
  meter: count,
  power: powerKind.nullable(),
  hold: pieceType.nullable(),
});
const oppLock = toClient('opp', {
  kind: z.literal('lock'),
  board,
  meter: count,
  stats,
  lines: int(0, 4),
  clear: clear.nullable(),
  power: powerKind.nullable(),
  hold: pieceType.nullable(),
});

export const errorCodes = ['full', 'expired', 'bad-token', 'version', 'invalid', 'rate'] as const;

/** Messages a client accepts from the Match DO. */
export const matchToClient = z.discriminatedUnion('t', [
  toClient('pong', {}),
  // A private game's lobby (GD-STORY-010): each seat's handle once it has said hello, the host's
  // settings, who is ready, and which seat is the listener's. Seat 0 is the host.
  toClient('lobby', {
    handles: z.tuple([handle.nullable(), handle.nullable()]),
    settings: matchSettings,
    ready: z.tuple([z.boolean(), z.boolean()]),
    you: player,
  }),
  // `holes` seeds this player's garbage hole columns. It is not the match seed, which deals the
  // pieces and never leaves the server (PRD US-06). `you` is this player's seat. `rivalBot` is
  // there when the other player is a bot: its settings, as its `hello` said.
  toClient('start', {
    goAt: tick,
    settings: matchSettings.exactOptional(),
    holes: int(0, 4_294_967_295).exactOptional(),
    you: player.exactOptional(),
    rivalBot: botMark.exactOptional(),
  }),
  toClient('bag', { pieces: z.array(dealtPiece).length(7).readonly() }),
  toClient('garbage', { rows: int(1, 200), id: int(1, 1_000_000) }),
  z.discriminatedUnion('kind', [oppPos, oppLock]),
  toClient('power', { kind: powerKind, by: player, at: tick }),
  toClient('showdown', {
    kind: z.enum(['double', 'sudden']),
    phase: z.enum(['soon', 'start', 'end']),
    startsAt: count.exactOptional(),
    until: tick.nullable().exactOptional(),
  }),
  toClient('paused', {
    by: player,
    reason: awayReason,
    deadline: tick,
    pausesLeft: int(0, 3),
    budgeted: z.boolean(),
  }),
  toClient('resume', {
    at: tick,
    by: player,
    away: tick,
    pausesLeft: int(0, 3),
    free: z.boolean(),
  }),
  toClient('deadline', { deadline: tick }),
  toClient('clock', { tick, active: tick }),
  toClient('bothAway', { endsAt: tick }),
  toClient('grace', { by: player, until: tick }),
  toClient('back', { by: player, away: tick, pausesLeft: int(0, 3) }),
  toClient('result', {
    winner: player.nullable(),
    reason: z.enum(['topout', 'timeout', 'grace', 'left', 'left-while-paused', 'abandoned']),
    by: player.nullable(),
  }),
  toClient('error', { code: z.enum(errorCodes), message: z.string().max(200) }),
]);

// ---- The Lobby DO ----

/** Messages the Lobby DO accepts. */
export const clientToLobby = z.discriminatedUnion('t', [
  toServer('ping', {}),
  toServer('queue', { handle }),
  toServer('cancel', {}),
]);

/** Messages a client accepts from the Lobby DO. */
export const lobbyToClient = z.discriminatedUnion('t', [
  toClient('pong', {}),
  toClient('waiting', { count: count }),
  toClient('matched', { matchId, token, opponent: handle }),
  toClient('error', { code: z.enum(errorCodes), message: z.string().max(200) }),
]);

// ---- The Worker's HTTP API ----

/**
 * What `POST /api/bot-matches` answers (GD-STORY-015): a match opened for two seats, the
 * player's token and the bot's. The browser hands the bot's to the worker that plays it.
 */
export const botMatch = z.object({ matchId, token, botToken: token });
export type BotMatch = z.infer<typeof botMatch>;

/**
 * A new match's settings: `POST /api/games` takes the host's (GD-STORY-010), and
 * `POST /api/bot-matches` the player's for a bot game (GD-TICKET-026).
 */
export const newGame = z.strictObject({ settings: matchSettings });
/** It answers the game's code and the host's join token. */
export const createdGame = z.object({ code: gameCode, token });
export type CreatedGame = z.infer<typeof createdGame>;

/** Why a game can't be joined: two players have it, it expired, or no game has the code. */
export const gameRefusals = ['full', 'expired', 'none'] as const;
export type GameRefusal = (typeof gameRefusals)[number];
/**
 * `POST /api/games/:code/join` answers the guest's join token, or why there is none. A game has
 * one guest token, handed out once; the guest's browser keeps it to come back.
 */
export const joinedGame = z.union([z.object({ token }), z.object({ error: z.enum(gameRefusals) })]);
export type JoinedGame = z.infer<typeof joinedGame>;

export type ClientToMatchWire = z.infer<typeof clientToMatch>;
export type MatchToClientWire = z.infer<typeof matchToClient>;
export type ClientToLobbyWire = z.infer<typeof clientToLobby>;
export type LobbyToClientWire = z.infer<typeof lobbyToClient>;
