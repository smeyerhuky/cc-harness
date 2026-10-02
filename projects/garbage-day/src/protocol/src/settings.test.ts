import { DEFAULT_RULES } from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { createdGame, joinedGame, matchSettings, newGame } from './schemas';
import { DEFAULT_SETTINGS, isMatchSettings, SETTING_CHOICES, settingsToRules } from './settings';

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

describe('checking settings without Zod', () => {
  it('agrees with the schema on every choice and on what is not one', () => {
    const samples: unknown[] = [
      DEFAULT_SETTINGS,
      ...Object.entries(SETTING_CHOICES).flatMap(([k, choices]) =>
        (choices as readonly unknown[]).map((c) => ({ ...DEFAULT_SETTINGS, [k]: c })),
      ),
      { ...DEFAULT_SETTINGS, rampSec: 12 },
      { ...DEFAULT_SETTINGS, mode: 'turbo' },
      { ...DEFAULT_SETTINGS, pauseBudget: '2' },
      { ...DEFAULT_SETTINGS, extra: 1 },
      { mode: 'standard' },
      null,
      'standard',
    ];
    for (const sample of samples) {
      expect(isMatchSettings(sample)).toBe(matchSettings.safeParse(sample).success);
    }
    expect(samples.filter(isMatchSettings)).toHaveLength(1 + 15);
  });
});

describe('private games', () => {
  it('are made from settings, and answer a code and a token', () => {
    expect(newGame.safeParse({ settings: DEFAULT_SETTINGS }).success).toBe(true);
    expect(newGame.safeParse({}).success).toBe(false);
    const token = 'token-seat-zero-0000';
    expect(createdGame.safeParse({ code: 'GD-7KQ4', token }).success).toBe(true);
    expect(createdGame.safeParse({ code: 'Q-0123456789', token }).success).toBe(false);
  });

  it('are joined with a token, or refused as full, expired or unknown', () => {
    expect(joinedGame.safeParse({ token: 'token-seat-one-11111' }).success).toBe(true);
    for (const error of ['full', 'expired', 'none']) {
      expect(joinedGame.safeParse({ error }).success).toBe(true);
    }
    expect(joinedGame.safeParse({ error: 'gone' }).success).toBe(false);
  });
});
