import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../test/fakeServer';
import { App } from './App';
import { MatchRouteError, RouteError } from './RouteError';
import { DEFAULT_BINDINGS } from './input/bindings';
import { InputController } from './input/InputController';
import { webSocketLink } from './net/link';
import { MatchClient } from './net/MatchClient';
import { routes } from './routes';
import { useDev } from './state/dev';
import type { OnlineSession } from './state/OnlineSession';
import { PREFS_KEY, usePrefs } from './state/prefs';

/** The tab's title is set after the screen paints, so it may lag the screen by a moment. */
const titled = (title: string) => waitFor(() => expect(document.title).toBe(title));

function renderAt(path: string, routeList: RouteObject[] = routes) {
  const router = createMemoryRouter(routeList, { initialEntries: [path] });
  render(<App router={router} />);
  return router;
}

let server: ReturnType<typeof fakeServer>;

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            ok: true,
            environment: 'preview',
            protocol: 1,
            lobby: 'ok',
            match: 'ok',
          }),
        ),
      ),
    ),
  );
  // Bot matches are made and played on a stand-in for the Worker and its Match DO.
  server = fakeServer();
});

afterEach(() => {
  // Unmounted first, while the stand-ins are still in place: a match still being made when the
  // test ends must not open a real socket once they are gone.
  cleanup();
  server.close();
  // The private games' seats this browser kept: each test's codes start again from GD-T001.
  localStorage.removeItem('garbage-day:games');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('routes', () => {
  it('names each screen in the tab title, and says the new name when the screen changes', async () => {
    const announced = () =>
      document.querySelector('[aria-live="polite"][aria-atomic]')?.textContent;
    renderAt('/');
    await screen.findByRole('heading', { level: 1, name: 'Garbage Day' });
    await titled('Garbage Day');
    expect(announced()).toBe('Garbage Day');
    fireEvent.click(screen.getByRole('button', { name: 'Play a bot' }));
    await screen.findByRole('heading', { level: 1, name: 'Play a bot' });
    await titled('Play a bot · Garbage Day');
    expect(announced()).toBe('Play a bot');
    fireEvent.click(screen.getByRole('button', { name: 'Rookie' }));
    await screen.findByRole('button', { name: 'Leave' });
    await titled('Match · Garbage Day');
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    await screen.findByRole('heading', { level: 1, name: 'Garbage Day' });
    await titled('Garbage Day');
  });

  it('an unknown page is named as such', async () => {
    renderAt('/nowhere');
    await screen.findByRole('heading', { level: 1, name: 'Nothing here' });
    await titled('Nothing here · Garbage Day');
  });

  it('the ` key opens the developer overlay over any screen, and it follows the match', async () => {
    // The overlay is a lazy chunk. Loaded here first, it opens as soon as the key is pressed,
    // however busy the machine is: on a loaded CI runner its first import outlasted findBy's 1 s.
    await import('./features/dev');
    renderAt('/');
    await screen.findByRole('heading', { level: 1, name: 'Garbage Day' });
    expect(screen.queryByRole('complementary', { name: 'Developer overlay' })).toBeNull();
    fireEvent.keyDown(window, { code: 'Backquote' });
    const overlay = await screen.findByRole('complementary', { name: 'Developer overlay' });
    expect(overlay.textContent).toContain('home');
    fireEvent.click(screen.getByRole('button', { name: 'Play a bot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Rookie' }));
    await screen.findByRole('button', { name: 'Leave' });
    expect(overlay.textContent).toContain('countdown');
    // The match hands the overlay its session in an effect, after the screen paints.
    await waitFor(() => expect(useDev.getState().session).not.toBeNull());
    fireEvent.keyDown(window, { code: 'Backquote' });
    expect(screen.queryByRole('complementary', { name: 'Developer overlay' })).toBeNull();
    useDev.setState({ open: false, session: null });
  });

  it('home shows the name, the ways in, and the server status', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { level: 1, name: 'Garbage Day' })).toBeDefined();
    expect((await screen.findByText(/Server ready/)).textContent).toBe(
      'Server ready · preview · protocol 1',
    );
    expect(screen.getByRole('button', { name: 'Play a bot' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Quick match' }).hasAttribute('disabled')).toBe(
      false,
    );
  });

  it('home says so when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('offline'))),
    );
    renderAt('/');
    expect(await screen.findByText('Server unreachable')).toBeDefined();
  });

  it('goes from home to a bot, then to the match', async () => {
    const router = renderAt('/');
    fireEvent.click(await screen.findByRole('button', { name: 'Play a bot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Regular' }));
    expect(await screen.findByRole('region', { name: 'Bot · Regular' })).toBeDefined();
    expect(router.state.location.pathname).toBe('/play');
    expect(screen.getByRole('img', { name: 'Your board' })).toBeDefined();
    expect(screen.getByRole('timer').textContent).toBe('3');
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    expect(await screen.findByRole('heading', { name: 'Garbage Day' })).toBeDefined();
  });

  it('a match keeps the screen awake, and lets it sleep after', async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ released: false, release }));
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
    try {
      renderAt('/');
      fireEvent.click(await screen.findByRole('button', { name: 'Play a bot' }));
      fireEvent.click(await screen.findByRole('button', { name: 'Regular' }));
      await screen.findByRole('img', { name: 'Your board' });
      await waitFor(() => expect(request).toHaveBeenCalledWith('screen'));
      fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
      await screen.findByRole('heading', { name: 'Garbage Day' });
      await waitFor(() => expect(release).toHaveBeenCalled());
    } finally {
      Reflect.deleteProperty(navigator, 'wakeLock');
    }
  });

  it('/play with no match under way goes home', async () => {
    const router = renderAt('/play');
    expect(await screen.findByRole('heading', { name: 'Garbage Day' })).toBeDefined();
    expect(router.state.location.pathname).toBe('/');
  });

  it('/g/:code takes a game code, and says so when nobody made that game', async () => {
    renderAt('/g/GD-7KQ4');
    expect(await screen.findByRole('heading', { name: 'No game has that code' })).toBeDefined();
  });

  it('/g/:code explains a link that is not a game', async () => {
    renderAt('/g/nope');
    expect(await screen.findByRole('heading', { name: 'Nothing here' })).toBeDefined();
    expect(screen.getByText('That link is not a game.')).toBeDefined();
  });

  it('an unknown page says so and offers home', async () => {
    renderAt('/nowhere');
    expect(await screen.findByRole('heading', { name: 'Nothing here' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Home' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('/new has its screen', async () => {
    renderAt('/new');
    expect(await screen.findByRole('heading', { name: 'Create a game' })).toBeDefined();
  });

  it('/settings has its screen', async () => {
    renderAt('/settings');
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeDefined();
  });
});

describe('preferences', () => {
  const initial = usePrefs.getState();
  afterEach(() => {
    usePrefs.setState(initial, true);
    localStorage.clear();
  });
  const saved = () =>
    (JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as { state?: object }).state;

  it('home shows the generated name, and "New name" replaces it', async () => {
    usePrefs.setState({ handle: 'Quiet Wren 7' });
    renderAt('/');
    expect((await screen.findByText(/^Playing as/)).textContent).toContain('Quiet Wren 7');
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'New name' }));
    });
    const next = usePrefs.getState().handle;
    expect(screen.getByText(/^Playing as/).textContent).toContain(next);
    expect(saved()).toMatchObject({ handle: next });
  });

  it('settings turn sound on and keep it', async () => {
    renderAt('/settings');
    fireEvent.click(await screen.findByRole('switch', { name: 'Sound effects', checked: false }));
    expect(
      await screen.findByRole('switch', { name: 'Sound effects', checked: true }),
    ).toBeDefined();
    expect(saved()).toMatchObject({ sound: true });
  });

  it('settings reduce motion for the whole app, and can hand it back to the device', async () => {
    renderAt('/settings');
    const motion = await screen.findByRole('combobox', { name: 'Animations' });
    fireEvent.change(motion, { target: { value: 'reduce' } });
    expect(document.documentElement.dataset.motion).toBe('reduce');
    expect(saved()).toMatchObject({ motion: 'reduce' });
    fireEvent.change(motion, { target: { value: 'system' } });
    expect(document.documentElement.dataset.motion).toBeUndefined();
  });

  it('home names the drop key the player chose', async () => {
    usePrefs.setState({ bindings: { ...DEFAULT_BINDINGS, hard: ['KeyJ'] } });
    renderAt('/');
    expect((await screen.findByText(/to drop/)).textContent).toBe(
      'Live versus falling blocks. Press J to drop.',
    );
  });

  it('a match listens to the player’s keys, not the defaults', async () => {
    usePrefs.setState({ bindings: { ...DEFAULT_BINDINGS, hard: ['KeyJ'] } });
    renderAt('/');
    fireEvent.click(await screen.findByRole('button', { name: 'Play a bot' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Regular' }));
    await screen.findByRole('img', { name: 'Your board' });
    // A bound key is the game's, so the page never sees it (no scrolling); others pass through.
    const keydown = (code: string) => {
      const e = new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true });
      window.dispatchEvent(e);
      return e.defaultPrevented;
    };
    expect(keydown('KeyJ')).toBe(true);
    expect(keydown('Space')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
  });

  it('settings "Done" goes home', async () => {
    const router = renderAt('/settings');
    fireEvent.click(await screen.findByRole('button', { name: 'Done' }));
    expect(await screen.findByRole('heading', { name: 'Garbage Day' })).toBeDefined();
    expect(router.state.location.pathname).toBe('/');
  });
});

