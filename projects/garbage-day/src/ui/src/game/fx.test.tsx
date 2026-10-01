import { act, render, renderHook, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setMotionPreference } from '../hooks/useReducedMotion';
import { useShake } from '../hooks/useShake';
import { PIECE_COLOR } from '../tokens/tokens';
import { burst, Confetti } from './Confetti';
import { Popup } from './Overlays';

afterEach(() => {
  setMotionPreference('system');
});

describe('confetti', () => {
  it('bursts from the origin in the piece colours', () => {
    const bits = burst({ x: 100, y: 200 }, 14, () => 0.5);
    expect(bits).toHaveLength(14);
    expect(bits.every((b) => b.x === 100 && b.y === 160)).toBe(true);
    expect(new Set(bits.map((b) => b.color))).toEqual(new Set(Object.values(PIECE_COLOR)));
  });

  it('throws none under reduced motion, and says it is done', () => {
    setMotionPreference('reduce');
    const onDone = vi.fn();
    const { container } = render(<Confetti origin={{ x: 0, y: 0 }} onDone={onDone} />);
    expect(container.querySelector('canvas')).toBeNull();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('is done at once when there is nowhere to start from', () => {
    const onDone = vi.fn();
    render(<Confetti origin={() => null} onDone={onDone} />);
    expect(onDone).toHaveBeenCalledOnce();
  });
});

describe('Popup', () => {
  it('announces a label unless it is quiet', () => {
    render(<Popup text="Quad" tone="strong" onDone={() => undefined} />);
    render(<Popup text="Single" small quiet onDone={() => undefined} />);
    expect(screen.getByRole('status').textContent).toBe('Quad');
    expect(screen.getByText('Single').getAttribute('aria-hidden')).toBe('true');
  });

  it('is done after 1.3 s, or 1 s under reduced motion', () => {
    vi.useFakeTimers();
    try {
      const onDone = vi.fn();
      render(<Popup text="Quad" onDone={onDone} />);
      act(() => {
        vi.advanceTimersByTime(1299);
      });
      expect(onDone).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(onDone).toHaveBeenCalledOnce();
      setMotionPreference('reduce');
      const quick = vi.fn();
      render(<Popup text="Double" onDone={quick} />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(quick).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useShake', () => {
  it('shakes an element, but not under reduced motion', () => {
    const el = document.createElement('div');
    const animate = vi.fn();
    el.animate = animate;
    const { result, rerender } = renderHook(() => useShake());
    result.current(el);
    expect(animate).toHaveBeenCalledOnce();
    act(() => {
      setMotionPreference('reduce');
    });
    rerender();
    result.current(el);
    result.current(null);
    expect(animate).toHaveBeenCalledOnce();
  });
});
