import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import { loadServerStatus } from './health';

describe('App', () => {
  it('shows the game name as the page heading', async () => {
    // The status line suspends on the promise; an async act lets React retry once it resolves.
    const status = Promise.resolve({ ok: true, environment: 'preview', protocol: 1 } as const);
    await act(async () => {
      render(<App status={status} />);
      await status;
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Garbage Day' })).toBeTruthy();
    expect((await screen.findByText(/Server ready/)).textContent).toBe(
      'Server ready · preview · protocol 1',
    );
  });

  it('says so when the server cannot be reached', async () => {
    const status = Promise.resolve({ ok: false } as const);
    await act(async () => {
      render(<App status={status} />);
      await status;
    });
    expect(await screen.findByText('Server unreachable')).toBeTruthy();
  });
});

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
