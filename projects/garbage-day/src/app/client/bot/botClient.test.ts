import { TPS, type Referee } from '@garbage-day/engine';
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
  it('says it is a bot, plays its seat through the referee to a result, then asks for a rematch', () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });
    const server = fakeServer();
    const match = server.open();
    const url = `ws://garbage-day.test/ws/match/${match.id}`;
    const ended = [false, false];
    // The result as a bot first saw it: both then ask for a rematch, which starts another match.
    let result: Referee['result'] | undefined;
    const play = (seat: 0 | 1, skill: number, speed: number) =>
      runBot({
        seat: { connect: webSocketLink(url), token: match.tokens[seat] },
        bot: { skill, speed },
        seed: 7 + seat,
        onEnd: () => {
          ended[seat] = true;
          result ??= match.referee?.result ?? undefined;
        },
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
    // The strong bot topped the weak one out, and both reached the result.
    expect(result).toMatchObject({ winner: 0, reason: 'topout' });
    expect(result?.activeTicks).toBeGreaterThan(10 * TPS);
    expect(ended).toEqual([true, true]);
  }, 60_000);

  const fast = () =>
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date', 'performance'],
    });

  it('asks for a rematch at the result, and plays the next match when the rival does too', () => {
    fast();
    const server = fakeServer();
    const match = server.open();
    const url = `ws://garbage-day.test/ws/match/${match.id}`;
    const ended: [number, number] = [0, 0];
    let first: Referee | null | undefined;
    for (const seat of [0, 1] as const) {
      runBot({
        seat: { connect: webSocketLink(url), token: match.tokens[seat] },
        bot: { skill: seat ? 1 : 10, speed: seat ? 1 : 10 },
        seed: 7 + seat,
        onEnd: () => {
          ended[seat]++;
          first ??= match.referee;
        },
      });
    }
    for (let s = 0; s < 600 && !(ended[0] && ended[1]); s++) vi.advanceTimersByTime(1000);
    // Both bots agreed, so a new referee deals a new match and the bots play it to its result.
    expect(match.referee).not.toBe(first);
    for (let s = 0; s < 600 && !(ended[0] > 1 && ended[1] > 1); s++) vi.advanceTimersByTime(1000);
    server.close();
    expect(ended[0]).toBeGreaterThan(1);
    expect(ended[1]).toBeGreaterThan(1);
  }, 60_000);

  it('stops when nobody answers its rematch in 30 s', () => {
    fast();
    const server = fakeServer();
    const match = server.open();
    const url = `ws://garbage-day.test/ws/match/${match.id}`;
    let ended = false;
    let stopped = false;
    const stopRival = runBot({
      seat: { connect: webSocketLink(url), token: match.tokens[1] },
      bot: { skill: 1, speed: 1 },
      seed: 8,
      // The rival goes as soon as it has a result, without asking for a rematch.
      onEnd: () => stopRival(),
    });
    runBot({
      seat: { connect: webSocketLink(url), token: match.tokens[0] },
      bot: { skill: 10, speed: 10 },
      seed: 7,
      onEnd: () => (ended = true),
      onStop: () => (stopped = true),
    });
    for (let s = 0; s < 600 && !ended; s++) vi.advanceTimersByTime(1000);
    expect(ended).toBe(true);
    expect(stopped).toBe(false);
    vi.advanceTimersByTime(29_000);
    expect(stopped).toBe(false);
    vi.advanceTimersByTime(2_000);
    expect(stopped).toBe(true);
    server.close();
  }, 60_000);
});
