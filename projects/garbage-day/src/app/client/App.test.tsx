import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createMemoryRouter, type RouteObject } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { MatchRouteError, RouteError } from './RouteError';
import { DEFAULT_BINDINGS } from './input/bindings';
import { routes } from './routes';
import { useDev } from './state/dev';
import { PREFS_KEY, usePrefs } from './state/prefs';

/** The tab's title is set after the screen paints, so it may lag the screen by a moment. */
const titled = (title: string) => waitFor(() => expect(document.title).toBe(title));

function renderAt(path: string, routeList: RouteObject[] = routes) {
  const router = createMemoryRouter(routeList, { initialEntries: [path] });
  render(<App router={router} />);
  return router;
}

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
});

afterEach(() => {
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
    expect(useDev.getState().session).not.toBeNull();
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
    expect(screen.getByRole('button', { name: 'Quick match' }).hasAttribute('disabled')).toBe(true);
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
      expect(request).toHaveBeenCalledWith('screen');
      fireEvent.click(screen.getByRole('button', { name: 'Leave' }));
      await screen.findByRole('heading', { name: 'Garbage Day' });
      expect(release).toHaveBeenCalled();
    } finally {
      Reflect.deleteProperty(navigator, 'wakeLock');
    }
  });

  it('/play with no match under way goes home', async () => {
    const router = renderAt('/play');
    expect(await screen.findByRole('heading', { name: 'Garbage Day' })).toBeDefined();
    expect(router.state.location.pathname).toBe('/');
  });

  it('/g/:code takes a game code and refuses anything else', async () => {
    renderAt('/g/GD-7KQ4');
    expect(await screen.findByRole('heading', { name: 'Game GD-7KQ4' })).toBeDefined();
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
    expect(await screen.findByRole('region', { name: 'Bot · skill 9' })).toBeDefined();
    expect(usePrefs.getState().bot).toEqual({ skill: 9, speed: 2 });
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
