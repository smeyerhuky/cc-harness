import { afterEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';
import { appMachine, botName, type AppEvent, type AppState, type MatchResult } from './appMachine';

const REGULAR = { skill: 5, speed: 5 };
const WIN: MatchResult = { winner: 0, reason: 'topout' };
/** A pairing, as the lobby tells it. */
const paired = (opponent: string): AppEvent => ({
  type: 'MATCHED',
  opponent,
  matchId: 'Q-0123456789',
  token: 'token-seat-zero-0000',
});

/** Starts the actor and sends each event in turn. */
function run(...events: AppEvent[]) {
  const actor = createActor(appMachine).start();
  for (const e of events) actor.send(e);
  return actor.getSnapshot();
}

describe('appMachine', () => {
  it('starts at home with nothing chosen', () => {
    const s = run();
    expect(s.value).toBe('home');
    expect(s.context).toMatchObject({ mode: null, opponent: null, result: null, match: 0 });
  });

  describe('a bot match (M2)', () => {
    it('goes home → countdown → playing → result', () => {
      const countdown = run({ type: 'PLAY_BOT', bot: REGULAR });
      expect(countdown.value).toBe('countdown');
      expect(countdown.context).toMatchObject({
        mode: 'bot',
        bot: REGULAR,
        opponent: 'Bot · Regular',
        countdownFor: 'start',
        match: 1,
      });
      const result = run(
        { type: 'PLAY_BOT', bot: REGULAR },
        { type: 'GO' },
        { type: 'ENDED', result: WIN },
      );
      expect(result.value).toBe('result');
      expect(result.context.result).toEqual(WIN);
    });

    it('refuses a bot outside 1 to 10', () => {
      for (const bot of [
        { skill: 0, speed: 5 },
        { skill: 5, speed: 11 },
        { skill: 2.5, speed: 5 },
      ]) {
        expect(run({ type: 'PLAY_BOT', bot }).value).toBe('home');
      }
    });

    it('pauses, then resumes through the countdown', () => {
      const paused = run({ type: 'PLAY_BOT', bot: REGULAR }, { type: 'GO' }, { type: 'PAUSED' });
      expect(paused.value).toBe('paused');
      const resuming = run(
        { type: 'PLAY_BOT', bot: REGULAR },
        { type: 'GO' },
        { type: 'PAUSED' },
        { type: 'RESUMED' },
      );
      expect(resuming.value).toBe('countdown');
      expect(resuming.context.countdownFor).toBe('resume');
    });

    it('ends from a pause or before GO', () => {
      expect(
        run(
          { type: 'PLAY_BOT', bot: REGULAR },
          { type: 'GO' },
          { type: 'PAUSED' },
          { type: 'ENDED', result: WIN },
        ).value,
      ).toBe('result');
      expect(run({ type: 'PLAY_BOT', bot: REGULAR }, { type: 'ENDED', result: WIN }).value).toBe(
        'result',
      );
    });

    it('rematches as a new match, or goes home', () => {
      const played = [
        { type: 'PLAY_BOT', bot: REGULAR },
        { type: 'GO' },
        { type: 'ENDED', result: WIN },
      ] as const;
      expect(run(...played, { type: 'REMATCH' }).value).toBe('rematch');
      const again = run(...played, { type: 'REMATCH' }, { type: 'REMATCH_ACCEPTED' });
      expect(again.value).toBe('countdown');
      expect(again.context).toMatchObject({ match: 2, result: null, countdownFor: 'start' });
      expect(run(...played, { type: 'REMATCH' }, { type: 'REMATCH_TIMEOUT' }).value).toBe('home');
      const home = run(...played, { type: 'HOME' });
      expect(home.value).toBe('home');
      expect(home.context).toMatchObject({ mode: null, result: null, match: 1 });
    });
  });

  describe('online paths (driven by the lobby socket in M3)', () => {
    it('quick match: searching, a bot offer, and a pairing', () => {
      expect(run({ type: 'QUICK_MATCH' }).value).toBe('searching');
      expect(run({ type: 'QUICK_MATCH' }, { type: 'CANCEL' }).value).toBe('home');
      expect(run({ type: 'QUICK_MATCH' }, { type: 'BOT_OFFER' }).value).toBe('botOffer');
      expect(
        run({ type: 'QUICK_MATCH' }, { type: 'BOT_OFFER' }, { type: 'KEEP_WAITING' }).value,
      ).toBe('searching');
      const bot = run(
        { type: 'QUICK_MATCH' },
        { type: 'BOT_OFFER' },
        { type: 'PLAY_BOT', bot: REGULAR },
      );
      expect(bot.value).toBe('countdown');
      const done = run({ type: 'QUICK_MATCH' }, paired('Brisk Heron 42'));
      expect(done.value).toBe('countdown');
      expect(done.context).toMatchObject({
        mode: 'quick',
        opponent: 'Brisk Heron 42',
        match: 1,
        matchId: 'Q-0123456789',
        token: 'token-seat-zero-0000',
        queued: false,
      });
      expect(run({ type: 'QUICK_MATCH' }, { type: 'BOT_OFFER' }, paired('X')).value).toBe(
        'countdown',
      );
      expect(run({ type: 'QUICK_MATCH' }, { type: 'BOT_OFFER' }, { type: 'CANCEL' }).value).toBe(
        'home',
      );
    });

    describe('the pool', () => {
      afterEach(() => {
        vi.useRealTimers();
      });

      it('offers a bot after 20 s of searching, once a search', () => {
        vi.useFakeTimers();
        const actor = createActor(appMachine).start();
        actor.send({ type: 'QUICK_MATCH' });
        vi.advanceTimersByTime(19_999);
        expect(actor.getSnapshot().value).toBe('searching');
        vi.advanceTimersByTime(1);
        expect(actor.getSnapshot().value).toBe('botOffer');
        actor.send({ type: 'KEEP_WAITING' });
        vi.advanceTimersByTime(60_000);
        expect(actor.getSnapshot().value).toBe('searching');
      });

      it('counts who is waiting', () => {
        const s = run({ type: 'QUICK_MATCH' }, { type: 'WAITING', count: 2 });
        expect(s.context).toMatchObject({ waiting: 2, queued: true });
      });

      it('keeps a player playing a bot in the pool, and pairs them out of the bot game', () => {
        const playing = run(
          { type: 'QUICK_MATCH' },
          { type: 'BOT_OFFER' },
          { type: 'PLAY_BOT', bot: REGULAR },
          { type: 'GO' },
        );
        expect(playing.context).toMatchObject({ mode: 'bot', queued: true });
        const s = run(
          { type: 'QUICK_MATCH' },
          { type: 'BOT_OFFER' },
          { type: 'PLAY_BOT', bot: REGULAR },
          { type: 'GO' },
          paired('Quiet Wren 7'),
        );
        expect(s.value).toBe('countdown');
        expect(s.context).toMatchObject({ mode: 'quick', opponent: 'Quiet Wren 7', match: 2 });
      });

      it('leaves the pool on going home, and a pairing then changes nothing', () => {
        const s = run(
          { type: 'QUICK_MATCH' },
          { type: 'BOT_OFFER' },
          { type: 'PLAY_BOT', bot: REGULAR },
          { type: 'ENDED', result: WIN },
          { type: 'HOME' },
          paired('Too Late 1'),
        );
        expect(s.value).toBe('home');
        expect(s.context.queued).toBe(false);
      });
    });

    it('private game: create or join a valid code, get ready, or fail', () => {
      expect(run({ type: 'CREATE_GAME' }).value).toBe('lobby');
      const joined = run({ type: 'JOIN', code: 'GD-7KQ4' });
      expect(joined.value).toBe('lobby');
      expect(joined.context).toMatchObject({ mode: 'private', code: 'GD-7KQ4' });
      expect(run({ type: 'JOIN', code: 'gd-7kq4' }).value).toBe('home');
      expect(run({ type: 'JOIN', code: 'GD-7KQ45' }).value).toBe('home');
      expect(run({ type: 'CREATE_GAME' }, { type: 'BOTH_READY', opponent: 'Y' }).value).toBe(
        'countdown',
      );
      expect(run({ type: 'CREATE_GAME' }, { type: 'LEAVE' }).value).toBe('home');
      const full = run({ type: 'JOIN', code: 'GD-7KQ4' }, { type: 'LOBBY_ERROR', error: 'full' });
      expect(full.value).toBe('home');
      expect(full.context).toMatchObject({ error: 'full', code: null });
    });
  });

  it('ignores every event a state does not list', () => {
    const all: AppEvent[] = [
      { type: 'QUICK_MATCH' },
      { type: 'CANCEL' },
      { type: 'BOT_OFFER' },
      { type: 'KEEP_WAITING' },
      { type: 'PLAY_BOT', bot: REGULAR },
      paired('X'),
      { type: 'WAITING', count: 3 },
      { type: 'CREATE_GAME' },
      { type: 'JOIN', code: 'GD-AAAA' },
      { type: 'LOBBY_ERROR', error: 'expired' },
      { type: 'BOTH_READY', opponent: 'X' },
      { type: 'LEAVE' },
      { type: 'GO' },
      { type: 'PAUSED' },
      { type: 'RESUMED' },
      { type: 'ENDED', result: WIN },
      { type: 'REMATCH' },
      { type: 'REMATCH_ACCEPTED' },
      { type: 'REMATCH_TIMEOUT' },
      { type: 'HOME' },
    ];
    const reach: Record<AppState, AppEvent[]> = {
      home: [],
      searching: [{ type: 'QUICK_MATCH' }],
      botOffer: [{ type: 'QUICK_MATCH' }, { type: 'BOT_OFFER' }],
      lobby: [{ type: 'CREATE_GAME' }],
      countdown: [{ type: 'PLAY_BOT', bot: REGULAR }],
      playing: [{ type: 'PLAY_BOT', bot: REGULAR }, { type: 'GO' }],
      paused: [{ type: 'PLAY_BOT', bot: REGULAR }, { type: 'GO' }, { type: 'PAUSED' }],
      result: [
        { type: 'PLAY_BOT', bot: REGULAR },
        { type: 'ENDED', result: WIN },
      ],
      rematch: [
        { type: 'PLAY_BOT', bot: REGULAR },
        { type: 'ENDED', result: WIN },
        { type: 'REMATCH' },
      ],
    };
    const allowed: Record<AppState, string[]> = {
      home: ['QUICK_MATCH', 'PLAY_BOT', 'CREATE_GAME', 'JOIN'],
      searching: ['CANCEL', 'BOT_OFFER', 'MATCHED'],
      botOffer: ['PLAY_BOT', 'KEEP_WAITING', 'CANCEL', 'MATCHED'],
      lobby: ['BOTH_READY', 'LEAVE', 'LOBBY_ERROR'],
      countdown: ['GO', 'ENDED'],
      playing: ['PAUSED', 'ENDED'],
      paused: ['RESUMED', 'ENDED'],
      result: ['REMATCH', 'HOME'],
      rematch: ['REMATCH_ACCEPTED', 'REMATCH_TIMEOUT', 'HOME'],
    };
    for (const [state, path] of Object.entries(reach) as [AppState, AppEvent[]][]) {
      expect(run(...path).value).toBe(state);
      for (const e of all) {
        if (allowed[state].includes(e.type)) continue;
        const after = run(...path, e);
        expect({ state, event: e.type, value: after.value }).toEqual({
          state,
          event: e.type,
          value: state,
        });
      }
    }
  });

  it('names bots by their skill preset (Rookie 2, Regular 5, Pro 8), whatever the speed', () => {
    expect(botName({ skill: 2, speed: 9 })).toBe('Bot · Rookie');
    expect(botName({ skill: 8, speed: 1 })).toBe('Bot · Pro');
    expect(botName({ skill: 7, speed: 3 })).toBe('Bot · skill 7');
  });
});
