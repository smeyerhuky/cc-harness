import {
  CLOSE,
  DEFAULT_SETTINGS,
  encodeLobbyToClient,
  parseClientToLobby,
  type ClientToLobby,
  type LobbyToClient,
} from '@garbage-day/protocol';
import type { GuardLimits } from './guard';
import { newMatchId, newToken } from './ids';
import { SocketDO, type RefusalCode } from './sockets';

// The quick-match queue (kb/design/architecture.md, "Components"; GD-STORY-009): first come,
// first served. Each waiting player's place is kept on their socket, so the pool outlives the
// DO hibernating while everyone waits. Two waiting players are paired at once: a fresh match id
// and two join tokens, the Match DO opened with them, and each player told where to go.

/** The lobby hears a `queue` and a `cancel` (pings are answered without it). */
const LOBBY_LIMITS: GuardLimits = { rate: 2, burst: 5, strikes: 10 };

/** A waiting player: their handle and when they joined, kept on their socket. */
interface Waiting {
  readonly handle: string;
  readonly since: number;
}

const isWaiting = (a: unknown): a is Waiting =>
  typeof a === 'object' && a !== null && typeof (a as Waiting).handle === 'string';

export class LobbyDO extends SocketDO<ClientToLobby> {
  protected readonly limits = LOBBY_LIMITS;

  protected parse(text: string) {
    return parseClientToLobby(text);
  }

  protected encodeError(code: RefusalCode, message: string): string {
    return encodeLobbyToClient({ type: 'error', code, message });
  }

  health(): 'ok' {
    return 'ok';
  }

  /** How many are waiting (RPC: tests). */
  waiting(): number {
    return this.pool().length;
  }

  protected async received(ws: WebSocket, msg: ClientToLobby): Promise<void> {
    if (msg.type === 'queue') {
      if (!isWaiting(ws.deserializeAttachment())) {
        ws.serializeAttachment({ handle: msg.handle, since: Date.now() } satisfies Waiting);
      }
      await this.pair();
    } else if (msg.type === 'cancel') {
      ws.serializeAttachment(null);
      ws.close(CLOSE.done, 'Left the queue');
    }
    this.announce();
  }

  override webSocketClose(ws: WebSocket): void {
    super.webSocketClose(ws);
    this.announce();
  }

  /** The waiting players, longest-waiting first. */
  private pool(): [WebSocket, Waiting][] {
    const out: [WebSocket, Waiting][] = [];
    for (const ws of this.ctx.getWebSockets()) {
      const a: unknown = ws.deserializeAttachment();
      if (isWaiting(a) && ws.readyState === WebSocket.OPEN) out.push([ws, a]);
    }
    return out.sort((x, y) => x[1].since - y[1].since);
  }

  /** Pairs the two who have waited longest, while there are two. */
  private async pair(): Promise<void> {
    for (let pool = this.pool(); pool.length >= 2; pool = this.pool()) {
      const [[a, wa], [b, wb]] = pool as [[WebSocket, Waiting], [WebSocket, Waiting]];
      // Out of the pool before the Match DO is asked, so nothing pairs them twice meanwhile.
      a.serializeAttachment(null);
      b.serializeAttachment(null);
      const tokens = [newToken(), newToken()] as const;
      let matchId = newMatchId('Q');
      while (
        !(await this.env.MATCH.getByName(matchId).open({ tokens, settings: DEFAULT_SETTINGS }))
      )
        matchId = newMatchId('Q');
      this.tell(a, { type: 'matched', matchId, token: tokens[0], opponent: wb.handle });
      this.tell(b, { type: 'matched', matchId, token: tokens[1], opponent: wa.handle });
      a.close(CLOSE.done, 'Paired');
      b.close(CLOSE.done, 'Paired');
    }
  }

  /** Tells everyone waiting how many are waiting. */
  private announce(): void {
    const pool = this.pool();
    for (const [ws] of pool) this.tell(ws, { type: 'waiting', count: pool.length });
  }

  private tell(ws: WebSocket, msg: LobbyToClient): void {
    ws.send(encodeLobbyToClient(msg));
  }
}
