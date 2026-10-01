import {
  DEFAULT_SETTINGS,
  gameCode,
  matchId,
  newGame,
  PROTOCOL_VERSION,
  type BotMatch,
  type CreatedGame,
  type GameRefusal,
} from '@garbage-day/protocol';
import { newGameCode, newMatchId, newToken } from './ids';

// The Worker (kb/design/architecture.md, "Components"): the app's static assets, the health
// check, and the sockets, each handed to the Durable Object that owns it. The limits and why
// each number: architecture, "Limits".

export { LobbyDO } from './lobby';
export { MatchDO } from './match';

export interface Health {
  ok: true;
  environment: string;
  protocol: number;
  lobby: 'ok';
  match: 'ok';
}

const isLocal = (host: string) => host === 'localhost' || host === '127.0.0.1';
const MATCH_SOCKET = /^\/ws\/match\/([^/]+)$/;
const GAME_JOIN = /^\/api\/games\/([^/]+)\/join$/;

const notFound = () => Response.json({ error: 'Not found' }, { status: 404 });
const tooMany = () => Response.json({ error: 'Too many connections' }, { status: 429 });
const postOnly = () =>
  Response.json({ error: 'Use POST' }, { status: 405, headers: { allow: 'POST' } });
const noStore = { 'cache-control': 'no-store' } as const;

/** Whether this address has one left of its 60 a minute (the `UPGRADES` rate limiter). */
async function allowed(request: Request, env: Env): Promise<boolean> {
  const address = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  return (await env.UPGRADES.limit({ key: address })).success;
}

/**
 * `/ws/lobby` and `/ws/match/<id>`: a WebSocket upgrade, at most 60 a minute from one address,
 * handed to the Durable Object that owns it.
 */
async function socket(request: Request, env: Env, path: string): Promise<Response> {
  const id = MATCH_SOCKET.exec(path)?.[1];
  if (path !== '/ws/lobby' && !(id && matchId.safeParse(id).success)) return notFound();
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return Response.json({ error: 'Expected a WebSocket upgrade' }, { status: 426 });
  }
  if (!(await allowed(request, env))) return tooMany();
  return id ? env.MATCH.getByName(id).fetch(request) : env.LOBBY.getByName('quick').fetch(request);
}

/**
 * `POST /api/bot-matches` (GD-STORY-015): opens a match for a player and a bot, on the defaults,
 * and answers its id and both seats' tokens. The browser takes one seat and starts the bot's
 * worker on the other. Each counts against the address's 60 a minute, as an upgrade does.
 */
async function botMatch(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return postOnly();
  if (!(await allowed(request, env))) return tooMany();
  const tokens = [newToken(), newToken()] as const;
  let id = newMatchId('B');
  while (!(await env.MATCH.getByName(id).open({ tokens, settings: DEFAULT_SETTINGS })))
    id = newMatchId('B');
  const body: BotMatch = { matchId: id, token: tokens[0], botToken: tokens[1] };
  return Response.json(body, { headers: noStore });
}

/**
 * `POST /api/games` (GD-STORY-010): opens a private game on the host's settings, under a fresh
 * code (another is drawn while one is taken, live or expired), and answers the code and the
 * host's token. The Match DO holds the lobby. It counts against the address's 60 a minute.
 */
async function createGame(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return postOnly();
  if (!(await allowed(request, env))) return tooMany();
  const body = newGame.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ error: 'Expected the game settings' }, { status: 400 });
  const tokens = [newToken(), newToken()] as const;
  const setup = { tokens, settings: body.data.settings, lobby: true };
  let code = newGameCode();
  while (!(await env.MATCH.getByName(code).open(setup))) code = newGameCode();
  const created: CreatedGame = { code, token: tokens[0] };
  return Response.json(created, { headers: noStore });
}

/** Each refusal's status: two players have it, it expired, or no game has the code. */
const REFUSED: Readonly<Record<GameRefusal, number>> = { full: 409, expired: 410, none: 404 };

/**
 * `POST /api/games/:code/join`: the guest's token, handed out once, or why there is none. It
 * counts against the address's 60 a minute too, so nobody can try codes quickly.
 */
async function joinGame(request: Request, env: Env, code: string): Promise<Response> {
  if (request.method !== 'POST') return postOnly();
  if (!(await allowed(request, env))) return tooMany();
  if (!gameCode.safeParse(code).success) {
    return Response.json({ error: 'none' }, { status: REFUSED.none, headers: noStore });
  }
  const joined = await env.MATCH.getByName(code).join();
  const status = 'error' in joined ? REFUSED[joined.error] : 200;
  return Response.json(joined, { status, headers: noStore });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      const [lobby, match] = await Promise.all([
        env.LOBBY.getByName('health').health(),
        env.MATCH.getByName('health').health(),
      ]);
      const body: Health = {
        ok: true,
        environment: isLocal(url.hostname) ? 'development' : env.ENVIRONMENT,
        protocol: PROTOCOL_VERSION,
        lobby,
        match,
      };
      return Response.json(body, { headers: { 'cache-control': 'no-store' } });
    }
    if (url.pathname === '/api/bot-matches') return botMatch(request, env);
    if (url.pathname === '/api/games') return createGame(request, env);
    const join = GAME_JOIN.exec(url.pathname)?.[1];
    if (join !== undefined) return joinGame(request, env, join);
    if (url.pathname.startsWith('/ws/')) return socket(request, env, url.pathname);
    if (url.pathname.startsWith('/api/')) return notFound();
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
