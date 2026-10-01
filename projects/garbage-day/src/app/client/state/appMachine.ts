import type { PlayerIndex, ResultReason } from '@garbage-day/engine';
import { assign, setup } from 'xstate';

// Which screen the app is on and why (kb/design/client-architecture.md, "Where state lives").
// Only the events a state lists can move it, so impossible jumps (a pause before the countdown,
// a rematch with no result) are ignored rather than handled. Online events (MATCHED, BOT_OFFER,
// lobby readiness) arrive from the lobby socket in M3; in M2 only the bot path runs.

/** A bot's two settings, each 1 to 10 (PRD US-03). */
export interface BotChoice {
  readonly skill: number;
  readonly speed: number;
}

/** How a match ended, as the result screen shows it. */
export interface MatchResult {
  /** The winner's seat, where the local player is seat 0; null for no contest. */
  readonly winner: PlayerIndex | null;
  readonly reason: ResultReason;
}

type LobbyError = 'full' | 'expired';

export interface AppContext {
  readonly mode: 'quick' | 'private' | 'bot' | null;
  readonly bot: BotChoice | null;
  readonly opponent: string | null;
  /** A private game's code, such as `GD-7KQ4`. */
  readonly code: string | null;
  readonly result: MatchResult | null;
  /** Whether the countdown starts a match or resumes one after a pause. */
  readonly countdownFor: 'start' | 'resume';
  /** Counts matches in this session, so a rematch is a new match with a new seed. */
  readonly match: number;
  readonly error: LobbyError | null;
  /** In the quick-match pool: from Quick match until paired or gone home, a bot game included. */
  readonly queued: boolean;
  /** Players waiting in the pool, this one included. */
  readonly waiting: number;
  /** The bot offer has been made: once a search (PRD US-01). */
  readonly offered: boolean;
  /** The online match the lobby paired this player into, and this player's token for it. */
  readonly matchId: string | null;
  readonly token: string | null;
}

export type AppEvent =
  | { readonly type: 'QUICK_MATCH' }
  | { readonly type: 'CANCEL' }
  | { readonly type: 'BOT_OFFER' }
  | { readonly type: 'KEEP_WAITING' }
  | { readonly type: 'PLAY_BOT'; readonly bot: BotChoice }
  | {
      readonly type: 'MATCHED';
      readonly opponent: string;
      readonly matchId: string;
      readonly token: string;
    }
  | { readonly type: 'WAITING'; readonly count: number }
  /** The Match DO says the online rival is a bot (GD-TICKET-016). */
  | { readonly type: 'RIVAL_BOT'; readonly bot: BotChoice }
  | { readonly type: 'CREATE_GAME' }
  | { readonly type: 'JOIN'; readonly code: string }
  | { readonly type: 'LOBBY_ERROR'; readonly error: LobbyError }
  | { readonly type: 'BOTH_READY'; readonly opponent: string }
  | { readonly type: 'LEAVE' }
  | { readonly type: 'GO' }
  | { readonly type: 'PAUSED' }
  | { readonly type: 'RESUMED' }
  | { readonly type: 'ENDED'; readonly result: MatchResult }
  | { readonly type: 'REMATCH' }
  | { readonly type: 'REMATCH_ACCEPTED' }
  | { readonly type: 'REMATCH_TIMEOUT' }
  | { readonly type: 'HOME' };

/** A private game's code: `GD-` and four letters or digits (PRD US-02). */
export const GAME_CODE = /^GD-[A-Z0-9]{4}$/;

const inRange = (n: number) => Number.isInteger(n) && n >= 1 && n <= 10;

/** The bot presets set skill only; speed is chosen separately (PRD, "Match settings"). */
export const BOT_PRESETS = { Rookie: 2, Regular: 5, Pro: 8 } as const;

/**
 * The bot's name as players see it (UI language, "Voice and copy"): its preset, or its skill and
 * speed. A bot always reads as a bot (PRD, open question 5); no handle can, since a handle is two
 * words and a number (GD-TICKET-016).
 */
export function botName(bot: BotChoice): string {
  const preset = (Object.keys(BOT_PRESETS) as (keyof typeof BOT_PRESETS)[]).find(
    (name) => BOT_PRESETS[name] === bot.skill,
  );
  return `Bot · ${preset ?? `skill ${bot.skill}, speed ${bot.speed}`}`;
}

const INITIAL: AppContext = {
  mode: null,
  bot: null,
  opponent: null,
  code: null,
  result: null,
  countdownFor: 'start',
  match: 0,
  error: null,
  queued: false,
  waiting: 0,
  offered: false,
  matchId: null,
  token: null,
};

