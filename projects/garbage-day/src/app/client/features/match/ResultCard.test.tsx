import { TPS, type RefereeResult } from '@garbage-day/engine';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InputController } from '../../input/InputController';
import { AppActorContext } from '../../state/appActor';
import { MatchSession, type MatchEffect, type MatchView } from '../../state/MatchSession';
import { MatchSessionContext } from '../../state/matchContexts';
import { AttackLayer } from './AttackLayer';
import { MatchBanner } from './Panels';
import { pps, ResultCard } from './ResultCard';

/** A snapshot from a real session, with its result and totals set by the test. */
function viewWith(result: RefereeResult, totals: MatchView['players'][0]['totals']): MatchView {
  const base = new MatchSession({
    seed: 7,
    bot: { skill: 5, speed: 5 },
    input: new InputController(),
  }).getSnapshot();
  const [a, b] = base.players;
  return {
    ...base,
    phase: 'over',
    result,
    players: [
      { ...a, totals },
      { ...b, totals: { ...totals, lines: 3 } },
    ],
  };
}

/** Puts the app machine into a quick match against another person, as a pairing would. */
function Paired() {
  const app = AppActorContext.useActorRef();
  useState(() => {
    app.send({ type: 'QUICK_MATCH' });
    app.send({ type: 'MATCHED', opponent: 'Quiet Wren 7', matchId: 'Q-1', token: 'token-x' });
    return null;
  });
  return null;
}

function renderCard(view: MatchView, onSound = vi.fn(), online = false) {
  const store = { subscribe: () => () => undefined, getSnapshot: () => view };
  const stage = { current: null };
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AppActorContext.Provider>
            {online && <Paired />}
            <MatchSessionContext.Provider store={store}>
              <ResultCard opponent="Bot · Regular" stage={stage} onSound={onSound} />
            </MatchSessionContext.Provider>
          </AppActorContext.Provider>
        ),
      },
    ],
    { initialEntries: ['/'] },
  );
  render(<RouterProvider router={router} />);
  return onSound;
}

const TOTALS = { lines: 24, sent: 11, quads: 2, tspins: 1, powersUsed: 3, pieces: 108 };

describe('ResultCard', () => {
  it('offers only Home after a match against a person, until rematches need both (M3)', () => {
    renderCard(
      viewWith(
        { winner: 1, reason: 'topout', by: 0, activeTicks: 30 * TPS, ticks: 31 * TPS },
        TOTALS,
      ),
      vi.fn(),
      true,
    );
    expect(screen.queryByRole('button', { name: 'Rematch' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Home' })).toBeDefined();
  });

  it('says who won and why, with both players’ stats', async () => {
    const onSound = renderCard(
      viewWith(
        { winner: 0, reason: 'topout', by: 1, activeTicks: 60 * TPS, ticks: 62 * TPS },
        TOTALS,
      ),
    );
    const card = await screen.findByRole('dialog', { name: 'You win' });
    expect(within(card).getByText('Bot · Regular topped out at 1:00.')).toBeDefined();
    const rows = within(card)
      .getAllByRole('row')
      .map((r) => [...r.children].map((c) => c.textContent));
    expect(rows).toEqual([
      ['', 'You', 'Bot · Regular'],
      ['Lines', '24', '3'],
      ['Garbage sent', '11', '11'],
      ['Quads', '2', '2'],
      ['T-spins', '1', '1'],
      ['Power-ups used', '3', '3'],
      ['Pieces per second', '1.8', '1.8'],
    ]);
    expect(within(card).getByRole('button', { name: 'Rematch' })).toBeDefined();
    expect(onSound).toHaveBeenCalledWith('win');
    // The card has focus, so a Space still pressed from play doesn't start a rematch.
    expect(document.activeElement).toBe(card);
  });

  it('plays the losing sound when the rival wins', async () => {
    const onSound = renderCard(
      viewWith(
        { winner: 1, reason: 'topout', by: 0, activeTicks: 30 * TPS, ticks: 30 * TPS },
        TOTALS,
      ),
    );
    await screen.findByRole('dialog', { name: 'Bot · Regular wins' });
    expect(onSound).toHaveBeenCalledWith('lose');
    expect(onSound).toHaveBeenCalledTimes(1);
  });

  it('counts pieces per second over active play', () => {
    expect([pps(108, 60), pps(0, 0), pps(5, 3)]).toEqual(['1.8', '0.0', '1.7']);
  });
});

describe('AttackLayer', () => {
  it('pulses the referee as an attack passes through it', () => {
    const listeners = new Set<(e: MatchEffect) => void>();
    const session = {
      onEffect: (l: (e: MatchEffect) => void) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
    } as unknown as MatchSession;
    const root = document.createElement('div');
    root.innerHTML =
      '<div data-board="0"></div><span data-referee></span><div data-meter="1"></div>';
    const referee = root.querySelector('[data-referee]') as HTMLElement;
    const animate = vi.fn();
    referee.animate = animate;
    render(<AttackLayer session={session} stage={{ current: root }} />);
    act(() => {
      listeners.forEach((l) => l({ kind: 'attack', from: 0, to: 1, rows: 2, doubled: false }));
    });
    expect(animate).toHaveBeenCalledOnce();
  });
});

describe('MatchBanner', () => {
  const show = (
    showdown: MatchView['showdown'],
    connection: MatchView['connection'] = 'online',
  ) => {
    const view = { ...viewWith(null as unknown as RefereeResult, TOTALS), showdown, connection };
    const store = { subscribe: () => () => undefined, getSnapshot: () => view };
    return render(
      <MatchSessionContext.Provider store={store}>
        <MatchBanner />
      </MatchSessionContext.Provider>,
    );
  };

  it('counts down to a showdown, then names it while it runs', () => {
    show({ kind: 'double', startsIn: 3 });
    expect(screen.getByRole('status').textContent).toBe('Double garbage in 3');
    cleanup();
    show({ kind: 'double', startsIn: null });
    expect(screen.getByRole('status').textContent).toBe('Double garbage');
  });

  it('shows Sudden death once it starts, and nothing without a showdown', () => {
    const { container, unmount } = show(null);
    expect(container.textContent).toBe('');
    unmount();
    show({ kind: 'sudden', startsIn: null });
    expect(screen.getByRole('status').textContent).toBe('Sudden death');
  });

  it('says the connection is down before anything else (GD-TICKET-013)', () => {
    show({ kind: 'sudden', startsIn: null }, 'reconnecting');
    expect(screen.getByRole('status').textContent).toBe('Reconnecting…');
    cleanup();
    show(null, 'lost');
    expect(screen.getByRole('status').textContent).toBe('Connection lost');
  });
});
