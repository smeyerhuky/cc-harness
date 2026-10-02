import { Bot, botConfig, TPS } from '@garbage-day/engine';
import type { BotMark } from '@garbage-day/protocol';
import { MatchClient, type SeatTicket } from '../net/MatchClient';

// The bot as a second client (GD-STORY-015; kb/design/architecture.md, "Bots"): the engine's
// `Bot` steering a `MatchClient`, which takes its seat at the Match DO as a person's does, says
// it is a bot in its `hello`, and rejoins the same way after a drop. The page runs it in a Web
// Worker (bot.worker.ts), so none of its thinking is on the page's thread; tests run it as is.

export interface BotRun {
  /** The bot's seat: the socket to the match, and the bot's join token. */
  readonly seat: SeatTicket;
  readonly bot: BotMark;
  /** Seeds the bot's own choices: its noise and its thinking time. */
  readonly seed: number;
  /** A match has a result; the bot asks for a rematch (GD-STORY-014). */
  readonly onEnd?: () => void;
  /** The bot has stopped: nobody answered its rematch in time. */
  readonly onStop?: () => void;
}

/**
 * The handle a bot says hello with. Nobody sees it: the Match DO tells the other player the
 * rival is a bot, and their screen names it from its settings (GD-TICKET-016).
 */
const BOT_HANDLE = 'Steady Bot 1';

const TICK_MS = 1000 / TPS;
/** A stalled worker catches up at most this much at once, as the page's session does. */
const MAX_CATCH_UP_MS = 250;

/**
 * Plays the seat at the engine's 60 Hz. At each result it asks for a rematch, as a person who
 * presses Rematch does, and plays the next match if the other player agrees in time; otherwise
 * it stops. Returns a stop.
 */
export function runBot(run: BotRun): () => void {
  let last = performance.now();
  let acc = 0;
  let asked = false;
  const client = new MatchClient({
    handle: BOT_HANDLE,
    bot: run.bot,
    onRenew: () => {
      asked = false;
      acc = 0;
      last = performance.now();
    },
    onRematchLapsed: () => {
      stop();
      run.onStop?.();
    },
  });
  const stop = () => {
    clearInterval(loop);
    client.close();
  };
  // Twice a tick, so each wake steps at most one tick and the bot's moves stay evenly spaced.
  const loop = setInterval(() => {
    // The bot drives its player from the moment `start` makes it. A rematch renews the match.
    const { match } = client;
    if (match.me && !match.controller) {
      match.controller = new Bot(match.me, run.seed, botConfig(run.bot.skill, run.bot.speed));
    }
    const now = performance.now();
    acc += Math.min(now - last, MAX_CATCH_UP_MS);
    last = now;
    if (match.result) {
      acc = 0;
      if (!asked) {
        asked = true;
        run.onEnd?.();
        client.rematch();
      }
      return;
    }
    for (; acc >= TICK_MS; acc -= TICK_MS) match.step();
  }, TICK_MS / 2);
  client.start(run.seat);
  return stop;
}
