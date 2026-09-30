import { act, fireEvent, render, screen } from '@testing-library/react';
import { setMotionPreference } from '@garbage-day/ui';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InputController } from '../../input/InputController';
import { MatchSession, type MatchView } from '../../state/MatchSession';
import { InputContext, MatchSessionContext } from '../../state/matchContexts';
import { usePrefs } from '../../state/prefs';
import { TouchControls } from './TouchControls';
import { TouchSurface } from './TouchSurface';

const initial = usePrefs.getState();
afterEach(() => {
  usePrefs.setState(initial, true);
  setMotionPreference('system');
  vi.unstubAllGlobals();
});

function view(o: Partial<MatchView> = {}, power: MatchView['players'][0]['power'] = null) {
  const base = new MatchSession({
    seed: 3,
    bot: { skill: 5, speed: 5 },
    input: new InputController(),
  }).getSnapshot();
  const [a, b] = base.players;
  return { ...base, phase: 'playing' as const, players: [{ ...a, power }, b] as const, ...o };
}

function Harness({
  input,
  v,
  children,
}: {
  input: InputController;
  v: MatchView;
  children: ReactNode;
}) {
  const store = { subscribe: () => () => undefined, getSnapshot: () => v };
  return (
    <MatchSessionContext.Provider store={store}>
      <InputContext value={input}>{children}</InputContext>
    </MatchSessionContext.Provider>
  );
}

/** The surface, 300 × 600 px: a cell is 30 px. */
function renderSurface(v: MatchView = view()) {
  const input = new InputController();
  const { container } = render(
    <Harness input={input} v={v}>
      <TouchSurface />
    </Harness>,
  );
  const el = container.querySelector<HTMLElement>('[data-touch-surface]');
  if (el)
    el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 300, height: 600 }) as DOMRect;
  let t = 1000;
  const fire = (type: string, x: number, y: number, dt = 16) => {
    t += dt;
    act(() => {
      el?.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: y,
          pointerId: 1,
          bubbles: true,
          timeStamp: t,
        } as PointerEventInit),
      );
    });
  };
  return { input, el, fire, container };
}

describe('TouchSurface', () => {
  it('turns gestures into the same input the keyboard gives', () => {
    const { input, fire } = renderSurface();
    // Tap on the right: rotate clockwise.
    fire('pointerdown', 200, 100);
    fire('pointerup', 202, 100);
    expect(input.tick()).toMatchObject({ cw: true });
    // Drag right two cells: two columns, one per tick.
    fire('pointerdown', 100, 100);
    for (const x of [115, 130, 145, 165]) fire('pointermove', x, 101);
    fire('pointerup', 165, 101);
    expect([input.tick().dx, input.tick().dx, input.tick().dx]).toEqual([1, 1, 0]);
    // Flick down: hard drop.
    fire('pointerdown', 150, 50);
    for (const y of [80, 110, 140]) fire('pointermove', 150, y);
    fire('pointerup', 150, 170);
    expect(input.tick().hard).toBe(true);
  });

  it('leaves a faint mark for each gesture, which clears when it has faded', () => {
    const { fire, container } = renderSurface();
    fire('pointerdown', 50, 100);
    fire('pointerup', 51, 100);
    const arc = container.querySelector('[data-feedback="tap"]');
    expect(arc?.textContent).toBe('↺');
    fire('pointerdown', 100, 100);
    fire('pointermove', 130, 100);
    expect(container.querySelector('[data-feedback="axis"]')?.textContent).toBe('→');
    if (arc) fireEvent.animationEnd(arc);
    expect(container.querySelector('[data-feedback="tap"]')).toBeNull();
  });

  it('leaves no marks under reduced motion, and is gone when gestures are off', () => {
    setMotionPreference('reduce');
    const { fire, container } = renderSurface();
    fire('pointerdown', 50, 100);
    fire('pointerup', 51, 100);
    expect(container.querySelector('[data-feedback]')).toBeNull();
    act(() => {
      usePrefs.getState().setGestures(false);
    });
    expect(container.querySelector('[data-touch-surface]')).toBeNull();
  });
});

describe('TouchControls', () => {
  const coarse = (matches: boolean) =>
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q === '(pointer: coarse)' ? matches : false,
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));

  it('shows the round power-up button on a touch screen, only while one is banked', () => {
    coarse(true);
    const input = new InputController();
    const { rerender } = render(
      <Harness input={input} v={view()}>
        <TouchControls />
      </Harness>,
    );
    expect(screen.queryByRole('button', { name: /Fire/ })).toBeNull();
    rerender(
      <Harness input={input} v={view({}, 'bomb')}>
        <TouchControls />
      </Harness>,
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Fire Bomb' }));
    expect(input.tick().power).toBe(true);
  });

  it('shows nothing with a mouse and no pad', () => {
    coarse(false);
    const { container } = render(
      <Harness input={new InputController()} v={view({}, 'bomb')}>
        <TouchControls />
      </Harness>,
    );
    expect(container.textContent).toBe('');
  });

  it('the pad acts while a key is held, as the keyboard does', () => {
    usePrefs.setState({ pad: true });
    const input = new InputController();
    render(
      <Harness input={input} v={view()}>
        <TouchControls />
      </Harness>,
    );
    expect(screen.getAllByRole('button')).toHaveLength(8);
    const left = screen.getByRole('button', { name: 'Move left' });
    fireEvent.pointerDown(left);
    expect(left.hasAttribute('data-held')).toBe(true);
    expect(input.tick().dx).toBe(-1);
    fireEvent.pointerUp(left);
    expect(left.hasAttribute('data-held')).toBe(false);
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Hard drop' }));
    expect(input.tick()).toMatchObject({ hard: true, dx: 0 });
  });
});
