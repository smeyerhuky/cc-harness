import { MAX_BOOSTED_LEVEL, TPS } from './constants';
import type { Rules } from './rules';
import { ROWS_PER_TICK } from './speed-table';
import { FIXED_ONE } from './speed-table-gen';

export { FIXED_ONE };

/**
 * A player's level: one more every `rampSec` of active play up to `maxLevel`, plus Sudden death
 * and Rush levels on top, up to MAX_BOOSTED_LEVEL. Integer arithmetic only.
 */
export function levelAt(
  activeTicks: number,
  rules: Pick<Rules, 'rampSec' | 'maxLevel' | 'suddenLevels' | 'rushLevels'>,
  boosts: { sudden: boolean; rush: boolean },
): number {
  let level = Math.min(rules.maxLevel, 1 + Math.floor(activeTicks / (rules.rampSec * TPS)));
  if (boosts.sudden) level = Math.min(MAX_BOOSTED_LEVEL, level + rules.suddenLevels);
  if (boosts.rush) level = Math.min(MAX_BOOSTED_LEVEL, level + rules.rushLevels);
  return level;
}

/** Gravity at `level` in 16.16 rows per tick. */
export function gravity(level: number): number {
  const i = Math.min(Math.max(level, 1), ROWS_PER_TICK.length) - 1;
  return ROWS_PER_TICK[i] ?? FIXED_ONE;
}

/** Soft-drop gravity: `factor` times normal, and at least half a row per tick. */
export const softGravity = (g: number, factor: number): number =>
  Math.max(g * factor, FIXED_ONE / 2);
