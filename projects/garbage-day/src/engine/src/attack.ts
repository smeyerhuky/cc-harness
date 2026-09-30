/** Rows sent for 0–4 lines cleared. */
export const LINE_ATTACK = [0, 0, 1, 2, 4] as const;
/** Rows sent for a T-spin clearing 0–3 lines. */
export const TSPIN_ATTACK = [0, 2, 4, 6] as const;
/** Bonus rows by combo count (0 = the first clear in a row); 10 and above get the last value. */
export const COMBO_ATTACK = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5] as const;
/** The least a perfect clear sends. */
export const PERFECT_CLEAR_ATTACK = 10;

/** What a line clear did, as the engine reports it; display words are the UI's job. */
export interface Clear {
  readonly lines: number;
  readonly tspin: boolean;
  /** The back-to-back bonus applied: this clear and the previous one were both difficult. */
  readonly b2b: boolean;
  /** Clears on consecutive pieces before this one (0 for the first). */
  readonly combo: number;
  readonly perfectClear: boolean;
  /** Rows the clear is worth, before cancelling. */
  readonly attack: number;
}

/**
 * Scores a clear. `backToBack` is whether the previous clear was difficult (four lines or a
 * T-spin); `combo` counts clears on consecutive pieces before this one. Returns the clear and
 * whether it was difficult, which becomes the next clear's `backToBack`.
 */
export function scoreClear(o: {
  lines: number;
  tspin: boolean;
  perfectClear: boolean;
  backToBack: boolean;
  combo: number;
}): { clear: Clear; difficult: boolean } {
  const difficult = o.lines === 4 || o.tspin;
  const b2b = difficult && o.backToBack;
  let attack: number = (o.tspin ? TSPIN_ATTACK[o.lines] : LINE_ATTACK[o.lines]) ?? 0;
  if (b2b) attack += 1;
  attack += COMBO_ATTACK[Math.min(o.combo, COMBO_ATTACK.length - 1)] ?? 0;
  if (o.perfectClear) attack = Math.max(attack, PERFECT_CLEAR_ATTACK);
  const clear = {
    lines: o.lines,
    tspin: o.tspin,
    b2b,
    combo: o.combo,
    perfectClear: o.perfectClear,
    attack,
  };
  return { clear, difficult };
}
