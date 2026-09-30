import type { PieceType, PowerKind } from '@garbage-day/engine';

// The UI language's tokens (kb/design/ui-language.md), as data. `tokens.css` is generated from
// this file (`pnpm --filter @garbage-day/ui tokens:update`), and tokens.test.ts checks that it is
// current and that every colour pair the UI relies on reaches its contrast in both themes.

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

type ThemePair = Readonly<Record<Theme, string>>;
const same = (hex: string): ThemePair => ({ light: hex, dark: hex });

/** Every colour token, by its CSS custom property name without the leading `--`. */
export const COLORS = {
  bg: { light: '#ECEEEA', dark: '#101315' },
  surface: { light: '#F8F9F6', dark: '#171B1E' },
  'surface-2': { light: '#E1E5DF', dark: '#1F2529' },
  ink: { light: '#1B1F22', dark: '#E6E9E4' },
  muted: { light: '#56606A', dark: '#98A2A8' },
  line: { light: '#C8CEC7', dark: '#2C3338' },
  accent: { light: '#C73E17', dark: '#FF6B3D' },
  'accent-ink': { light: '#FFFFFF', dark: '#1A0D07' },
  rival: { light: '#22629C', dark: '#5DA5E3' },
  hazard: { light: '#F2B90F', dark: '#F2C12E' },
  'hazard-ink': { light: '#1B1F22', dark: '#111416' },
  ok: { light: '#2A8453', dark: '#4CC27F' },
  warn: { light: '#9A7208', dark: '#E3B23C' },
  bad: { light: '#C23A2B', dark: '#F0604F' },
  well: { light: '#14181B', dark: '#0A0D0F' },
  'well-grid': { light: '#1F2529', dark: '#171C20' },
  'well-ink': same('#E9ECE7'),
  cabinet: { light: '#262C31', dark: '#0E1113' },
  garbage: { light: '#6F777D', dark: '#646C72' },
  'garbage-stripe': { light: '#5A6167', dark: '#50575C' },
  'pw-shield': same('#4FD1E8'),
  'pw-bomb': same('#F0604F'),
  'pw-fog': same('#B3B6D6'),
  'pw-rush': same('#F29A2E'),
  'piece-i': same('#D0A15B'),
  'piece-o': same('#3E9E7A'),
  'piece-t': same('#4A78C8'),
  'piece-s': same('#C4508A'),
  'piece-z': same('#7C95AC'),
  'piece-j': same('#8FA33B'),
  'piece-l': same('#9A6CC0'),
} as const satisfies Record<string, ThemePair>;
export type ColorToken = keyof typeof COLORS;

/**
 * The stage is a dark cabinet in both themes, so what sits on it (names, chips, the meter's
 * count, the banner) uses the dark theme's content colours even in light mode. Elements inside
 * a `[data-stage]` element get these; the cabinet and the well keep their own theme's shade.
 */
const STAGE_CONTENT: readonly ColorToken[] = [
  'surface',
  'surface-2',
  'ink',
  'muted',
  'line',
  'accent',
  'accent-ink',
  'rival',
  'hazard',
  'hazard-ink',
  'ok',
  'warn',
  'bad',
];

/** The collection-streams palette: no piece keeps its guideline hue (UI language, "Pieces"). */
export const PIECE_COLOR: Readonly<Record<PieceType, string>> = {
  I: COLORS['piece-i'].light,
  O: COLORS['piece-o'].light,
  T: COLORS['piece-t'].light,
  S: COLORS['piece-s'].light,
  Z: COLORS['piece-z'].light,
  J: COLORS['piece-j'].light,
  L: COLORS['piece-l'].light,
};

/** Each piece's pattern mark, so shapes differ without colour (US-20). */
export type Mark = 'lines' | 'ring' | 'triangle' | 'slash' | 'dots' | 'plus' | 'square';
export const PIECE_MARK: Readonly<Record<PieceType, Mark>> = {
  I: 'lines',
  O: 'ring',
  T: 'triangle',
  S: 'slash',
  Z: 'dots',
  J: 'plus',
  L: 'square',
};
/** Marks are inset in 30% ink. */
export const MARK_INK = 'rgba(27, 31, 34, 0.3)';

export const POWER_COLOR: Readonly<Record<PowerKind, string>> = {
  shield: COLORS['pw-shield'].light,
  bomb: COLORS['pw-bomb'].light,
  fog: COLORS['pw-fog'].light,
  rush: COLORS['pw-rush'].light,
};

/** What the board canvas draws with, for the theme in force. */
export interface BoardPalette {
  readonly well: string;
  readonly grid: string;
  readonly garbage: string;
  readonly stripe: string;
  readonly dead: string;
}
export const boardPalette = (theme: Theme): BoardPalette => ({
  well: COLORS.well[theme],
  grid: COLORS['well-grid'][theme],
  garbage: COLORS.garbage[theme],
  stripe: COLORS['garbage-stripe'][theme],
  dead: '#4B5257',
});

export const FONTS = {
  display: "'Big Shoulders Display', 'Arial Narrow', sans-serif",
  body: "'Public Sans', system-ui, sans-serif",
  data: "'IBM Plex Mono', ui-monospace, monospace",
} as const;

/** The type scale in px; the two display sizes clamp to the viewport. */
export const TYPE_SCALE = {
  14: '14px',
  16: '16px',
  20: '20px',
  28: '28px',
  40: 'clamp(28px, 5vw, 40px)',
  64: 'clamp(40px, 9vw, 64px)',
} as const;