describe('bot setup', () => {
  const initial = usePrefs.getState();
  afterEach(() => {
    usePrefs.setState(initial, true);
    localStorage.clear();
  });

  it('a preset starts at once, at the speed last chosen, and is remembered', async () => {
    usePrefs.setState({ bot: { skill: 7, speed: 3 } });
    const router = renderAt('/bot');
    expect(
      (await screen.findByRole('slider', { name: 'Skill' })).getAttribute('aria-valuetext'),
    ).toBe('7');
    expect(screen.getByText('Rookie is skill 2, Regular 5, Pro 8, each at speed 3.')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Pro' }));
    expect(await screen.findByRole('region', { name: 'Bot · Pro' })).toBeDefined();
    expect(router.state.location.pathname).toBe('/play');
    expect(usePrefs.getState().bot).toEqual({ skill: 8, speed: 3 });
  });

  it('plays a bot of your own skill and speed', async () => {
    renderAt('/bot');
    const skill = await screen.findByRole('slider', { name: 'Skill' });
    expect(skill.getAttribute('aria-valuetext')).toBe('5 · Regular');
    fireEvent.change(skill, { target: { value: '9' } });
    fireEvent.change(screen.getByRole('slider', { name: 'Speed' }), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Play skill 9, speed 2' }));
    expect(await screen.findByRole('region', { name: 'Bot · skill 9, speed 2' })).toBeDefined();
    expect(usePrefs.getState().bot).toEqual({ skill: 9, speed: 2 });
  });

  it('plays a bot on the mode and speed-up chosen, and keeps them with the bot (GD-TICKET-026)', async () => {
    renderAt('/bot');
    const mode = await screen.findByRole('combobox', { name: 'Mode' });
    // Pauses don't exist yet, so a bot game offers only these two.
    expect(screen.queryByRole('combobox', { name: 'Pauses' })).toBeNull();
    fireEvent.change(mode, { target: { value: 'classic' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Speed-up every' }), {
      target: { value: '30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Regular' }));
    await screen.findByRole('region', { name: 'Bot · Regular' });
    await waitFor(() => expect(server.last().referee).not.toBeNull());
    expect(server.last().settings).toMatchObject({ mode: 'classic', rampSec: 30 });
    const session = useDev.getState().session as OnlineSession | null;
    await waitFor(() => expect(session?.match.rules).toMatchObject({ rampSec: 30, gemChance: 0 }));
    expect(usePrefs.getState().botSettings).toMatchObject({ mode: 'classic', rampSec: 30 });
    useDev.setState({ open: false, session: null });
  });
});

describe('a bot match, through the match server (GD-STORY-015)', () => {
  afterEach(() => useDev.setState({ open: false, session: null }));

  it('seats the bot from its own worker, and the page plays only its player', async () => {
    renderAt('/bot');
    fireEvent.click(await screen.findByRole('button', { name: 'Regular' }));
    await screen.findByRole('img', { name: 'Your board' });
    // The match was made for two: the page took one seat, and the worker the bot's.
    await waitFor(() => expect(server.last().referee).not.toBeNull());
    const match = server.last();
    const jobs = server.workers.map((w) => w.job);
    expect(jobs).toMatchObject([{ token: match.tokens[1], bot: { skill: 5, speed: 5 } }]);
    expect(jobs[0]?.url.endsWith(`/ws/match/${match.id}`)).toBe(true);
    expect(match.bots).toEqual([null, { skill: 5, speed: 5 }]);
    // The page's player is driven by its keys, never by a bot.
    const session = useDev.getState().session as OnlineSession | null;
    if (!session) throw new Error('no match session');
    expect(session.match.controller).toBeInstanceOf(InputController);
    // Standard deals power-ups: both sides show a slot for one.
    expect(screen.getAllByLabelText(/^Power-up/)).toHaveLength(2);
    // Past the countdown the bot plays its pieces, and the page sees them as the referee relays them.
    await waitFor(() => expect(session.match.opponent.stats?.pieces ?? 0).toBeGreaterThan(0), {
      timeout: 10_000,
    });
    // Leaving ends the match at the referee, and the bot's worker goes.
    fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
    await waitFor(() => expect(match.referee?.result?.reason).toBe('left'));
    expect(server.workers[0]?.terminated).toBe(true);
  });

  it('a rematch against the bot starts another match, the bot asking for it too (GD-STORY-014)', async () => {
    renderAt('/bot');
    fireEvent.click(await screen.findByRole('button', { name: 'Regular' }));
    await screen.findByRole('img', { name: 'Your board' });
    await waitFor(() => expect(server.last().referee).not.toBeNull());
    const match = server.last();
    const first = match.referee;
    const session = useDev.getState().session as OnlineSession | null;
    if (!session) throw new Error('no match session');
    // The player's seat leaves, so the referee ends the match; the bot stays and asks for a rematch.
    match.leave(0);
    await waitFor(() => expect(session.match.result).not.toBeNull());
    // happy-dom draws no canvas, so nothing steps the match: two seconds of frames, by hand.
    let now = 0;
    act(() => {
      for (let i = 0; i < 120; i++) session.frame((now += 1000 / 60));
    });
    // The bot asked at once, and the button says so.
    fireEvent.click(await screen.findByRole('button', { name: 'Rival wants a rematch' }));
    // The bot stayed, so both have asked: the referee deals a new match on the same seats.
    await waitFor(() => expect(match.referee).not.toBe(first));
    await waitFor(() => expect(match.referee?.state).not.toBe('over'));
    await screen.findByRole('img', { name: 'Your board' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(server.workers[0]?.terminated).toBe(false);
  });

  it('says the connection is lost when no match can be made', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 429 }))),
    );
    renderAt('/bot');
    fireEvent.click(await screen.findByRole('button', { name: 'Regular' }));
    expect(await screen.findByText('Connection lost')).toBeDefined();
    expect(server.workers).toEqual([]);
  });
});

