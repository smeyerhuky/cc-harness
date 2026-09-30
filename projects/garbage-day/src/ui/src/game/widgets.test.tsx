import { emptyBoard, pieceCell, setCell } from '@garbage-day/engine';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordingContext } from '../../test/recording-context';
import { PIECE_COLOR } from '../tokens/tokens';
import { BoardCanvas } from './BoardCanvas';
import { Meter } from './Meter';
import { AttackFlight, BoardCover, Countdown, Popup, ShowdownBanner } from './Overlays';
import { PieceGlyph } from './PieceGlyph';
import { PowerIcon } from './PowerIcon';
import { PresenceChip, presenceState } from './PresenceChip';
import { HoldSlot, NextQueue, PowerSlot } from './Slots';
import { SpeedChip } from './SpeedChip';

/** Forces the reduced-motion media query on or off. */
function reducedMotion(on: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: on && query.includes('reduce'),
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('PieceGlyph', () => {
  it('draws the piece’s four cells in its colour, dimmed when asked', () => {
    const { container } = render(<PieceGlyph type="T" cell={10} dim />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('data-piece')).toBe('T');
    expect(svg?.getAttribute('opacity')).toBe('0.35');
    const cells = container.querySelectorAll(`rect[fill="${PIECE_COLOR.T}"]`);
    expect(cells).toHaveLength(4);
  });

  it('draws a gem on the cell with its index', () => {
    const { container } = render(<PieceGlyph type="I" gem={{ i: 1, type: 'rush' }} />);
    expect(container.querySelectorAll(`rect[fill="${PIECE_COLOR.I}"]`)).toHaveLength(3);
  });
});

describe('PowerIcon', () => {
  it('is named for screen readers unless decorative', () => {
    render(<PowerIcon kind="shield" />);
    expect(screen.getByRole('img', { name: 'Shield' })).toBeDefined();
    const { container } = render(<PowerIcon kind="bomb" decorative />);
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('slots', () => {
  it('HoldSlot names the held piece and whether hold is spent', () => {
    render(<HoldSlot piece="L" used />);
    expect(screen.getByRole('group', { name: 'Hold: L, used this turn' })).toBeDefined();
    render(<HoldSlot piece={null} />);
    expect(screen.getByRole('group', { name: 'Hold: empty' })).toBeDefined();
  });

  it('NextQueue shows up to five pieces, or hides the opponent’s', () => {
    const pieces = (['I', 'O', 'T', 'S', 'Z', 'J'] as const).map((t) => ({ t, gem: null }));
    const { container } = render(<NextQueue pieces={pieces} />);
    expect(screen.getByRole('group', { name: 'Next pieces: I, O, T, S, Z' })).toBeDefined();
    expect(container.querySelectorAll('svg[data-piece]')).toHaveLength(5);
    render(<NextQueue pieces="hidden" />);
    expect(screen.getByRole('group', { name: 'Next pieces: hidden' }).textContent).toContain(
      'hidden',
    );
  });

  it('PowerSlot names the power-up and how to fire it', () => {
    render(<PowerSlot kind="fog" hint="E" />);
    expect(screen.getByRole('group', { name: 'Power-up: Fog, E to fire' })).toBeDefined();
  });
});

describe('Meter', () => {
  it('reports rows waiting and ready, capped at its height', () => {
    render(<Meter total={25} ready={3} shielded />);
    const meter = screen.getByRole('meter', { name: 'Incoming garbage, shielded' });
    expect(meter.getAttribute('aria-valuenow')).toBe('20');
    expect(meter.getAttribute('aria-valuetext')).toBe('25 rows, 3 ready');
  });

  it('shows no count when nothing waits', () => {
    render(<Meter total={0} ready={0} />);
    expect(screen.getByRole('meter').textContent).toBe('');
  });
});

describe('SpeedChip', () => {
  it('shows the level and names the progress', () => {
    render(<SpeedChip level={7} progress={0.4} hot />);
    const chip = screen.getByRole('group', { name: 'Speed 7, 40% to the next level, boosted' });
    expect(chip.textContent).toContain('SPEED 7');
  });
});

describe('PresenceChip', () => {
  it('maps the referee’s presence and the connection to one word', () => {
    expect(presenceState('present')).toBe('online');
    expect(presenceState('away')).toBe('away');
    expect(presenceState('grace')).toBe('away');
    expect(presenceState('present', true)).toBe('reconnecting');
    expect(presenceState('forfeit', true)).toBe('gone');
    render(<PresenceChip state="reconnecting" />);
    expect(screen.getByText('reconnecting')).toBeDefined();
  });
});

describe('overlays', () => {
  it('Countdown shows the number, then GO', () => {
    const { rerender } = render(<Countdown value={3} />);
    expect(screen.getByRole('timer').textContent).toBe('3');
    rerender(<Countdown value={0} />);
    expect(screen.getByRole('timer').textContent).toBe('GO');
  });

  it('ShowdownBanner announces ahead, then names the showdown', () => {
    const { rerender } = render(<ShowdownBanner kind="double" startsIn={5} />);
    expect(screen.getByRole('status').textContent).toBe('Double garbage in 5');
    rerender(<ShowdownBanner kind="sudden" />);
    expect(screen.getByRole('status').textContent).toBe('Sudden death');
  });

  it('Popup finishes after 1.3 s, or 1 s with reduced motion', () => {
    vi.useFakeTimers();
    reducedMotion(false);
    const done = vi.fn();
    render(<Popup text="QUAD" onDone={done} />);
    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(done).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(done).toHaveBeenCalledOnce();

    reducedMotion(true);
    const reduced = vi.fn();
    render(<Popup text="T-SPIN DOUBLE" onDone={reduced} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(reduced).toHaveBeenCalledOnce();
  });

  it('AttackFlight finishes at once under reduced motion', () => {
    reducedMotion(true);
    const done = vi.fn();
    render(<AttackFlight from={{ x: 0, y: 0 }} to={{ x: 100, y: 0 }} onDone={done} />);
    expect(done).toHaveBeenCalledOnce();
  });

  it('AttackFlight animates for 700 ms and finishes when the animation does', () => {
    reducedMotion(false);
    const animation = { onfinish: null as (() => void) | null, cancel: vi.fn() };
    const animate = vi.fn(() => animation);
    Object.defineProperty(HTMLElement.prototype, 'animate', { value: animate, configurable: true });
    const done = vi.fn();
    render(<AttackFlight from={{ x: 0, y: 50 }} to={{ x: 200, y: 50 }} onDone={done} />);
    expect(animate).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ duration: 700 }),
    );
    expect(done).not.toHaveBeenCalled();
    animation.onfinish?.();
    expect(done).toHaveBeenCalledOnce();
    Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  });

  it('BoardCover says why the board is hidden and for how long', () => {
    render(<BoardCover reason="RIVAL left the game tab" timeLeft="1:43" />);
    expect(screen.getByRole('status').textContent).toBe(
      'Hidden while pausedRIVAL left the game tab · 1:43',
    );
  });
});

describe('BoardCanvas', () => {
  const frames: FrameRequestCallback[] = [];
  beforeEach(() => {
    frames.length = 0;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  });

  it('sizes the canvas in whole cells and draws the source every frame', () => {
    const { ctx, calls } = recordingContext();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    const board = emptyBoard();
    setCell(board, 4, 0, pieceCell('Z'));
    const source = vi.fn(() => ({ board }));
    render(<BoardCanvas source={source} label="Your board" cell={12} reducedMotion />);
    const canvas = screen.getByRole<HTMLCanvasElement>('img', { name: 'Your board' });
    expect(canvas.style.width).toBe('120px');
    expect(canvas.style.height).toBe('240px');
    act(() => frames.shift()?.(16));
    expect(source).toHaveBeenCalledOnce();
    expect(calls.some((c) => c.name === 'fillRect' && c.fill === PIECE_COLOR.Z)).toBe(true);
  });

  it('draws nothing where the canvas has no 2D context', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const source = vi.fn(() => null);
    render(<BoardCanvas source={source} label="Rival's board" cell={8} />);
    act(() => frames.shift()?.(16));
    expect(source).not.toHaveBeenCalled();
  });
});
