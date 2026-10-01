import { handle } from '@garbage-day/protocol';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BINDINGS } from '../input/bindings';
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
    expect(s).toMatchObject({
      sound: false,
      motion: 'system',
      bindings: DEFAULT_BINDINGS,
      dasMs: 167,
      arrMs: 33,
    });
  });

  it('keeps the player’s keys and timings, in whole ticks, and resets them to the defaults', () => {
    const custom = { ...DEFAULT_BINDINGS, hard: ['KeyJ'] };
    usePrefs.getState().setBindings(custom);
    usePrefs.getState().setDas(100);
    usePrefs.getState().setArr(49);
    expect(usePrefs.getState()).toMatchObject({ bindings: custom, dasMs: 100, arrMs: 50 });
    expect(stored()).toMatchObject({ state: { bindings: custom, dasMs: 100, arrMs: 50 } });
    usePrefs.getState().resetControls();
    expect(usePrefs.getState()).toMatchObject({
      bindings: DEFAULT_BINDINGS,
      dasMs: 167,
      arrMs: 33,
    });
  });

  it('saves every change to this browser, and only the preferences', () => {
    usePrefs.getState().setSound(true);
    usePrefs.getState().setMotion('reduce');
    const before = usePrefs.getState().handle;
    usePrefs.getState().newHandle();
    const after = usePrefs.getState().handle;
    expect(handle.safeParse(after).success).toBe(true);
    expect(stored()).toEqual({
      state: {
        handle: after,
        sound: true,
        motion: 'reduce',
        bindings: DEFAULT_BINDINGS,
        dasMs: 167,
        arrMs: 33,
        gestures: true,
        sensitivity: 1,
        pad: false,
        bot: { skill: 5, speed: 5 },
      },
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

  it('reads saved controls back, and drops broken ones', async () => {
    const custom = { ...DEFAULT_BINDINGS, hard: ['KeyJ'] };
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ state: { bindings: custom, dasMs: 100, arrMs: 17 }, version: 1 }),
    );
    await usePrefs.persist.rehydrate();
    expect(usePrefs.getState()).toMatchObject({ bindings: custom, dasMs: 100, arrMs: 17 });
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        state: { bindings: { ...DEFAULT_BINDINGS, hard: ['KeyZ'] }, dasMs: 5000, arrMs: 'fast' },
        version: 1,
      }),
    );
    usePrefs.setState(initial, true);
    await usePrefs.persist.rehydrate();
    expect(usePrefs.getState()).toMatchObject({
      bindings: DEFAULT_BINDINGS,
      dasMs: 167,
      arrMs: 33,
    });
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

describe('touch preferences', () => {
  it('start with gestures on, sensitivity 100%, and no pad', () => {
    expect(usePrefs.getState()).toMatchObject({ gestures: true, sensitivity: 1, pad: false });
  });

  it('turning gestures off turns the pad on; turning them back on leaves the pad', () => {
    usePrefs.getState().setGestures(false);
    expect(usePrefs.getState()).toMatchObject({ gestures: false, pad: true });
    usePrefs.getState().setGestures(true);
    expect(usePrefs.getState()).toMatchObject({ gestures: true, pad: true });
    usePrefs.getState().setPad(false);
    expect(usePrefs.getState().pad).toBe(false);
  });

  it('keeps sensitivity on its steps from 50% to 200%', () => {
    usePrefs.getState().setSensitivity(1.75);
    usePrefs.getState().setSensitivity(3);
    usePrefs.getState().setSensitivity(1.1);
    expect(usePrefs.getState().sensitivity).toBe(1.75);
  });

  it('reads them back, and drops broken ones', async () => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ state: { gestures: false, sensitivity: 0.5, pad: 'yes' }, version: 1 }),
    );
    await usePrefs.persist.rehydrate();
    expect(usePrefs.getState()).toMatchObject({ gestures: false, sensitivity: 0.5, pad: false });
  });
});

describe('the last bot', () => {
  it('starts at skill 5, speed 5, keeps what was played, and refuses what is out of range', () => {
    expect(usePrefs.getState().bot).toEqual({ skill: 5, speed: 5 });
    usePrefs.getState().setBot({ skill: 8, speed: 3 });
    usePrefs.getState().setBot({ skill: 11, speed: 3 });
    usePrefs.getState().setBot({ skill: 2.5, speed: 3 });
    expect(usePrefs.getState().bot).toEqual({ skill: 8, speed: 3 });
    expect(stored()).toMatchObject({ state: { bot: { skill: 8, speed: 3 } } });
  });

  it('is read back after a reload, unless it is broken', async () => {
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ state: { bot: { skill: 9, speed: 1 } }, version: 1 }),
    );
    await usePrefs.persist.rehydrate();
    expect(usePrefs.getState().bot).toEqual({ skill: 9, speed: 1 });
    localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ state: { bot: { skill: 0, speed: 1 } }, version: 1 }),
    );
    usePrefs.setState(initial, true);
    await usePrefs.persist.rehydrate();
    expect(usePrefs.getState().bot).toEqual({ skill: 5, speed: 5 });
  });
});
