import { DEFAULT_RULES } from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { matchSettings } from './schemas';
import { DEFAULT_SETTINGS, settingsToRules } from './settings';

describe('match settings', () => {
  it('default to the engine’s default rules', () => {
    expect(matchSettings.parse(DEFAULT_SETTINGS)).toEqual(DEFAULT_SETTINGS);
    expect({ ...DEFAULT_RULES, ...settingsToRules(DEFAULT_SETTINGS) }).toEqual(DEFAULT_RULES);
  });

  it('turn gems and showdowns off in Classic', () => {
    expect(settingsToRules({ ...DEFAULT_SETTINGS, mode: 'classic' })).toMatchObject({
      gemChance: 0,
      showdowns: [],
    });
  });

  it('allow only the PRD’s choices', () => {
    expect(matchSettings.safeParse({ ...DEFAULT_SETTINGS, rampSec: 12 }).success).toBe(false);
    expect(matchSettings.safeParse({ ...DEFAULT_SETTINGS, pauseBudget: 4 }).success).toBe(false);
    expect(matchSettings.safeParse({ ...DEFAULT_SETTINGS, pauseSec: 90 }).success).toBe(false);
    expect(matchSettings.safeParse({ ...DEFAULT_SETTINGS, extra: 1 }).success).toBe(false);
  });
});
