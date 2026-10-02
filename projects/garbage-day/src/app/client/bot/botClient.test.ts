import { TPS } from '@garbage-day/engine';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeServer } from '../../test/fakeServer';
import { webSocketLink } from '../net/link';
import { runBot } from './botClient';

// The bot's side of a match (GD-STORY-015), as its worker runs it: here two of them, on a
// stand-in for the Match DO, in fake time, so a whole match takes a moment.

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('runBot', () => {
  it('says it is a bot, plays its seat through the referee to a result, then stops', () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
    const server = fakeServer();
    const match = server.open();
    const url = `ws://garbage-day.test/ws/match/${match.id}`;
    const ended = [false, false];
    const play = (seat: 0 | 1, skill: number, speed: number) =>
      runBot({
        seat: { connect: webSocketLink(url), token: match.tokens[seat] },
        bot: { skill, speed },
        seed: 7 + seat,
        onEnd: () => (ended[seat] = true),
      });
    play(0, 10, 10);
    play(1, 1, 1);
    for (let s = 0; s < 600 && !(ended[0] && ended[1]); s++) vi.advanceTimersByTime(1000);
    server.close();
    expect(match.bots).toEqual([
      { skill: 10, speed: 10 },
      { skill: 1, speed: 1 },
    ]);
    // Both played: each locked pieces, and the referee heard them.
    for (const seat of [0, 1] as const) {
      expect(
        match.heard.filter((h) => h.seat === seat && h.msg.type === 'lock').length,
      ).toBeGreaterThan(10);
    }
    // The strong bot topped the weak one out, and both stopped on the result.
    expect(match.referee?.result).toMatchObject({ winner: 0, reason: 'topout' });
    expect(match.referee?.result?.activeTicks).toBeGreaterThan(10 * TPS);
    expect(ended).toEqual([true, true]);
  }, 60_000);
});
