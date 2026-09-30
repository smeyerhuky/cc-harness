import { handle } from '@garbage-day/protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PREFS_KEY, safeStorage, usePrefs } from './prefs';

const initial = usePrefs.getState();

afterEach(() => {
  vi.unstubAllGlobals();
  usePrefs.setState(initial, true);
  localStorage.clear();
});

const stored = () => JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null') as unknown;

describe('usePrefs', () => {
  it('starts with a valid handle, sound off, and motion following the device', () => {
    const s = usePrefs.getState();
    expect(handle.safeParse(s.handle).success).toBe(true);
    expect(s).toMatchObject({ sound: false, motion: 'system' });
  });

  it('saves every change to this browser, and only the preferences', () => {
    usePrefs.getState().setSound(true);
    usePrefs.getState().setMotion('reduce');
    const before = usePrefs.getState().handle;
    usePrefs.getState().newHandle();
    const after = usePrefs.getState().handle;
    expect(handle.safeParse(after).success).toBe(true);
    expect(stored()).toEqual({
      state: { handle: after, sound: true, motion: 'reduce' },
      version: 1,
    });
    // A fresh name is not guaranteed to differ, but 50 in a row matching the first would be a bug.
    let changed = after !== before;
    for (let i = 0; !changed && i < 50; i++) {
      usePrefs.getState().newHandle();
      changed = usePrefs.getState().handle !== before;
    }
    expect(changed).toBe(true);
  });

  it('reads saved preferences back', async () => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        state: { handle: 'Quiet Wren 7', sound: true, motion: 'reduce' },
        version: 1,
      }),
    );
    await usePrefs.persist.rehydrate();
    expect(usePrefs.getState()).toMatchObject({
      handle: 'Quiet Wren 7',
      sound: true,
      motion: 'reduce',
    });
  });

  it('drops saved values that are no longer valid, keeping the rest', async () => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        state: { handle: '<script>', sound: 'yes', motion: 'reduce', extra: 1 },
        version: 1,
      }),
    );
    await usePrefs.persist.rehydrate();
    const s = usePrefs.getState();
    expect(s).toMatchObject({ handle: initial.handle, sound: false, motion: 'reduce' });
    expect(s).not.toHaveProperty('extra');
  });

  it('ignores a saved value that is not an object', async () => {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ state: 'broken', version: 1 }));
    await usePrefs.persist.rehydrate();
    expect(usePrefs.getState()).toMatchObject({
      handle: initial.handle,
      sound: false,
      motion: 'system',
    });
  });
});

describe('safeStorage', () => {
  it('keeps working in memory when the browser refuses storage', () => {
    const refuse = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.stubGlobal('localStorage', { getItem: refuse, setItem: refuse, removeItem: refuse });
    expect(safeStorage.getItem('k')).toBeNull();
    void safeStorage.setItem('k', 'v');
    expect(safeStorage.getItem('k')).toBe('v');
    void safeStorage.removeItem('k');
    expect(safeStorage.getItem('k')).toBeNull();
  });
});