describe('a bot always reads as a bot (GD-TICKET-016)', () => {
  afterEach(() => {
    vi.useRealTimers();
    useDev.setState({ open: false, session: null });
  });

  it('names the bot on the offer, the match screen and the result of a bot played while waiting', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    usePrefs.getState().setBot({ skill: 5, speed: 7 });
    renderAt('/');
    fireEvent.click(await screen.findByRole('button', { name: 'Quick match' }));
    await screen.findByRole('heading', { name: 'Looking for an opponent' });
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    const offer = await screen.findByRole('region', { name: 'Nobody yet' });
    expect(offer.textContent).toContain('Bot · Regular can play you meanwhile.');
    vi.useRealTimers();
    fireEvent.click(screen.getByRole('button', { name: 'Play a bot while you wait' }));
    expect(await screen.findByRole('region', { name: 'Bot · Regular' })).toBeDefined();
    expect(screen.getByRole('banner').textContent).toContain('Bot · Regular');
    // The bot leaves: the result names it too.
    const session = useDev.getState().session as OnlineSession | null;
    if (!session) throw new Error('no match session');
    await waitFor(() => expect(server.last().referee).not.toBeNull());
    server.last().leave(1);
    await waitFor(() => expect(session.match.result).not.toBeNull());
    // happy-dom draws no canvas, so nothing steps the match: two seconds of frames, by hand.
    let now = 0;
    act(() => {
      for (let i = 0; i < 120; i++) session.frame((now += 1000 / 60));
    });
    const result = await screen.findByRole('dialog');
    expect(result.textContent).toContain('Bot · Regular');
  });
});

