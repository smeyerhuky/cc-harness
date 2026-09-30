import type { Action } from './InputController';

// The keyboard map (kb/product/controls-and-layout.md, "Keyboard"): each action's keys, by
// `KeyboardEvent.code`, so they sit in the same place on every layout. The player can rebind
// every action (US-16); the rules for a change live here so the settings and the stored
// preferences apply the same ones.

/** Each action's keys. */
export type Bindings = Readonly<Record<Action, readonly string[]>>;

/** The actions in the order the settings list them. */
export const ACTIONS: readonly Action[] = [
  'left',
  'right',
  'soft',
  'hard',
  'cw',
  'ccw',
  'hold',
  'power',
];

export const ACTION_LABEL: Readonly<Record<Action, string>> = {
  left: 'Move left',
  right: 'Move right',
  soft: 'Soft drop',
  hard: 'Hard drop',
  cw: 'Rotate clockwise',
  ccw: 'Rotate counter-clockwise',
  hold: 'Hold',
  power: 'Fire power-up',
};

/** The controls page's defaults. */
export const DEFAULT_BINDINGS: Bindings = {
  left: ['ArrowLeft'],
  right: ['ArrowRight'],
  soft: ['ArrowDown'],
  hard: ['Space'],
  cw: ['ArrowUp', 'KeyX'],
  ccw: ['KeyZ', 'ControlLeft', 'ControlRight'],
  hold: ['KeyC', 'ShiftLeft', 'ShiftRight'],
  power: ['KeyE'],
};

/** Keys per action, enough for both Ctrls and a letter. */
export const MAX_KEYS = 3;

/** Tab moves around the page and Esc closes things, so neither can be bound. */
const RESERVED: ReadonlySet<string> = new Set(['Tab', 'Escape']);

const CODE = /^[A-Za-z0-9]{1,32}$/;

export type BindResult =
  | { readonly ok: true; readonly bindings: Bindings }
  | { readonly ok: false; readonly reason: 'reserved' | 'full' }
  | { readonly ok: false; readonly reason: 'taken'; readonly by: Action };

/** Adds a key to an action. A key already used by another action is refused, not moved. */
export function bindKey(b: Bindings, action: Action, code: string): BindResult {
  if (RESERVED.has(code) || !CODE.test(code)) return { ok: false, reason: 'reserved' };
  const by = ACTIONS.find((a) => b[a].includes(code));
  if (by === action) return { ok: true, bindings: b };
  if (by) return { ok: false, reason: 'taken', by };
  if (b[action].length >= MAX_KEYS) return { ok: false, reason: 'full' };
  return { ok: true, bindings: { ...b, [action]: [...b[action], code] } };
}

/** Removes a key from an action, unless it is the action's last one. */
export function unbindKey(b: Bindings, action: Action, code: string): Bindings {
  if (b[action].length <= 1 || !b[action].includes(code)) return b;
  return { ...b, [action]: b[action].filter((c) => c !== code) };
}

/**
 * Stored bindings, if they are still a complete, valid map: every action with one to
 * `MAX_KEYS` keys, no key used twice, none reserved. Anything else is `null`.
 */
export function parseBindings(stored: unknown): Bindings | null {
  if (typeof stored !== 'object' || stored === null) return null;
  const s = stored as Partial<Record<Action, unknown>>;
  const seen = new Set<string>();
  const out: Partial<Record<Action, readonly string[]>> = {};
  for (const a of ACTIONS) {
    const codes = s[a];
    if (!Array.isArray(codes) || codes.length < 1 || codes.length > MAX_KEYS) return null;
    for (const c of codes) {
      if (typeof c !== 'string' || !CODE.test(c) || RESERVED.has(c) || seen.has(c)) return null;
      seen.add(c);
    }
    out[a] = codes as string[];
  }
  return out as Bindings;
}

/** Turns bindings (action → keys) into the lookup `useKeyBindings` takes (key → action). */
export function keyMap(bindings: Bindings): Map<string, Action> {
  const map = new Map<string, Action>();
  for (const a of ACTIONS) for (const code of bindings[a]) map.set(code, a);
  return map;
}

const NAMED: Readonly<Record<string, string>> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Backquote: '`',
  Minus: '-',
  Equal: '=',
  BracketLeft: '[',
  BracketRight: ']',
  Backslash: '\\',
  Semicolon: ';',
  Quote: "'",
  Comma: ',',
  Period: '.',
  Slash: '/',
};
const MODIFIER: Readonly<Record<string, string>> = {
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Meta: 'Meta',
};

/** A key's name as a US keyboard prints it: `KeyX` → "X", `ControlLeft` → "Left Ctrl". */
export function keyLabel(code: string): string {
  const named = NAMED[code];
  if (named) return named;
  const m = /^(?:Key([A-Z])|Digit([0-9]))$/.exec(code);
  if (m) return m[1] ?? m[2] ?? code;
  const mod = /^(Control|Shift|Alt|Meta)(Left|Right)$/.exec(code);
  if (mod?.[1] && mod[2]) return `${mod[2]} ${MODIFIER[mod[1]] ?? mod[1]}`;
  const pad = /^Numpad(.+)$/.exec(code);
  if (pad?.[1]) return `Num ${pad[1]}`;
  return code;
}
