import { act, renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAnimationFrame } from './useAnimationFrame';
import { useColorScheme } from './useColorScheme';
import { useHaptics } from './useHaptics';
import { useInterval } from './useInterval';
import { usePageVisibility } from './usePageVisibility';
import { useReducedMotion } from './useReducedMotion';
import { useResizeObserver } from './useResizeObserver';
import { useWakeLock } from './useWakeLock';

type Listener = () => void;

/** A controllable matchMedia: `set(query, matches)` flips a query and notifies its listeners. */
function mockMatchMedia() {
  const state = new Map<string, boolean>();
  const listeners = new Map<string, Set<Listener>>();
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        get matches() {
          return state.get(query) ?? false;
        },
        media: query,
        addEventListener: (_: string, l: Listener) => {
          const set = listeners.get(query) ?? new Set<Listener>();
          set.add(l);
          listeners.set(query, set);
        },
        removeEventListener: (_: string, l: Listener) => listeners.get(query)?.delete(l),
      }) as unknown as MediaQueryList,
  );
  return (query: string, matches: boolean) => {
    state.set(query, matches);
    listeners.get(query)?.forEach((l) => l());
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  delete document.documentElement.dataset.theme;
});

describe('useReducedMotion', () => {
  it('follows the system unless the player overrides it', () => {
    const set = mockMatchMedia();
    const { result, rerender } = renderHook(({ p }) => useReducedMotion(p), {
      initialProps: { p: 'system' as 'system' | 'reduce' | 'full' },
    });
    expect(result.current).toBe(false);
    act(() => set('(prefers-reduced-motion: reduce)', true));
    expect(result.current).toBe(true);
    rerender({ p: 'full' });
    expect(result.current).toBe(false);
    rerender({ p: 'reduce' });
    expect(result.current).toBe(true);
  });
});

describe('useColorScheme', () => {
  it('prefers the root data-theme, then the system scheme', async () => {
    const set = mockMatchMedia();
    const { result } = renderHook(() => useColorScheme());
    expect(result.current).toBe('light');
    act(() => set('(prefers-color-scheme: dark)', true));
    expect(result.current).toBe('dark');
    await act(async () => {
      document.documentElement.dataset.theme = 'light';
      await Promise.resolve();
    });
    expect(result.current).toBe('light');
  });
});

describe('usePageVisibility', () => {
  it('follows visibilitychange', () => {
    let state: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => state);
    const { result } = renderHook(() => usePageVisibility());
    expect(result.current).toBe(true);
    act(() => {
      state = 'hidden';
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current).toBe(false);
  });
});

describe('useWakeLock', () => {
  it('takes the lock while active and releases it after', async () => {
    const release = vi.fn(() => Promise.resolve());
    const request = vi.fn(() => Promise.resolve({ released: false, release }));
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
    const { rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } });
    await act(() => Promise.resolve());
    expect(request).toHaveBeenCalledWith('screen');
    rerender({ on: false });
    expect(release).toHaveBeenCalledOnce();
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it('does nothing where the API is missing', () => {
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });
});

describe('useHaptics', () => {
  it('vibrates only when enabled and supported', () => {
    const vibrate = vi.fn(() => true);
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    renderHook(() => useHaptics(true)).result.current(20);
    renderHook(() => useHaptics(false)).result.current(30);
    expect(vibrate).toHaveBeenCalledExactlyOnceWith(20);
    Reflect.deleteProperty(navigator, 'vibrate');
  });
});

describe('useInterval and useAnimationFrame', () => {
  it('useInterval ticks with the latest callback and pauses on null', () => {
    vi.useFakeTimers();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook<void, { cb: () => void; ms: number | null }>(
      ({ cb, ms }) => useInterval(cb, ms),
      { initialProps: { cb: first, ms: 100 } },
    );
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ cb: second, ms: 100 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ cb: second, ms: null });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledOnce();
  });

  it('useAnimationFrame calls back each frame until inactive', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => frames.push(cb));
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const onFrame = vi.fn();
    const { rerender } = renderHook(({ on }) => useAnimationFrame(onFrame, on), {
      initialProps: { on: true },
    });
    act(() => frames.shift()?.(16));
    act(() => frames.shift()?.(32));
    expect(onFrame.mock.calls).toEqual([[16], [32]]);
    rerender({ on: false });
    expect(cancel).toHaveBeenCalled();
  });
});

describe('useResizeObserver', () => {
  it('reports the observed size', () => {
    let notify: ResizeObserverCallback = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: ResizeObserverCallback) {
          notify = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    const el = document.createElement('div');
    const { result } = renderHook(() => {
      const ref = useRef<Element>(el);
      return useResizeObserver(ref);
    });
    act(() =>
      notify(
        [{ contentRect: { width: 300, height: 600 } } as ResizeObserverEntry],
        {} as ResizeObserver,
      ),
    );
    expect(result.current).toEqual({ width: 300, height: 600 });
    vi.unstubAllGlobals();
  });
});
