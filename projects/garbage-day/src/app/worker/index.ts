import {
  encodeLobbyToClient,
  encodeMatchToClient,
  matchId,
  parseClientToLobby,
  parseClientToMatch,
  PROTOCOL_VERSION,
  type ClientToLobby,
  type ClientToMatch,
} from '@garbage-day/protocol';
import type { GuardLimits } from './guard';
import { SocketDO, type RefusalCode } from './sockets';

// The limits, and why each number (kb/design/architecture.md, "Limits").

/**
 * A player sends `pos` at most 15 times a second and a `lock`, with any `attack`, per piece; the
 * busiest golden replay averages under 15 messages a second a player. 40 a second, in bursts of
 * 60, is well over anything a real client sends, and caps what a flood makes the DO parse. Locks
 * are capped at 20 a second, as the architecture's trust rules say.
 */
export const MATCH_LIMITS: GuardLimits = { rate: 40, burst: 60, locks: 20, strikes: 20 };
/** The lobby hears a `queue` and a `cancel` (pings are answered without it). */
export const LOBBY_LIMITS: GuardLimits = { rate: 2, burst: 5, strikes: 10 };

/** The quick-match queue (M3): its socket is guarded; pairing comes with GD-STORY-009. */
export class LobbyDO extends SocketDO<ClientToLobby> {
  protected readonly limits = LOBBY_LIMITS;

  protected parse(text: string) {
    return parseClientToLobby(text);
  }

  protected encodeError(code: RefusalCode, message: string): string {
    return encodeLobbyToClient({ type: 'error', code, message });
  }

  protected received(): void {
    // Pairing arrives with GD-STORY-009.
  }

  health(): 'ok' {
    return 'ok';
  }
}

/** One match, private or quick (M3): its sockets are guarded; the referee comes with GD-STORY-011. */
export class MatchDO extends SocketDO<ClientToMatch> {
  protected readonly limits = MATCH_LIMITS;

  protected parse(text: string) {
    return parseClientToMatch(text);
  }

  protected encodeError(code: RefusalCode, message: string): string {
    return encodeMatchToClient({ type: 'error', code, message });
  }

  protected received(): void {
    // The referee arrives with GD-STORY-011.
  }

  health(): 'ok' {
    return 'ok';
  }
}

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

/**
 * `/ws/lobby` and `/ws/match/<id>`: a WebSocket upgrade, at most 60 a minute from one address
 * (the `UPGRADES` rate limiter), handed to the Durable Object that owns it.
 */
async function socket(request: Request, env: Env, path: string): Promise<Response> {
  const id = MATCH_SOCKET.exec(path)?.[1];
  if (path !== '/ws/lobby' && !(id && matchId.safeParse(id).success)) return notFound();
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return Response.json({ error: 'Expected a WebSocket upgrade' }, { status: 426 });
  }
  const address = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (!(await env.UPGRADES.limit({ key: address })).success) {
    return Response.json({ error: 'Too many connections' }, { status: 429 });
  }
  return id ? env.MATCH.getByName(id).fetch(request) : env.LOBBY.getByName('quick').fetch(request);
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
    if (url.pathname.startsWith('/ws/')) return socket(request, env, url.pathname);
    if (url.pathname.startsWith('/api/')) return notFound();
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
