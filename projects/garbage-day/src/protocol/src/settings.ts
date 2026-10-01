import type { Rules } from '@garbage-day/engine';
import type { MatchSettings } from './schemas';

// A match's settings (PRD, "Match settings"), with no Zod: the first page checks the settings it
// remembers with `isMatchSettings`, and the protocol's `matchSettings` schema is built from the
// same choices, so both agree on what a setting can be.

/** Each setting's choices, in the order a form offers them. */
export const SETTING_CHOICES = {
  mode: ['standard', 'classic'],
  rampSec: [10, 15, 20, 30],
  pauseBudget: [0, 1, 2, 3],
  pauseSec: [60, 120, 180],
  leaveResult: ['nocontest', 'win'],
} as const;

const KEYS = Object.keys(SETTING_CHOICES) as (keyof typeof SETTING_CHOICES)[];

/** Whether a value is a match's settings: every setting one of its choices, and nothing else. */
export function isMatchSettings(value: unknown): value is MatchSettings {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Object.keys(v).length === KEYS.length &&
    KEYS.every((k) => (SETTING_CHOICES[k] as readonly unknown[]).includes(v[k]))
  );
}

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
