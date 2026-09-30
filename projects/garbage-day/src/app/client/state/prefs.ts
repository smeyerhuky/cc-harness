import { isHandle } from '@garbage-day/protocol/handle';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { DEFAULT_BINDINGS, parseBindings, type Bindings } from '../input/bindings';
import { DEFAULT_TIMING, TIMING_TICKS, toMs, toTicks } from '../input/InputController';
import { randomHandle } from './handles';

// The player's preferences (client architecture, "Where state lives"): a small, flat Zustand
// store, persisted in this browser only (PRD US-04). The control stories add their own fields:
// key bindings and repeat timings here (GD-STORY-003); gestures and the pad (GD-STORY-004), and
// the last bot (GD-STORY-006), to come.

/** Follow the system's reduced-motion setting, or reduce motion whatever the system says. */
export type MotionSetting = 'system' | 'reduce';

export interface Prefs {
  readonly handle: string;
  /** Sound is off until the player turns it on (US-20). */
  readonly sound: boolean;
  readonly motion: MotionSetting;
  /** Each action's keys (US-16). */
  readonly bindings: Bindings;
  /** Auto-repeat delay and rate in milliseconds, always a whole number of ticks (US-16). */
  readonly dasMs: number;
  readonly arrMs: number;
}

interface PrefsActions {
  readonly newHandle: () => void;
  readonly setSound: (on: boolean) => void;
  readonly setMotion: (motion: MotionSetting) => void;
  readonly setBindings: (bindings: Bindings) => void;
  readonly setDas: (ms: number) => void;
  readonly setArr: (ms: number) => void;
  /** Puts the keys and the repeat timings back to the controls page's defaults. */
  readonly resetControls: () => void;
}

export const PREFS_KEY = 'garbage-day:prefs';

/**
 * localStorage, or memory where it is blocked (private windows, storage turned off): the game
 * works either way, and just forgets the settings on reload.
 */
const memory = new Map<string, string>();
export const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return memory.get(k) ?? null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      memory.set(k, v);
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      memory.delete(k);
    }
  },
};

/** A timing in range, rounded to whole ticks; anything else is the fallback. */
function timing(ms: unknown, range: { min: number; max: number }, fallback: number): number {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return fallback;
  const t = toTicks(ms);
  return t >= range.min && t <= range.max ? toMs(t) : fallback;
}

/** Keeps only stored values that are still valid; anything else takes the default. */
function clean(stored: unknown, current: Prefs): Prefs {
  const s = (typeof stored === 'object' && stored !== null ? stored : {}) as Record<
    keyof Prefs,
    unknown
  >;
  return {
    handle: isHandle(s.handle) ? s.handle : current.handle,
    sound: typeof s.sound === 'boolean' ? s.sound : current.sound,
    motion: s.motion === 'reduce' || s.motion === 'system' ? s.motion : current.motion,
    bindings: parseBindings(s.bindings) ?? current.bindings,
    dasMs: timing(s.dasMs, TIMING_TICKS.das, current.dasMs),
    arrMs: timing(s.arrMs, TIMING_TICKS.arr, current.arrMs),
  };
}

const DEFAULT_CONTROLS = {
  bindings: DEFAULT_BINDINGS,
  dasMs: DEFAULT_TIMING.dasMs,
  arrMs: DEFAULT_TIMING.arrMs,
} as const;

export const usePrefs = create<Prefs & PrefsActions>()(
  persist(
    (set) => ({
      handle: randomHandle(),
      sound: false,
      motion: 'system',
      ...DEFAULT_CONTROLS,
      newHandle: () => set({ handle: randomHandle() }),
      setSound: (sound) => set({ sound }),
      setMotion: (motion) => set({ motion }),
      setBindings: (bindings) => set({ bindings }),
      setDas: (ms) => set({ dasMs: timing(ms, TIMING_TICKS.das, DEFAULT_TIMING.dasMs) }),
      setArr: (ms) => set({ arrMs: timing(ms, TIMING_TICKS.arr, DEFAULT_TIMING.arrMs) }),
      resetControls: () => set(DEFAULT_CONTROLS),
    }),
    {
      name: PREFS_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): Prefs => ({
        handle: s.handle,
        sound: s.sound,
        motion: s.motion,
        bindings: s.bindings,
        dasMs: s.dasMs,
        arrMs: s.arrMs,
      }),
      merge: (stored, current) => ({ ...current, ...clean(stored, current) }),
    },
  ),
);