/** Durations from the UI language's motion table, in ms; each has a reduced-motion version. */
export const MOTION = {
  hardDropPerRow: 14,
  lockGlow: 260,
  clearPulses: 200,
  clearCollapse: 220,
  garbageRise: 150,
  shake: 380,
  attackFlight: 700,
  clearLabel: 1300,
  clearLabelReduced: 1000,
  countdownPop: 550,
} as const;

/** Vibration lengths in ms (UI language, "Touch feedback"). */
export const HAPTICS = { lock: 10, hardDrop: 20, garbage: 30 } as const;

/** A colour pair the UI relies on and the contrast it must reach (WCAG 2: 4.5 text, 3 other). */
export interface ContrastPair {
  readonly fg: ColorToken;
  readonly bg: ColorToken;
  readonly min: number;
  /** Where the pair sits: on the page, or on the stage (content colours from `STAGE_CONTENT`). */
  readonly on: 'page' | 'stage';
  readonly use: string;
}

const text = (fg: ColorToken, bg: ColorToken, on: 'page' | 'stage', use: string): ContrastPair => ({
  fg,
  bg,
  min: 4.5,
  on,
  use,
});
const mark = (fg: ColorToken, bg: ColorToken, on: 'page' | 'stage', use: string): ContrastPair => ({
  fg,
  bg,
  min: 3,
  on,
  use,
});

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  text('ink', 'bg', 'page', 'body text'),
  text('ink', 'surface', 'page', 'cards and sheets'),
  text('ink', 'surface-2', 'page', 'secondary surfaces'),
  text('muted', 'bg', 'page', 'secondary text'),
  text('muted', 'surface', 'page', 'secondary text on cards'),
  text('muted', 'surface-2', 'page', 'secondary text on secondary surfaces'),
  text('accent-ink', 'accent', 'page', 'primary button labels'),
  text('hazard-ink', 'hazard', 'page', 'stripe bands and the showdown banner'),
  mark('accent', 'bg', 'page', 'the local player, focus rings'),
  mark('rival', 'bg', 'page', 'the opponent'),
  mark('ok', 'surface', 'page', 'results and presence'),
  mark('warn', 'surface', 'page', 'results and presence'),
  mark('bad', 'surface', 'page', 'results and presence'),
  text('well-ink', 'cabinet', 'stage', 'stage text'),
  text('well-ink', 'well', 'stage', 'text over a board'),
  text('muted', 'cabinet', 'stage', 'stage captions'),
  text('hazard-ink', 'hazard', 'stage', 'the showdown banner'),
  mark('accent', 'cabinet', 'stage', 'the local player on the stage'),
  mark('rival', 'cabinet', 'stage', 'the opponent on the stage'),
  mark('ok', 'cabinet', 'stage', 'presence: online'),
  mark('warn', 'cabinet', 'stage', 'presence: away'),
  mark('bad', 'cabinet', 'stage', 'presence: gone'),
  mark('hazard', 'cabinet', 'stage', 'the garbage meter'),
  mark('garbage', 'well', 'stage', 'landed garbage'),
  ...(['piece-i', 'piece-o', 'piece-t', 'piece-s', 'piece-z', 'piece-j', 'piece-l'] as const).map(
    (p) => mark(p, 'well', 'stage', 'a piece on the board'),
  ),
  ...(['pw-shield', 'pw-bomb', 'pw-fog', 'pw-rush'] as const).map((p) =>
    mark(p, 'well', 'stage', 'a gem on the board'),
  ),
];

/** The colour a token takes in a theme, on the page or on the stage. */
export function resolve(token: ColorToken, theme: Theme, on: 'page' | 'stage'): string {
  const stageTheme = on === 'stage' && STAGE_CONTENT.includes(token) ? 'dark' : theme;
  return COLORS[token][stageTheme];
}

const decls = (theme: Theme, only?: readonly ColorToken[]): string =>
  (Object.keys(COLORS) as ColorToken[])
    .filter((t) => !only || only.includes(t))
    .map((t) => `  --${t}: ${COLORS[t][theme].toLowerCase()};`)
    .join('\n');

const changedInDark = (Object.keys(COLORS) as ColorToken[]).filter(
  (t) => COLORS[t].light !== COLORS[t].dark,
);

/** The generated `tokens.css`. */
export function tokensCss(): string {
  const scale = Object.entries(TYPE_SCALE)
    .map(([k, v]) => `  --fs-${k}: ${v};`)
    .join('\n');
  const dark = `${decls('dark', changedInDark)}\n  color-scheme: dark;`;
  return `/* GENERATED from tokens.ts by \`pnpm --filter @garbage-day/ui tokens:update\`: do not edit.
   Garbage Day design tokens (kb/design/ui-language.md, "Colour tokens" and "Type"). */
:root {
${decls('light')}
  --font-display: ${FONTS.display};
  --font-body: ${FONTS.body};
  --font-data: ${FONTS.data};
${scale}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${dark.replace(/^/gm, '  ')}
  }
}

:root[data-theme='dark'] {
${dark}
}

/* The stage is a dark cabinet in both themes: what sits on it uses the dark content colours. */
[data-stage] {
${decls('dark', STAGE_CONTENT)}
  color: var(--well-ink);
}

/* The player's own reduced-motion setting, on top of the system's (US-20). */
:root[data-motion='reduce'] *,
:root[data-motion='reduce'] *::before,
:root[data-motion='reduce'] *::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

/* The page itself follows the theme; nothing outside the app shows the browser's defaults. */
html,
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
}
`;
}
