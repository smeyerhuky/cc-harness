import { useEffect, useEffectEvent } from 'react';
import { create } from 'zustand';
import { keyMap } from '../input/bindings';
import type { Session } from './MatchSession';
import { usePrefs } from './prefs';

// The developer overlay's switch (GD-TICKET-024). It is off by default. `?dev` in the address or
// the ` key (the one left of 1) turns it on; `?dev=0` or the key again turns it off. The choice
// lasts for this tab's session only. The overlay itself loads only once it is switched on, so
// the switch is all a player's first page carries.

/** The key that opens and closes the overlay, by `KeyboardEvent.code`. */
const DEV_KEY = 'Backquote';
export const DEV_STORAGE_KEY = 'garbage-day:dev';

/** What the address says: on, off, or nothing (`null`). */
export function devFromUrl(search: string): boolean | null {
  const v = new URLSearchParams(search).get('dev');
  if (v === null) return null;
  return !['0', 'false', 'off'].includes(v);
}

/** This tab's session storage, or null where it is blocked. */
function tabStorage(): Storage | null {
  try {
    return globalThis.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function recall(): string | null {
  try {
    return tabStorage()?.getItem(DEV_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function remember(open: boolean): void {
  try {
    tabStorage()?.setItem(DEV_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // Storage blocked: the switch lasts until the page closes.
  }
}

/** Whether the overlay starts open: the address wins, then this session's last choice. */
export function initialDev(search: string, stored: string | null): boolean {
  return devFromUrl(search) ?? stored === '1';
}

interface DevState {
  readonly open: boolean;
  /** The match on screen, for the overlay to read. */
  readonly session: Session | null;
  readonly setOpen: (open: boolean) => void;
  readonly toggle: () => void;
  /** A match screen shows `s`; returns the function that says it has gone. */
  readonly attach: (s: Session) => () => void;
}

export const useDev = create<DevState>()((set, get) => {
  const search = globalThis.location?.search ?? '';
  const open = initialDev(search, recall());
  if (devFromUrl(search) !== null) remember(open);
  return {
    open,
    session: null,
    setOpen: (o) => {
      remember(o);
      set({ open: o });
    },
    toggle: () => get().setOpen(!get().open),
    attach: (s) => {
      set({ session: s });
      return () => {
        if (get().session === s) set({ session: null });
      };
    },
  };
});

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));

/**
 * The ` key opens and closes the overlay anywhere in the app, except while typing in a field or
 * when the player has bound that key to a game action.
 */
export function useDevKey(): void {
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.code !== DEV_KEY || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e.target) || keyMap(usePrefs.getState().bindings).has(DEV_KEY)) return;
    e.preventDefault();
    useDev.getState().toggle();
  });
  useEffect(() => {
    const down = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);
}
