import { TPS, type RefereeResult } from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { resultCopy } from './resultCopy';

const at = (seconds: number) => seconds * TPS;
const result = (r: Partial<RefereeResult>): RefereeResult => ({
  winner: 0,
  reason: 'topout',
  by: 1,
  activeTicks: at(134),
  ticks: at(140),
  ...r,
});

describe('resultCopy', () => {
  it('says who won and why, from the player’s side', () => {
    expect(resultCopy(result({}), 'Bot · Regular')).toEqual({
      title: 'You win',
      why: 'Bot · Regular topped out at 2:14.',
    });
    expect(resultCopy(result({ winner: 1, by: 0 }), 'Bot · Regular')).toEqual({
      title: 'Bot · Regular wins',
      why: 'You topped out at 2:14.',
    });
  });

  it('has words for every way a match ends', () => {
    const why = (r: Partial<RefereeResult>) => resultCopy(result(r), 'Quiet Wren 7').why;
    expect(why({ reason: 'timeout', by: 1 })).toBe(
      "Quiet Wren 7 didn't come back before the pause ran out.",
    );
    expect(why({ reason: 'grace', by: 1 })).toBe('Quiet Wren 7 stayed away with no pauses left.');
    expect(why({ winner: 1, reason: 'left', by: 0 })).toBe('You left the match at 2:14.');
    expect(
      resultCopy(result({ winner: null, reason: 'left-while-paused', by: 0 }), 'Quiet Wren 7'),
    ).toEqual({
      title: 'No contest',
      why: 'You left while Quiet Wren 7 was away.',
    });
    expect(why({ winner: null, reason: 'left-while-paused', by: 1 })).toBe(
      'Quiet Wren 7 left while you were away.',
    );
    expect(why({ winner: null, reason: 'abandoned', by: null })).toBe(
      'Both players were away until the session ended.',
    );
  });
});