export const appMachine = setup({
  types: { context: {} as AppContext, events: {} as AppEvent },
  guards: {
    validBot: ({ event }) =>
      event.type === 'PLAY_BOT' && inRange(event.bot.skill) && inRange(event.bot.speed),
    validCode: ({ event }) => event.type === 'JOIN' && GAME_CODE.test(event.code),
    hasResult: ({ context }) => context.result !== null && context.mode !== null,
    queued: ({ context }) => context.queued,
    notOffered: ({ context }) => !context.offered,
  },
  actions: {
    reset: assign(({ context }) => ({ ...INITIAL, match: context.match })),
    startBot: assign(({ context, event }) =>
      event.type === 'PLAY_BOT'
        ? {
            mode: 'bot' as const,
            bot: event.bot,
            opponent: botName(event.bot),
            result: null,
            countdownFor: 'start' as const,
            match: context.match + 1,
            error: null,
          }
        : {},
    ),
    startMatch: assign(({ context, event }) =>
      event.type === 'MATCHED' || event.type === 'BOTH_READY'
        ? {
            opponent: event.opponent,
            result: null,
            countdownFor: 'start' as const,
            match: context.match + 1,
            ...(event.type === 'MATCHED'
              ? {
                  mode: 'quick' as const,
                  matchId: event.matchId,
                  token: event.token,
                  queued: false,
                }
              : {}),
          }
        : {},
    ),
    waiting: assign(({ event }) => (event.type === 'WAITING' ? { waiting: event.count } : {})),
    rematch: assign(({ context }) => ({
      result: null,
      countdownFor: 'start' as const,
      match: context.match + 1,
    })),
    resume: assign({ countdownFor: 'resume' as const }),
    keepResult: assign(({ event }) => (event.type === 'ENDED' ? { result: event.result } : {})),
    lobbyError: assign(({ event }) =>
      event.type === 'LOBBY_ERROR' ? { ...INITIAL, error: event.error } : {},
    ),
  },
}).createMachine({
  id: 'app',
  initial: 'home',
  context: INITIAL,
  // The pool's count, and a pairing that ends a bot game played while waiting (PRD US-01).
  on: {
    WAITING: { actions: 'waiting' },
    MATCHED: { guard: 'queued', target: '.countdown', actions: 'startMatch' },
    // Whatever name the rival came with, a bot reads as a bot.
    RIVAL_BOT: {
      guard: ({ event }) =>
        event.type === 'RIVAL_BOT' && inRange(event.bot.skill) && inRange(event.bot.speed),
      actions: assign(({ event }) =>
        event.type === 'RIVAL_BOT' ? { opponent: botName(event.bot) } : {},
      ),
    },
  },
  states: {
    home: {
      on: {
        QUICK_MATCH: {
          target: 'searching',
          actions: assign({ mode: 'quick', error: null, queued: true, offered: false, waiting: 0 }),
        },
        PLAY_BOT: { guard: 'validBot', target: 'countdown', actions: 'startBot' },
        CREATE_GAME: { target: 'lobby', actions: assign({ mode: 'private', error: null }) },
        JOIN: {
          guard: 'validCode',
          target: 'lobby',
          actions: assign(({ event }) => ({
            mode: 'private' as const,
            code: event.code,
            error: null,
          })),
        },
      },
    },
    searching: {
      // Nobody after 20 s: offer a bot to play while waiting, once a search (PRD US-01).
      after: { 20_000: { guard: 'notOffered', target: 'botOffer' } },
      on: {
        CANCEL: { target: 'home', actions: 'reset' },
        BOT_OFFER: 'botOffer',
      },
    },
    botOffer: {
      entry: assign({ offered: true }),
      on: {
        // Either choice keeps the player in the pool (PRD US-01).
        PLAY_BOT: { guard: 'validBot', target: 'countdown', actions: 'startBot' },
        KEEP_WAITING: 'searching',
        CANCEL: { target: 'home', actions: 'reset' },
      },
    },
    lobby: {
      on: {
        BOTH_READY: { target: 'countdown', actions: 'startMatch' },
        LEAVE: { target: 'home', actions: 'reset' },
        LOBBY_ERROR: { target: 'home', actions: 'lobbyError' },
      },
    },
    countdown: {
      on: {
        GO: 'playing',
        ENDED: { target: 'result', actions: 'keepResult' },
      },
    },
    playing: {
      on: {
        PAUSED: 'paused',
        ENDED: { target: 'result', actions: 'keepResult' },
      },
    },
    paused: {
      on: {
        RESUMED: { target: 'countdown', actions: 'resume' },
        ENDED: { target: 'result', actions: 'keepResult' },
      },
    },
    result: {
      on: {
        REMATCH: { guard: 'hasResult', target: 'rematch' },
        HOME: { target: 'home', actions: 'reset' },
      },
    },
    rematch: {
      on: {
        REMATCH_ACCEPTED: { target: 'countdown', actions: 'rematch' },
        REMATCH_TIMEOUT: { target: 'home', actions: 'reset' },
        HOME: { target: 'home', actions: 'reset' },
      },
    },
  },
});

export type AppState = ReturnType<typeof appMachine.getInitialSnapshot>['value'];
