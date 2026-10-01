import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS } from '../input/bindings';
import { InputController } from '../input/InputController';
import { DEV_STORAGE_KEY, devFromUrl, initialDev, useDev, useDevKey } from './dev';
import { MatchSession } from './MatchSession';
import { usePrefs } from './prefs';

afterEach(() => {
  useDev.setState({ open: false, session: null });
  usePrefs.getState().setBindings(DEFAULT_BINDINGS);
  sessionStorage.clear();
});

const press = (code: string, target: EventTarget = window, init: KeyboardEventInit = {}) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, ...init }));
  });

describe('the developer switch', () => {
  it('reads ?dev from the address: on for anything but 0, false or off', () => {
    expect(devFromUrl('')).toBeNull();
    expect(devFromUrl('?x=1')).toBeNull();
    expect(devFromUrl('?dev')).toBe(true);
    expect(devFromUrl('?dev=1')).toBe(true);
    for (const off of ['0', 'false', 'off']) expect(devFromUrl(`?dev=${off}`)).toBe(false);
  });

  it('starts off, unless the address or this session says otherwise; the address wins', () => {
    expect(initialDev('', null)).toBe(false);
    expect(initialDev('', '1')).toBe(true);
    expect(initialDev('', '0')).toBe(false);
    expect(initialDev('?dev', '0')).toBe(true);
    expect(initialDev('?dev=0', '1')).toBe(false);
  });

  it('is off by default, and remembers a choice for this session', () => {
    expect(useDev.getState().open).toBe(false);
    act(() => useDev.getState().setOpen(true));
    expect(sessionStorage.getItem(DEV_STORAGE_KEY)).toBe('1');
    act(() => useDev.getState().toggle());
    expect(useDev.getState().open).toBe(false);
    expect(sessionStorage.getItem(DEV_STORAGE_KEY)).toBe('0');
  });

  it('holds the match on screen until that match says it has gone', () => {
    const make = () =>
      new MatchSession({ seed: 1, bot: { skill: 1, speed: 1 }, input: new InputController() });
    const a = make();
    const b = make();
    const detachA = useDev.getState().attach(a);
    expect(useDev.getState().session).toBe(a);
    const detachB = useDev.getState().attach(b);
    // The old screen leaving after the new one arrived leaves the new one in place.
    detachA();
    expect(useDev.getState().session).toBe(b);
    detachB();
    expect(useDev.getState().session).toBeNull();
  });

  it('the ` key opens and closes it', () => {
    renderHook(() => useDevKey());
    press('Backquote');
    expect(useDev.getState().open).toBe(true);
    press('Backquote');
    expect(useDev.getState().open).toBe(false);
  });

  it('the key does nothing while typing, with a modifier, or when it is a game key', () => {
    renderHook(() => useDevKey());
    const field = document.body.appendChild(document.createElement('input'));
    press('Backquote', field);
    press('Backquote', window, { ctrlKey: true });
    expect(useDev.getState().open).toBe(false);
    field.remove();
    act(() => usePrefs.getState().setBindings({ ...DEFAULT_BINDINGS, hold: ['Backquote'] }));
    press('Backquote');
    expect(useDev.getState().open).toBe(false);
  });
});
