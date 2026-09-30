import type { Clear } from '@garbage-day/engine';

// Words for clears (GD-TICKET-018). The engine reports a clear as data; the words live here, one
// place for the labels over the board and the stats, so the game names a four-row clear its own
// way ("Quad") and never after the game it is not. Labels are in sentence case: the popup's CSS
// sets them in capitals, and screen readers read the words.

/** A four-row clear, as a label and as a stat. */
export const QUAD = { one: 'Quad', many: 'Quads' } as const;

const LINES = ['', 'Single', 'Double', 'Triple', QUAD.one] as const;

export interface ClearLabel {
  /** "Quad", "T-spin Double", "B2B Quad · Combo ×3", "Perfect clear". */
  readonly text: string;
  /** A Quad, a T-spin, a back-to-back or a perfect clear: shown in hazard yellow. */
  readonly strong: boolean;
}

/** What a clear is called over the board; `null` for a lock that cleared nothing. */
export function clearLabel(c: Clear): ClearLabel | null {
  if (c.lines <= 0 && !c.tspin) return null;
  if (c.perfectClear) return { text: 'Perfect clear', strong: true };
  const lines = LINES[Math.min(c.lines, 4)] ?? '';
  const name = c.tspin ? `T-spin${lines ? ` ${lines}` : ''}` : lines;
  const b2b = c.b2b ? 'B2B ' : '';
  const combo = c.combo > 0 ? ` · Combo ×${c.combo + 1}` : '';
  return { text: `${b2b}${name}${combo}`, strong: c.b2b || c.tspin || c.lines >= 4 };
}
