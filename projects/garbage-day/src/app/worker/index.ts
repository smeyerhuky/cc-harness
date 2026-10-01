import { DEFAULT_SETTINGS, matchId, PROTOCOL_VERSION, type BotMatch } from '@garbage-day/protocol';
import { newMatchId, newToken } from './ids';

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

const notFound = () => Response.json({ error: 'Not found' }, { status: 404 });
const tooMany = () => Response.json({ error: 'Too many connections' }, { status: 429 });

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
  if (request.method !== 'POST') {
    return Response.json({ error: 'Use POST' }, { status: 405, headers: { allow: 'POST' } });
  }
  if (!(await allowed(request, env))) return tooMany();
  const tokens = [newToken(), newToken()] as const;
  let id = newMatchId('B');
  while (!(await env.MATCH.getByName(id).open({ tokens, settings: DEFAULT_SETTINGS })))
    id = newMatchId('B');
  const body: BotMatch = { matchId: id, token: tokens[0], botToken: tokens[1] };
  return Response.json(body, { headers: { 'cache-control': 'no-store' } });
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
    if (url.pathname.startsWith('/ws/')) return socket(request, env, url.pathname);
    if (url.pathname.startsWith('/api/')) return notFound();
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
