import type { Rules } from '@garbage-day/engine';
import type { MatchSettings } from './schemas';

/** Quick match always plays these (PRD, "Match settings"). */
export const DEFAULT_SETTINGS: MatchSettings = Object.freeze({
  mode: 'standard',
  rampSec: 15,
  pauseBudget: 2,
  pauseSec: 120,
  leaveResult: 'nocontest',
});

/** The engine rules a match's settings change; Classic turns gems and showdowns off. */
export function settingsToRules(s: MatchSettings): Partial<Rules> {
  return {
    rampSec: s.rampSec,
    pauseBudget: s.pauseBudget,
    pauseSec: s.pauseSec,
    leaveResult: s.leaveResult,
    ...(s.mode === 'classic' ? { gemChance: 0, showdowns: [] } : {}),
  };
}
