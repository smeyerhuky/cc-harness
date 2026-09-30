import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import type { Health } from './index';

describe('the Worker', () => {
  it('answers /api/health from both Durable Objects', async () => {
    const res = await exports.default.fetch('https://garbage-day.example/api/health');
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(await res.json<Health>()).toEqual({
      ok: true,
      environment: 'production',
      protocol: 1,
      lobby: 'ok',
      match: 'ok',
    });
  });

  it('reports a local request as development', async () => {
    const res = await exports.default.fetch('http://localhost/api/health');
    expect((await res.json<Health>()).environment).toBe('development');
  });

  it('answers 404 for an unknown API or socket path, not the app page', async () => {
    for (const path of ['/api/nope', '/ws/lobby']) {
      const res = await exports.default.fetch(`https://garbage-day.example${path}`);
      expect(res.status).toBe(404);
    }
  });

  it('binds both Durable Object classes', async () => {
    expect(await env.LOBBY.getByName('quick').health()).toBe('ok');
    expect(await env.MATCH.getByName('GD-7KQ4').health()).toBe('ok');
  });
});
