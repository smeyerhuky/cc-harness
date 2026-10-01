import { CLOSE, PING, PONG, type ParseResult } from '@garbage-day/protocol';
import { DurableObject } from 'cloudflare:workers';
import { MessageGuard, type GuardLimits, type RefusalReason } from './guard';

// What both Durable Objects do with a socket (kb/design/architecture.md, "Components"): accept it
// through the Hibernation API, so an idle match costs nothing; answer `ping` with `pong` by the
// auto-response, without waking; and put every other message through its own guard before the
// DO sees it (GD-TICKET-028).

/** The error codes a refusal is reported with; the protocol's `error` message carries them. */
export type RefusalCode = 'invalid' | 'version' | 'rate';

const codeFor = (r: RefusalReason): RefusalCode =>
  r === 'version' ? 'version' : r === 'rate' || r === 'locks' ? 'rate' : 'invalid';

/** What a DO has counted of its sockets' messages since it last woke. */
export type WireCounts = Readonly<Record<'accepted' | 'closed' | RefusalReason, number>>;

const zeroCounts = (): Record<keyof WireCounts, number> => ({
  accepted: 0,
  closed: 0,
  'too-large': 0,
  malformed: 0,
  version: 0,
  'unknown-type': 0,
  invalid: 0,
  binary: 0,
  rate: 0,
  locks: 0,
});

export abstract class SocketDO<T extends { readonly type: string }> extends DurableObject<Env> {
  /** The limits for each of this DO's sockets. */
  protected abstract readonly limits: GuardLimits;
  /** The protocol's parser for messages to this DO. */
  protected abstract parse(text: string): ParseResult<T>;
  /** The protocol's `error` message to this DO's clients. */
  protected abstract encodeError(code: RefusalCode, message: string): string;
  /** A message that passed the guard. */
  protected abstract received(ws: WebSocket, msg: T): void | Promise<void>;

  // A guard lives with its socket in memory. Hibernation drops it, which only happens to a
  // socket quiet for a while, so the next message starts a fresh guard with a full allowance.
  private readonly guards = new WeakMap<WebSocket, MessageGuard<T>>();
  /** Sockets this DO closed: what they had already sent still arrives, and is ignored. */
  private readonly closing = new WeakSet<WebSocket>();
  private readonly counts = zeroCounts();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair(PING, PONG));
  }

  override fetch(request: Request): Response {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('Expected a WebSocket upgrade', { status: 426 });
    }
    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  override async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    // A socket this DO has closed, by its guard or by its own logic: what was in flight is ignored.
    if (this.closing.has(ws) || ws.readyState !== WebSocket.OPEN) return;
    let guard = this.guards.get(ws);
    if (!guard) {
      guard = new MessageGuard((text) => this.parse(text), this.limits);
      this.guards.set(ws, guard);
    }
    const v = guard.check(data, Date.now());
    if (v.ok) {
      this.counts.accepted++;
      await this.received(ws, v.msg);
      return;
    }
    this.counts[v.reason]++;
    if (v.notify) ws.send(this.encodeError(codeFor(v.reason), v.detail.slice(0, 200)));
    if (v.close) {
      this.counts.closed++;
      this.closing.add(ws);
      ws.close(CLOSE.refused, 'Too many refused messages');
    }
  }

  /** The client closed its socket: answer, so it ends cleanly on both sides (RFC 6455). */
  override webSocketClose(ws: WebSocket): void {
    try {
      ws.close(1000, 'Closed');
    } catch {
      // Already closed: nothing to answer.
    }
  }

  /** The counts since this DO last woke (RPC: tests, and later the developer overlay). */
  wireCounts(): WireCounts {
    return { ...this.counts };
  }
}
