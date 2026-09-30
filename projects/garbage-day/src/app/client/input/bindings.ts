import type { Action } from './InputController';

/**
 * The default keys from the controls page (kb/product/controls-and-layout.md, "Keyboard"), by
 * `KeyboardEvent.code` so they sit in the same place on every layout. Rebinding is GD-STORY-003.
 */
export const DEFAULT_BINDINGS: Readonly<Record<Action, readonly string[]>> = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  soft: ['ArrowDown'],
  hard: ['Space'],
  cw: ['ArrowUp', 'KeyX'],
  ccw: ['KeyZ', 'ControlLeft', 'ControlRight'],
  hold: ['KeyC', 'ShiftLeft', 'ShiftRight'],
  power: ['KeyE'],
};

/** Turns bindings (action → keys) into the lookup `useKeyBindings` takes (key → action). */
export function keyMap(bindings: Readonly<Record<Action, readonly string[]>>): Map<string, Action> {
  const map = new Map<string, Action>();
  for (const [action, codes] of Object.entries(bindings) as [Action, readonly string[]][]) {
    for (const code of codes) map.set(code, action);
  }
  return map;
}
