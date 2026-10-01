import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MatchEffect, MatchSession, MatchView } from '../../state/MatchSession';
import { feedLine, MatchFeed } from './MatchFeed';
import { PHONE_LANDSCAPE, PORTRAIT, useMatchLayout } from './useMatchLayout';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A media query stand-in that matches only `matching`. */
const media = (matching: string | null) =>
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q === matching,
    media: q,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));

describe('useMatchLayout', () => {
  it('upright phone, phone on its side, everything else', () => {
    for (const [query, layout] of [
      [PORTRAIT, 'portrait'],
      [PHONE_LANDSCAPE, 'landscape'],
      [null, 'desktop'],
    ] as const) {
      media(query);
      expect(renderHook(() => useMatchLayout()).result.current).toBe(layout);
    }
  });
});

describe('the match feed', () => {
  it('words each moment from the player’s side', () => {
    const line = (e: MatchEffect) => feedLine(e, 'Bot · Pro');
    expect(line({ kind: 'attack', from: 1, to: 0, rows: 4, doubled: true })).toBe(
      'Bot · Pro sent 4, doubled',
    );
    expect(line({ kind: 'attack', from: 0, to: 1, rows: 2, doubled: false })).toBe('You sent 2');
    expect(line({ kind: 'cancel', p: 0, rows: 3 })).toBe('You cancelled 3');
    expect(line({ kind: 'blocked', p: 1, rows: 2 })).toBe("Bot · Pro's shield blocked 2");
    expect(line({ kind: 'powerUse', p: 0, power: 'rush' })).toBe('You fired Rush');
    expect(line({ kind: 'showdown', showdown: 'double', phase: 'soon' })).toBe(
      'Double garbage in 5 s',
    );
    expect(line({ kind: 'showdown', showdown: 'sudden', phase: 'start' })).toBe('Sudden death');
    expect(line({ kind: 'showdown', showdown: 'double', phase: 'end' })).toBe(
      'Double garbage is over',
    );
    expect(line({ kind: 'topout', p: 1 })).toBe('Bot · Pro topped out');
    expect(line({ kind: 'move' })).toBeNull();
    expect(line({ kind: 'lock', p: 0 })).toBeNull();
  });

  it('lists them newest first, with the match clock, and keeps the last 60', () => {
    const listeners = new Set<(e: MatchEffect) => void>();
    let clock = 42;
    const session = {
      onEffect: (l: (e: MatchEffect) => void) => {
        listeners.add(l);
        return () => listeners.delete(l);
      },
      getSnapshot: () => ({ clock }) as MatchView,
    } as unknown as MatchSession;
    render(<MatchFeed session={session} opponent="Bot · Pro" />);
    const play = (e: MatchEffect) =>
      act(() => {
        listeners.forEach((l) => l(e));
      });
    play({ kind: 'attack', from: 0, to: 1, rows: 2, doubled: false });
    clock = 61;
    play({ kind: 'showdown', showdown: 'double', phase: 'start' });
    play({ kind: 'move' });
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual([
      '1:01 Double garbage',
      '0:42 You sent 2',
    ]);
    for (let i = 0; i < 70; i++) play({ kind: 'cancel', p: 0, rows: 1 });
    expect(screen.getAllByRole('listitem')).toHaveLength(60);
  });
});
