import { describe, expect, it } from 'vitest';
import { loadServerStatus } from './health';

describe('loadServerStatus', () => {
  const answer =
    (body: unknown, status = 200) =>
    () =>
      Promise.resolve(new Response(JSON.stringify(body), { status }));

  it('reads the Worker’s health', async () => {
    const status = await loadServerStatus(
      answer({ ok: true, environment: 'production', protocol: 1, lobby: 'ok', match: 'ok' }),
    );
    expect(status).toEqual({ ok: true, environment: 'production', protocol: 1 });
  });

  it('treats an error status, a wrong shape or a network failure as unreachable', async () => {
    expect(await loadServerStatus(answer({ ok: true }, 500))).toEqual({ ok: false });
    expect(await loadServerStatus(answer({ nope: 1 }))).toEqual({ ok: false });
    expect(await loadServerStatus(() => Promise.reject(new Error('offline')))).toEqual({
      ok: false,
    });
  });
});
