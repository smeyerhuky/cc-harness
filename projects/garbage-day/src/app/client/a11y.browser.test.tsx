import '@garbage-day/ui/fonts.css';
import '@garbage-day/ui/tokens.css';
import { cleanup, render, screen } from '@testing-library/react';
import axe from 'axe-core';
import { createMemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { fakeServer } from '../test/fakeServer';
import { App } from './App';
import { routes } from './routes';
import { useDev } from './state/dev';
import { usePrefs } from './state/prefs';

// Every M2 screen, in both themes, through axe's WCAG 2.1 A and AA rules (US-20; GD-STORY-008),
// the developer overlay included (GD-TICKET-024).
// A failure lists each rule broken and the elements that break it.

const THEMES = ['light', 'dark'] as const;

let server: ReturnType<typeof fakeServer>;
const initialPrefs = usePrefs.getState();

beforeEach(() => {
  // Motion off, as the player's own setting turns it off: a scan judges what each screen settles
  // on. With motion, a match's countdown number fades in each second, and axe, landing mid-fade,
  // judges it at part opacity, so the verdict would hang on the moment the scan ran.
  usePrefs.setState({ motion: 'reduce' });
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({ ok: true, environment: 'test', protocol: 1, lobby: 'ok', match: 'ok' }),
        ),
      ),
    ),
  );
  // Bot matches are made and played on a stand-in for the Worker and its Match DO.
  server = fakeServer();
});

afterEach(() => {
  cleanup();
  server.close();
  localStorage.removeItem('garbage-day:games');
  usePrefs.setState(initialPrefs, true);
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
});

/** axe's findings, as lines a person can act on. */
async function violations(): Promise<string[]> {
  // With motion reduced, every change still runs a 0.01 ms transition, which ends on the next
  // frame: a button enabled in the last render is at its disabled opacity until then. The scan
  // waits for them, and judges what they end on. Endless ones (a pulse) never end, and are left.
  await Promise.all(
    document
      .getAnimations()
      .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
      .map((a) => a.finished.catch(() => undefined)),
  );
  const result = await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    resultTypes: ['violations'],
  });
  return result.violations.flatMap((v) =>
    v.nodes.map((n) => `${v.id}: ${v.help} — ${n.target.join(' ')}`),
  );
}

const frame = () => new Promise((r) => requestAnimationFrame(r));

function open(path: string) {
  render(<App router={createMemoryRouter(routes, { initialEntries: [path] })} />);
}

describe('the scan itself', () => {
  it('catches real violations, so a clean result means something', async () => {
    render(
      <main>
        <button type="button" />
        <p style={{ color: '#8a8a8a', background: '#9a9a9a' }}>Hard to read</p>
      </main>,
    );
    const found = (await violations()).map((v) => v.split(':')[0]);
    expect(found).toContain('button-name');
    expect(found).toContain('color-contrast');
  });
});

const SCREENS: readonly [string, string, () => Promise<unknown>][] = [
  ['home', '/', () => screen.findByText(/Server ready/)],
  ['bot setup', '/bot', () => screen.findByRole('heading', { name: 'Play a bot' })],
  ['settings', '/settings', () => screen.findByRole('heading', { name: 'Controls' })],
  ['create a game', '/new', () => screen.findByRole('heading', { name: 'Create a game' })],
  [
    'a code nobody made',
    '/g/GD-7KQ4',
    () => screen.findByRole('heading', { name: 'No game has that code' }),
  ],
  ['not a game', '/g/nope', () => screen.findByRole('heading', { name: 'Nothing here' })],
  ['not found', '/nowhere', () => screen.findByRole('heading', { name: 'Nothing here' })],
];

describe.each(THEMES)('accessibility, %s theme', (theme) => {
  beforeEach(() => {
    document.documentElement.dataset.theme = theme;
  });

  it.each(SCREENS)('%s (%s) has no violations', async (_name, path, ready) => {
    open(path);
    await ready();
    expect(await violations()).toEqual([]);
  });

  it('a match, then its result, have no violations', async () => {
    open('/bot');
    (await screen.findByRole('button', { name: 'Regular' })).click();
    await screen.findByRole('img', { name: 'Your board' });
    for (let i = 0; i < 30; i++) await frame();
    expect(await violations()).toEqual([]);
    // Hard-drop until the stack tops out: the result card.
    for (let i = 0; i < 400 && !screen.queryByRole('dialog'); i++) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space', bubbles: true }));
      await frame();
      await frame();
    }
    await screen.findByRole('dialog');
    expect(await violations()).toEqual([]);
    screen.getByRole('button', { name: 'Home' }).click();
  });

  it('a private game’s lobby, the host’s and the guest’s, has no violations (GD-STORY-010)', async () => {
    const game = server.openGame();
    // The host's seat, as making the game keeps it; the guest is in, ready.
    localStorage.setItem('garbage-day:games', JSON.stringify([[game.id, game.tokens[0]]]));
    open(`/g/${game.id}`);
    await screen.findByRole('combobox', { name: 'Mode' });
    await screen.findByText('Waiting for your friend…');
    expect(await violations()).toEqual([]);
    cleanup();
    localStorage.setItem('garbage-day:games', JSON.stringify([[game.id, game.tokens[1]]]));
    open(`/g/${game.id}`);
    await screen.findByText('The player who made the game sets these.');
    expect(await violations()).toEqual([]);
  });

  it('a full game and an expired one have no violations', async () => {
    const full = server.openGame();
    full.join();
    open(`/g/${full.id}`);
    await screen.findByRole('heading', { name: 'This game is full' });
    expect(await violations()).toEqual([]);
    cleanup();
    const gone = server.openGame();
    gone.expire();
    open(`/g/${gone.id}`);
    await screen.findByRole('heading', { name: 'This game has expired' });
    expect(await violations()).toEqual([]);
  });

  it('looking for an opponent has no violations', async () => {
    open('/');
    (await screen.findByRole('button', { name: 'Quick match' })).click();
    await screen.findByRole('heading', { name: 'Looking for an opponent' });
    expect(await violations()).toEqual([]);
    screen.getByRole('button', { name: 'Cancel' }).click();
  });

  it('the developer overlay over a match, with positions shown, has no violations', async () => {
    useDev.getState().setOpen(true);
    try {
      open('/bot');
      (await screen.findByRole('button', { name: 'Rookie' })).click();
      const toggle = await screen.findByRole('switch', { name: 'Positions and heartbeats' });
      toggle.click();
      await screen.findByText(/^Wire log: [1-9]\d* shown/, undefined, { timeout: 3000 });
      expect(await violations()).toEqual([]);
      screen.getByRole('button', { name: 'Leave' }).click();
    } finally {
      useDev.getState().setOpen(false);
    }
  });

  it('a match on a phone, upright, with the button pad, has no violations', async () => {
    const initial = usePrefs.getState();
    await page.viewport(412, 915);
    usePrefs.setState({ pad: true });
    try {
      open('/bot');
      (await screen.findByRole('button', { name: 'Rookie' })).click();
      await screen.findByRole('group', { name: 'Button pad' });
      for (let i = 0; i < 30; i++) await frame();
      expect(await violations()).toEqual([]);
      screen.getByRole('button', { name: 'Leave' }).click();
    } finally {
      usePrefs.setState(initial, true);
      await page.viewport(1280, 800);
    }
  });
});
