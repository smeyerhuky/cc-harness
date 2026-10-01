import { botMatch, type BotMark, type BotMatch } from '@garbage-day/protocol';
import { socketUrl, webSocketLink } from '../net/link';
import type { OnlineSession } from '../state/OnlineSession';
import type { BotJob } from './bot.worker';

// Playing a bot (GD-STORY-015; kb/design/architecture.md, "Bots"): the Worker opens a match for
// a player and a bot, the bot's Web Worker takes one seat, and the player's session the other.
// The page draws the match and never runs the bot.

/** Asks the Worker for a bot match: its id and both seats' tokens. */
async function createBotMatch(): Promise<BotMatch> {
  const res = await fetch('/api/bot-matches', { method: 'POST' });
  if (!res.ok) throw new Error(`No bot match: ${res.status}`);
  return botMatch.parse(await res.json());
}

/** Starts the bot's worker on its seat; returns what ends it. */
function startBot(job: BotJob): () => void {
  const worker = new Worker(new URL('./bot.worker.ts', import.meta.url), {
    type: 'module',
    name: 'bot',
  });
  worker.postMessage(job);
  return () => worker.terminate();
}

/**
 * The bot match each session plays. A screen's effect may run twice for one session (React's
 * strict mode does), and the second run takes the match the first asked for, not another.
 */
const matches = new WeakMap<OnlineSession, Promise<BotMatch>>();

/**
 * Plays a bot match on `session`: makes the match, starts the bot on its seat and the session on
 * the other. Returns what ends it: the player leaves, so the referee ends the match, and the
 * bot's worker goes. Without a match, the session reads as having lost its connection.
 */
export function playBot(session: OnlineSession, bot: BotMark): () => void {
  let gone = false;
  let stopBot: (() => void) | null = null;
  const made = matches.get(session) ?? createBotMatch();
  matches.set(session, made);
  made.then(
    (m) => {
      if (gone) return;
      const url = socketUrl(`/ws/match/${m.matchId}`, globalThis.location);
      stopBot = startBot({ url, token: m.botToken, bot });
      session.start({ connect: webSocketLink(url), token: m.token });
    },
    () => {
      if (!gone) session.fail();
    },
  );
  return () => {
    gone = true;
    session.leave();
    stopBot?.();
  };
}
