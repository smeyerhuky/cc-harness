import type { BotMark } from '@garbage-day/protocol';
import { webSocketLink } from '../net/link';
import { runBot } from './botClient';

// The bot's Web Worker (GD-STORY-015): the page posts the bot's seat and settings once, and the
// worker plays the match through its own socket, asks for a rematch at each result, and closes
// when nobody answers. The page never steps the bot.

/** What the page posts: the bot's socket URL and join token, and its settings. */
export interface BotJob {
  readonly url: string;
  readonly token: string;
  readonly bot: BotMark;
}

globalThis.addEventListener(
  'message',
  (e: MessageEvent<BotJob>) => {
    const { url, token, bot } = e.data;
    runBot({
      seat: { connect: webSocketLink(url), token },
      bot,
      // The bot's choices need no secret, only variety from one match to the next.
      seed: Math.floor(Math.random() * 2 ** 32),
      onStop: () => globalThis.close(),
    });
  },
  { once: true },
);
