import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { InputController } from '../../input/InputController';
import { AppActorContext } from '../../state/appActor';
import { useDev } from '../../state/dev';
import { MatchSession } from '../../state/MatchSession';
import { DevOverlay } from './DevOverlay';

afterEach(() => {
  useDev.setState({ open: false, session: null });
  sessionStorage.clear();
});

function show() {
  act(() => useDev.getState().setOpen(true));
  render(
    <AppActorContext.Provider>
      {/* As the shell does: shown while switched on. */}
      <Shown />
    </AppActorContext.Provider>,
  );
}

function Shown() {
  return useDev((s) => s.open) ? <DevOverlay /> : null;
}

describe('DevOverlay', () => {
  it('opens on the app machine, logs a match’s messages, and closes', async () => {
    show();
    const overlay = screen.getByRole('complementary', { name: 'Developer overlay' });
    expect(within(overlay).getByText('home')).toBeDefined();
    expect(within(overlay).getByText('No match on screen.')).toBeDefined();

    const session = new MatchSession({
      seed: 5,
      bot: { skill: 5, speed: 5 },
      input: new InputController(),
    });
    act(() => {
      useDev.getState().attach(session);
    });
    let now = 0;
    act(() => {
      for (let i = 0; i < 300; i++) session.frame((now += 1000 / 60));
    });
    const caption = await screen.findByText(
      /^Wire log: [1-9]\d* shown of [1-9]\d* messages, positions and heartbeats hidden$/,
    );
    const log = caption.closest('table');
    if (!log) throw new Error('no log table');
    expect(within(log).getAllByText('bag').length).toBeGreaterThan(0);
    expect(within(log).getAllByText('Referee → You').length).toBeGreaterThan(0);
    expect(within(log).queryByText('pos')).toBeNull();
    expect(screen.getByText(/Online it is the Match Durable Object/)).toBeDefined();

    fireEvent.click(screen.getByRole('switch', { name: 'Positions and heartbeats' }));
    expect(within(log).getAllByText('pos').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(useDev.getState().open).toBe(false);
    expect(screen.queryByRole('complementary', { name: 'Developer overlay' })).toBeNull();
  });
});
