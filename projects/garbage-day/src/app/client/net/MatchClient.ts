import { ClientMatch, type ClientMessage, type PlayerEvent } from '@garbage-day/engine';
import {
  encodeClientToMatch,
  isFinalClose,
  parseMatchToClient,
  type BotMark,
  type MatchToClient,
} from '@garbage-day/protocol';
import type { Connect } from './link';
import { Socket, type SocketStatus } from './Socket';

// One seat of a match played through the Match DO (GD-STORY-011): the engine's `ClientMatch`,
// fed by a socket that comes back on its own. When the connection drops, the player freezes; on
// the new socket the client says hello again and rejoins (GD-TICKET-013). A person's
// `OnlineSession` runs one, and so does a bot's worker (GD-STORY-015), so both play the same way.

/** Where a seat is: the socket to its match, and the join token that takes it. */
export interface SeatTicket {
  readonly connect: Connect;
  readonly token: string;
}

/** What the referee says, as the match hears it: not the socket's `pong`, `lobby` or `error`. */
export type RefereeMessage = Exclude<MatchToClient, { type: 'pong' | 'lobby' | 'error' }>;

/** The connection, as a player sees it. */
export type LinkState = 'online' | 'reconnecting' | 'lost';

export interface MatchClientOptions {
  /** The handle sent in `hello`. */
  readonly handle: string;
  /** A bot says so in `hello`, with its settings (GD-TICKET-016). */
  readonly bot?: BotMark;
  /** Events from this player's simulation. */
  readonly onPlayerEvent?: (ev: PlayerEvent) => void;
  /** Each message from the referee, before the match takes it. */
  readonly onHeard?: (msg: RefereeMessage) => void;
  /** Each message the match sends, before the socket takes it. */
  readonly onSent?: (msg: ClientMessage) => void;
  /** The connection dropped, came back, or was lost. */
  readonly onLink?: (state: LinkState) => void;
}

/** The longest absence a `rejoin` can report (the protocol's bound on `awayMs`). */
const MAX_AWAY_MS = 1_000_000;

export class MatchClient {
  readonly match: ClientMatch;
  link: LinkState = 'online';
  private socket: Socket | null = null;
  /** When the connection dropped, in ms, for the rejoin's `awayMs`. */
  private droppedAt: number | null = null;

  constructor(private readonly o: MatchClientOptions) {
    this.match = new ClientMatch({
      send: (msg) => {
        o.onSent?.(msg);
        this.socket?.send(encodeClientToMatch(msg));
      },
      ...(o.onPlayerEvent ? { onPlayerEvent: o.onPlayerEvent } : {}),
    });
  }

  /**
   * Opens the socket to the seat and says hello. Callers start it once their screen or worker is
   * up, not in a constructor a render may run twice, so only one socket ever takes the seat.
   */
  start(seat: SeatTicket): void {
    if (this.socket) return;
    const socket = new Socket(
      seat.connect,
      {
        open: (again) => {
          const { handle, bot } = this.o;
          socket.send(
            encodeClientToMatch({
              type: 'hello',
              token: seat.token,
              handle,
              ...(bot ? { bot } : {}),
            }),
          );
          if (again) {
            const away = this.droppedAt === null ? 0 : Date.now() - this.droppedAt;
            this.match.rejoin(Math.min(Math.max(0, away), MAX_AWAY_MS));
          }
          this.droppedAt = null;
        },
        message: (text) => this.heard(text),
        status: (status) => this.status(status),
      },
      // A close the server meant is final, and so is any once the match has a result.
      { final: (code) => isFinalClose(code) || this.match.result !== null },
    );
    this.socket = socket;
    socket.start();
  }

  /** There is no seat to take (the match couldn't be made): the connection is lost from the start. */
  fail(): void {
    this.setLink('lost');
  }

  /** Leaves the match: tells the referee, then closes the socket. */
  leave(): void {
    if (!this.match.result) this.match.send({ type: 'leave' });
    this.close();
  }

  /** Closes the socket for good. */
  close(): void {
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }

  private heard(text: string): void {
    const r = parseMatchToClient(text);
    if (!r.ok) return;
    const msg = r.msg;
    if (msg.type === 'pong' || msg.type === 'lobby' || msg.type === 'error') return;
    this.o.onHeard?.(msg);
    this.match.receive(
      msg,
      msg.type === 'start'
        ? { ...(msg.you === undefined ? {} : { you: msg.you }), holes: msg.holes ?? 0 }
        : {},
    );
  }

  /** The socket dropped, came back, or gave up. */
  private status(status: SocketStatus): void {
    if (status === 'reconnecting') {
      this.droppedAt ??= Date.now();
      this.match.drop();
      this.setLink('reconnecting');
    } else if (status === 'closed') {
      // Closed by `close()`, or by the match ending, is not a lost connection.
      const lost = this.socket !== null && !this.match.result;
      if (lost) this.match.drop();
      this.setLink(lost ? 'lost' : 'online');
    } else if (status === 'open') {
      this.setLink('online');
    }
  }

  private setLink(state: LinkState): void {
    this.link = state;
    this.o.onLink?.(state);
  }
}
