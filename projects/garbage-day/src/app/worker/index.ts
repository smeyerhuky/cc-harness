import { PROTOCOL_VERSION } from '@garbage-day/protocol';
import { DurableObject } from 'cloudflare:workers';

/** The quick-match queue (M3). For now it answers health checks. */
export class LobbyDO extends DurableObject<Env> {
  health(): 'ok' {
    return 'ok';
  }
}

/** One match, private or quick (M3). For now it answers health checks. */
export class MatchDO extends DurableObject<Env> {
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
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
      return Response.json({ error: 'Not found' }, { status: 404 });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
