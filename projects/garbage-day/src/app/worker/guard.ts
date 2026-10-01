import type { ParseResult, ProtocolErrorCode } from '@garbage-day/protocol';

// Every message a socket sends passes this guard before its Durable Object acts on it
// (kb/design/architecture.md, "Limits"; GD-TICKET-028). The rate comes first, so a flood costs
// no parsing; then the protocol's schema, which also refuses an attack worth more than its clear;
// then the lock rate. A socket that keeps sending what the guard refuses is closed.

/** How much a socket may send, and how much refusal it gets before it is closed. */
export interface GuardLimits {
  /** Messages a second, sustained. */
  readonly rate: number;
  /** The most messages at once, after a quiet spell. */
  readonly burst: number;
  /** Locks a second, sustained and at once (the Match DO only). */
  readonly locks?: number;
  /** Refusals drain at one a second; at this many pending, the socket is closed. */
  readonly strikes: number;
}

/** Why a message was refused: the protocol's reasons, too fast, or too many locks. */
export type RefusalReason = ProtocolErrorCode | 'binary' | 'rate' | 'locks';

export type Verdict<T> =
  | { readonly ok: true; readonly msg: T }
  | {
      readonly ok: false;
      readonly reason: RefusalReason;
      readonly detail: string;
      /** Tell the client: the first refusal, then at most one a second. */
      readonly notify: boolean;
      /** Close the socket: it has kept failing. */
      readonly close: boolean;
    };

/** A token bucket: `capacity` tokens, refilled at `perSecond`; time in ms. */
class Bucket {
  private tokens: number;
  private last: number | null = null;

  constructor(
    private readonly perSecond: number,
    private readonly capacity: number,
  ) {
    this.tokens = capacity;
  }

  private refill(now: number): void {
    if (this.last !== null) {
      const gained = ((now - this.last) / 1000) * this.perSecond;
      this.tokens = Math.min(this.capacity, this.tokens + gained);
    }
    this.last = now;
  }

  take(now: number): boolean {
    this.refill(now);
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/** A leaky counter of refusals: up on each, down one a second. */
class Strikes {
  private pending = 0;
  private last: number | null = null;

  add(now: number): number {
    if (this.last !== null) this.pending = Math.max(0, this.pending - (now - this.last) / 1000);
    this.last = now;
    this.pending += 1;
    return this.pending;
  }
}

export class MessageGuard<T extends { readonly type: string }> {
  private readonly rate: Bucket;
  private readonly locks: Bucket | null;
  private readonly strikes = new Strikes();
  private lastNotice = -Infinity;

  constructor(
    private readonly parse: (text: string) => ParseResult<T>,
    private readonly limits: GuardLimits,
  ) {
    this.rate = new Bucket(limits.rate, limits.burst);
    this.locks = limits.locks ? new Bucket(limits.locks, limits.locks) : null;
  }

  /** Judges one message, received at `now` (ms). */
  check(data: string | ArrayBuffer, now: number): Verdict<T> {
    if (!this.rate.take(now)) return this.refuse('rate', 'Too many messages', now);
    if (typeof data !== 'string') return this.refuse('binary', 'Text messages only', now);
    const r = this.parse(data);
    if (!r.ok) return this.refuse(r.error.code, r.error.message, now);
    if (r.msg.type === 'lock' && this.locks && !this.locks.take(now)) {
      return this.refuse('locks', 'Too many locks', now);
    }
    return { ok: true, msg: r.msg };
  }

  private refuse(reason: RefusalReason, detail: string, now: number): Verdict<T> {
    const close = this.strikes.add(now) >= this.limits.strikes;
    const notify = now - this.lastNotice >= 1000;
    if (notify) this.lastNotice = now;
    return { ok: false, reason, detail, notify, close };
  }
}
