import { matchId, PROTOCOL_VERSION } from '@garbage-day/protocol';

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
