import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { MatchEffect, Session } from '../../state/MatchSession';
import { BoardFx, labelFor } from './BoardFx';

const RULES = { powerSec: 6, rushLevels: 4, bombRows: 3 };
const SINGLE = { text: 'Single', strong: false } as const;
const QUAD = { text: 'Quad', strong: true } as const;

describe('labelFor', () => {
  it('names clears on their own board, smaller on the rival’s', () => {
    expect(labelFor({ kind: 'clear', p: 0, lines: 4, label: QUAD }, 0, RULES)).toEqual({
      text: 'Quad',
      tone: 'strong',
      small: false,
    });
    expect(labelFor({ kind: 'clear', p: 1, lines: 1, label: SINGLE }, 1, RULES)).toEqual({
      text: 'Single',
      tone: 'plain',
      small: true,
    });
    expect(labelFor({ kind: 'clear', p: 1, lines: 1, label: SINGLE }, 0, RULES)).toBeNull();
  });

  it('notes cancels, gems, shields and top-outs', () => {
    const on0 = (e: MatchEffect) => labelFor(e, 0, RULES)?.text;
    expect(on0({ kind: 'cancel', p: 0, rows: 2 })).toBe('−2 cancelled');
    expect(on0({ kind: 'gem', p: 0, power: 'fog' })).toBe('+ Fog');
    expect(on0({ kind: 'blocked', p: 0, rows: 4 })).toBe('Blocked by shield');
    expect(on0({ kind: 'topout', p: 0 })).toBe('Topped out');
  });

  it('says what a power-up did, on the board it did it to', () => {
    const on = (seat: 0 | 1, power: 'fog' | 'rush' | 'bomb' | 'shield', by: 0 | 1) =>
      labelFor({ kind: 'powerApply', p: seat, power, by }, seat, RULES)?.text ?? null;
    expect(on(0, 'fog', 1)).toBe('Fogged for 6 s');
    expect(on(0, 'rush', 1)).toBe('Rush: speed +4');
    expect(on(0, 'bomb', 0)).toBe('Bottom 3 rows gone');
    expect(on(0, 'shield', 0)).toBe('Shield up');
    // The one who fired Fog or Rush sees nothing on their own board.
    expect(on(1, 'fog', 1)).toBeNull();
  });

  it('ignores what has no words: moves, locks, attacks', () => {
    expect(labelFor({ kind: 'move' }, 0, RULES)).toBeNull();
    expect(labelFor({ kind: 'lock', p: 0 }, 0, RULES)).toBeNull();
    expect(
      labelFor({ kind: 'attack', from: 0, to: 1, rows: 2, doubled: false }, 1, RULES),
    ).toBeNull();
  });
});

/** A session stand-in that plays the effects a test sends. */
function fakeSession() {
  const listeners = new Set<(e: MatchEffect) => void>();
  const session = {
    rules: RULES,
    onEffect: (l: (e: MatchEffect) => void) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  } as unknown as Session;
  const play = (e: MatchEffect) =>
    act(() => {
      listeners.forEach((l) => l(e));
    });
  return { session, play };
}

describe('BoardFx', () => {
  it('shows the player’s labels to screen readers, and keeps at most four', () => {
    const { session, play } = fakeSession();
    const board = { current: document.createElement('div') };
    render(<BoardFx session={session} seat={0} board={board} />);
    play({ kind: 'clear', p: 0, lines: 4, label: QUAD });
    expect(screen.getByRole('status').textContent).toBe('Quad');
    for (let i = 0; i < 5; i++) play({ kind: 'cancel', p: 0, rows: i + 1 });
    expect(screen.getAllByRole('status').map((el) => el.textContent)).toEqual([
      '−2 cancelled',
      '−3 cancelled',
      '−4 cancelled',
      '−5 cancelled',
    ]);
  });

  it('keeps the rival’s labels quiet', () => {
    const { session, play } = fakeSession();
    render(<BoardFx session={session} seat={1} board={{ current: null }} />);
    play({ kind: 'clear', p: 1, lines: 1, label: SINGLE });
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('Single').getAttribute('aria-hidden')).toBe('true');
  });

  it('shakes the board when garbage lands on it or its own Bomb goes off', () => {
    const { session, play } = fakeSession();
    const el = document.createElement('div');
    const animate = vi.fn();
    el.animate = animate;
    render(<BoardFx session={session} seat={0} board={{ current: el }} />);
    play({ kind: 'land', p: 1, rows: 2 });
    expect(animate).not.toHaveBeenCalled();
    play({ kind: 'land', p: 0, rows: 2 });
    play({ kind: 'powerApply', p: 0, power: 'bomb', by: 0 });
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it('labels go away once they have shown', () => {
    vi.useFakeTimers();
    try {
      const { session, play } = fakeSession();
      render(<BoardFx session={session} seat={0} board={{ current: null }} />);
      play({ kind: 'topout', p: 0 });
      expect(screen.getByText('Topped out')).toBeDefined();
      act(() => {
        vi.advanceTimersByTime(1400);
      });
      expect(screen.queryByText('Topped out')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});
