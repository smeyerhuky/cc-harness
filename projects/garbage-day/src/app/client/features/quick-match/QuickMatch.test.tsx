import { encodeLobbyToClient } from '@garbage-day/protocol';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Actor } from 'xstate';
import type { Connect, LinkHandlers } from '../../net/link';
import { AppActorContext } from '../../state/appActor';
import type { appMachine } from '../../state/appMachine';
import { usePrefs } from '../../state/prefs';
import { QuickMatchLink } from './QuickMatchLink';
import { SearchingScreen } from './SearchingScreen';

type AppActor = Actor<typeof appMachine>;

/** A lobby link the test drives: what was sent, and the handlers to answer through. */
function fakeLobby() {
  const sent: string[] = [];
  let closed = false;
  let h: LinkHandlers | null = null;
  const connect: Connect = (handlers) => {
    h = handlers;
    return {
      send: (text) => sent.push(text),
      close: () => {
        closed = true;
      },
    };
  };
  const say = (msg: Parameters<typeof encodeLobbyToClient>[0]) =>
    act(() => h?.message(encodeLobbyToClient(msg)));
  return { sent, connect, open: () => act(() => h?.open()), say, closed: () => closed };
}

/** Renders `ui` with the app actor, after `setup` has put it where the test needs it. */
function renderWith(ui: React.ReactNode, setup: (app: AppActor) => void = () => undefined) {
  let actor: AppActor | null = null;
  function Grab() {
    const app = AppActorContext.useActorRef();
    if (!actor) {
      actor = app;
      setup(app);
    }
    return null;
  }
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AppActorContext.Provider>
            <Grab />
            {ui}
          </AppActorContext.Provider>
        ),
      },
    ],
    { initialEntries: ['/'] },
  );
  const view = render(<RouterProvider router={router} />);
  const app = () => {
    if (!actor) throw new Error('no actor');
    return actor;
  };
  return { ...view, app };
}

describe('QuickMatchLink', () => {
  it('queues with the player’s handle, and hears the count and the pairing', () => {
    const lobby = fakeLobby();
    const r = renderWith(<QuickMatchLink connect={() => lobby.connect} />, (app) =>
      app.send({ type: 'QUICK_MATCH' }),
    );
    lobby.open();
    expect(lobby.sent).toEqual([
      JSON.stringify({ v: 1, t: 'queue', handle: usePrefs.getState().handle }),
    ]);
    lobby.say({ type: 'waiting', count: 2 });
    expect(r.app().getSnapshot().context.waiting).toBe(2);
    lobby.say({
      type: 'matched',
      matchId: 'Q-0123456789',
      token: 'token-seat-one-11111',
      opponent: 'Quiet Wren 7',
    });
    const s = r.app().getSnapshot();
    expect(s.value).toBe('countdown');
    expect(s.context).toMatchObject({
      mode: 'quick',
      matchId: 'Q-0123456789',
      opponent: 'Quiet Wren 7',
    });
    // Paired: going away doesn't cancel anything.
    r.unmount();
    expect(lobby.sent.some((t) => t.includes('"cancel"'))).toBe(false);
    expect(lobby.closed()).toBe(true);
  });

  it('leaves the queue when it goes before a pairing', () => {
    const lobby = fakeLobby();
    const r = renderWith(<QuickMatchLink connect={() => lobby.connect} />);
    lobby.open();
    r.unmount();
    expect(lobby.sent.at(-1)).toBe(JSON.stringify({ v: 1, t: 'cancel' }));
    expect(lobby.closed()).toBe(true);
  });
});

describe('SearchingScreen', () => {
  it('says how many are waiting', () => {
    const r = renderWith(<SearchingScreen />, (app) => app.send({ type: 'QUICK_MATCH' }));
    expect(screen.getByRole('status').textContent).toBe('Joining the queue…');
    act(() => r.app().send({ type: 'WAITING', count: 1 }));
    expect(screen.getByRole('status').textContent).toBe('You are the only one waiting.');
    act(() => r.app().send({ type: 'WAITING', count: 3 }));
    expect(screen.getByRole('status').textContent).toBe('3 players waiting.');
  });

  it('offers a bot after the wait, and either choice stays in the pool', () => {
    usePrefs.getState().setBot({ skill: 8, speed: 4 });
    const r = renderWith(<SearchingScreen />, (app) => {
      app.send({ type: 'QUICK_MATCH' });
      app.send({ type: 'BOT_OFFER' });
    });
    // The offer names the bot it is (GD-TICKET-016).
    expect(screen.getByRole('region', { name: 'Nobody yet' }).textContent).toContain(
      'Bot · Pro can play you meanwhile.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Keep waiting' }));
    expect(r.app().getSnapshot().value).toBe('searching');
    expect(screen.queryByRole('button', { name: 'Play a bot while you wait' })).toBeNull();
    act(() => r.app().send({ type: 'BOT_OFFER' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play a bot while you wait' }));
    const s = r.app().getSnapshot();
    expect(s.value).toBe('countdown');
    expect(s.context).toMatchObject({ mode: 'bot', queued: true, opponent: 'Bot · Pro' });
  });

  it('cancels back home, out of the pool', () => {
    const r = renderWith(<SearchingScreen />, (app) => app.send({ type: 'QUICK_MATCH' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(r.app().getSnapshot().value).toBe('home');
    expect(r.app().getSnapshot().context.queued).toBe(false);
  });
});
