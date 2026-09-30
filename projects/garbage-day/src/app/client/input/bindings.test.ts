import { describe, expect, it } from 'vitest';
import {
  ACTIONS,
  bindKey,
  DEFAULT_BINDINGS,
  keyLabel,
  keyMap,
  MAX_KEYS,
  parseBindings,
  unbindKey,
} from './bindings';

describe('bindings', () => {
  it('the defaults are the controls page: every action bound, no key twice', () => {
    expect(parseBindings(DEFAULT_BINDINGS)).toEqual(DEFAULT_BINDINGS);
    const map = keyMap(DEFAULT_BINDINGS);
    expect(map.size).toBe(ACTIONS.flatMap((a) => DEFAULT_BINDINGS[a]).length);
    expect(map.get('Space')).toBe('hard');
    expect(map.get('ControlRight')).toBe('ccw');
  });

  it('adds a free key to an action', () => {
    const r = bindKey(DEFAULT_BINDINGS, 'hard', 'KeyJ');
    expect(r).toEqual({ ok: true, bindings: { ...DEFAULT_BINDINGS, hard: ['Space', 'KeyJ'] } });
  });

  it('refuses a key another action uses, and names that action', () => {
    expect(bindKey(DEFAULT_BINDINGS, 'hold', 'KeyZ')).toEqual({
      ok: false,
      reason: 'taken',
      by: 'ccw',
    });
  });

  it('accepts a key the action already has, changing nothing', () => {
    const r = bindKey(DEFAULT_BINDINGS, 'cw', 'KeyX');
    expect(r).toEqual({ ok: true, bindings: DEFAULT_BINDINGS });
    expect(r.ok && r.bindings).toBe(DEFAULT_BINDINGS);
  });

  it('refuses Tab, Esc and unidentified keys, and a fourth key', () => {
    for (const code of ['Tab', 'Escape', '', 'Key-X']) {
      expect(bindKey(DEFAULT_BINDINGS, 'hard', code)).toEqual({ ok: false, reason: 'reserved' });
    }
    expect(DEFAULT_BINDINGS.hold).toHaveLength(MAX_KEYS);
    expect(bindKey(DEFAULT_BINDINGS, 'hold', 'KeyV')).toEqual({ ok: false, reason: 'full' });
  });

  it('removes a key, but never an action’s last one', () => {
    expect(unbindKey(DEFAULT_BINDINGS, 'cw', 'ArrowUp').cw).toEqual(['KeyX']);
    expect(unbindKey(DEFAULT_BINDINGS, 'hard', 'Space')).toBe(DEFAULT_BINDINGS);
    expect(unbindKey(DEFAULT_BINDINGS, 'cw', 'KeyQ')).toBe(DEFAULT_BINDINGS);
  });

  it('reads back only a complete, valid map', () => {
    const custom = { ...DEFAULT_BINDINGS, hard: ['KeyJ'] };
    expect(parseBindings(custom)).toEqual(custom);
    expect(parseBindings({ ...custom, extra: ['KeyQ'] })).toEqual(custom);
    const missing = Object.fromEntries(
      Object.entries(DEFAULT_BINDINGS).filter(([action]) => action !== 'power'),
    );
    for (const bad of [
      null,
      'Space',
      [],
      missing,
      { ...DEFAULT_BINDINGS, hard: [] },
      { ...DEFAULT_BINDINGS, hard: 'Space' },
      { ...DEFAULT_BINDINGS, hard: ['KeyZ'] },
      { ...DEFAULT_BINDINGS, hard: ['Tab'] },
      { ...DEFAULT_BINDINGS, hard: [42] },
      { ...DEFAULT_BINDINGS, hard: ['<b>'] },
      { ...DEFAULT_BINDINGS, hard: ['KeyJ', 'KeyK', 'KeyL', 'KeyM'] },
    ]) {
      expect(parseBindings(bad)).toBeNull();
    }
  });

  it('names keys as a US keyboard prints them', () => {
    expect(
      [
        'KeyX',
        'Digit7',
        'ArrowLeft',
        'Space',
        'ControlLeft',
        'ShiftRight',
        'Numpad4',
        'Comma',
        'F5',
      ].map(keyLabel),
    ).toEqual(['X', '7', '←', 'Space', 'Left Ctrl', 'Right Shift', 'Num 4', ',', 'F5']);
  });
});