describe('private games (GD-STORY-010)', () => {
  const initial = usePrefs.getState();
  afterEach(() => {
    usePrefs.setState(initial, true);
    useDev.setState({ open: false, session: null });
    Reflect.deleteProperty(navigator, 'clipboard');
  });

  /** Another browser in game `code`: its seat taken with `token`, under `handle`. */
  function friend(code: string, token: string, handle = 'Rowdy Puffin 22') {
    const client = new MatchClient({ handle });
    client.start({ connect: webSocketLink(`ws://garbage-day.test/ws/match/${code}`), token });
    return client;
  }

  it('makes a game on the settings chosen, and opens its lobby with the link to send', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const router = renderAt('/');
    fireEvent.click(await screen.findByRole('button', { name: 'Create game' }));
    fireEvent.change(await screen.findByRole('combobox', { name: 'Mode' }), {
      target: { value: 'classic' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create game' }));
    expect(await screen.findByRole('heading', { name: 'Game GD-T001' })).toBeDefined();
    expect(router.state.location.pathname).toBe('/g/GD-T001');
    expect(server.last().settings.mode).toBe('classic');
    expect(usePrefs.getState().settings.mode).toBe('classic');
    const link = screen.getByRole<HTMLInputElement>('textbox', { name: 'Game link' }).value;
    expect(link).toMatch(/\/g\/GD-T001$/);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith(link);
    expect(await screen.findByText('Link copied.')).toBeDefined();
    expect(await screen.findByText('Waiting for your friend…')).toBeDefined();
  });

  it('starts the match once a friend has joined and both are ready, on the game’s settings', async () => {
    renderAt('/new');
    fireEvent.change(await screen.findByRole('combobox', { name: 'Speed-up every' }), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Mode' }), {
      target: { value: 'classic' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create game' }));
    await screen.findByRole('heading', { name: 'Game GD-T001' });
    const game = server.last();
    const seat = game.join();
    if (!('token' in seat)) throw new Error('no guest seat');
    const guest = friend(game.id, seat.token);
    expect(await screen.findByText('Rowdy Puffin 22')).toBeDefined();
    guest.say({ type: 'ready' });
    await waitFor(() => expect(game.ready).toEqual([false, true]));
    fireEvent.click(screen.getByRole('button', { name: 'Ready' }));
    // Both ready: the referee starts, and the lobby becomes the match against the friend.
    expect(await screen.findByRole('region', { name: 'Rowdy Puffin 22' })).toBeDefined();
    const session = useDev.getState().session as OnlineSession | null;
    expect(session?.match.rules.rampSec).toBe(30);
    expect(guest.match.rules.rampSec).toBe(30);
    // Classic deals no power-ups, so neither side shows a power-up slot. happy-dom draws no
    // canvas, so a frame by hand brings the view up to the start.
    act(() => {
      session?.frame(1);
      session?.frame(20);
    });
    expect(screen.queryAllByLabelText(/^Power-up/)).toHaveLength(0);
    guest.close();
  });

  it('shows a friend who came by the link both players and the settings, which only the host sets', async () => {
    const game = server.openGame({ ...usePrefs.getState().settings, mode: 'classic' });
    const host = friend(game.id, game.tokens[0], 'Brisk Heron 42');
    await waitFor(() => expect(game.handles[0]).toBe('Brisk Heron 42'));
    renderAt(`/g/${game.id}`);
    expect(await screen.findByText('Brisk Heron 42')).toBeDefined();
    expect(screen.getByText('Classic: neither')).toBeDefined();
    expect(screen.queryByRole('combobox', { name: 'Mode' })).toBeNull();
    expect(screen.getByText('The player who made the game sets these.')).toBeDefined();
    host.close();
  });

  it('tells a third visitor the game is full, and offers quick match', async () => {
    const game = server.openGame();
    game.join();
    renderAt(`/g/${game.id}`);
    expect(await screen.findByRole('heading', { name: 'This game is full' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Quick match' })).toBeDefined();
  });

  it('says a game has expired, in its lobby and on its link after', async () => {
    renderAt('/new');
    fireEvent.click(await screen.findByRole('button', { name: 'Create game' }));
    await screen.findByText('Waiting for your friend…');
    const game = server.last();
    game.expire();
    expect(await screen.findByRole('heading', { name: 'This game has expired' })).toBeDefined();
    cleanup();
    renderAt(`/g/${game.id}`);
    expect(await screen.findByRole('heading', { name: 'This game has expired' })).toBeDefined();
  });

  it('opens a game by its code from home, with or without its GD-', async () => {
    const router = renderAt('/');
    const code = await screen.findByRole('textbox', { name: 'Have a game code?' });
    fireEvent.change(code, { target: { value: 'GD-12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    expect((await screen.findByRole('alert')).textContent).toBe(
      'A game code is GD- and four letters or digits.',
    );
    fireEvent.change(code, { target: { value: '7kq4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/g/GD-7KQ4'));
  });
});

describe('error boundaries', () => {
  const broken = (ErrorBoundary: () => ReactNode): RouteObject[] => [
    {
      path: '/',
      ErrorBoundary,
      Component: () => {
        throw new Error('boom');
      },
    },
  ];

  it('offers to try again, then home', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await act(async () => {
      renderAt('/', broken(RouteError));
      await Promise.resolve();
    });
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Home' })).toBeDefined();
  });

  it('in a match, offers to get back into it first', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderAt('/', broken(MatchRouteError));
    const buttons = await screen.findAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Back to the match', 'Home']);
  });
});
