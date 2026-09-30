import { isHandle } from '@garbage-day/protocol/handle';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { randomHandle } from './handles';

// The player's preferences (client architecture, "Where state lives"): a small, flat Zustand
// store, persisted in this browser only (PRD US-04). The control stories add their own fields:
// key bindings and repeat timings (GD-STORY-003), gestures and the pad (GD-STORY-004), the last
// bot (GD-STORY-006).

/** Follow the system's reduced-motion setting, or reduce motion whatever the system says. */
export type MotionSetting = 'system' | 'reduce';

export interface Prefs {
  readonly handle: string;
  /** Sound is off until the player turns it on (US-20). */
  readonly sound: boolean;
  readonly motion: MotionSetting;
}

interface PrefsActions {
  readonly newHandle: () => void;
  readonly setSound: (on: boolean) => void;
  readonly setMotion: (motion: MotionSetting) => void;
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

/** Keeps only stored values that are still valid; anything else takes the default. */
function clean(stored: unknown, current: Prefs): Prefs {
  const s = (typeof stored === 'object' && stored !== null ? stored : {}) as Partial<Prefs>;
  return {
    handle: isHandle(s.handle) ? s.handle : current.handle,
    sound: typeof s.sound === 'boolean' ? s.sound : current.sound,
    motion: s.motion === 'reduce' || s.motion === 'system' ? s.motion : current.motion,
  };
}

export const usePrefs = create<Prefs & PrefsActions>()(
  persist(
    (set) => ({
      handle: randomHandle(),
      sound: false,
      motion: 'system',
      newHandle: () => set({ handle: randomHandle() }),
      setSound: (sound) => set({ sound }),
      setMotion: (motion) => set({ motion }),
    }),
    {
      name: PREFS_KEY,
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s): Prefs => ({ handle: s.handle, sound: s.sound, motion: s.motion }),
      merge: (stored, current) => ({ ...current, ...clean(stored, current) }),
    },
  ),
);
