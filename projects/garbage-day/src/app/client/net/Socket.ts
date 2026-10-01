import type { Connect, Link } from './link';

// A connection that comes back (GD-TICKET-013): it opens a link, and when that link drops it
// opens another after a wait that doubles each time, with jitter, from 0.5 s to 8 s, until one
// opens and is heard from. A close the server meant (`final`) or `close()` ends it for good.

/** The waits between attempts, in ms: from the first retry to the longest. */
export const BACKOFF = { minMs: 500, maxMs: 8000 } as const;

/**
 * The wait before attempt `n` (0 for the first retry): 0.5 s doubling to 8 s, each drawn between
 * half and one and a half times that, so clients that dropped together don't return together.
 */
export function backoffMs(n: number, random: () => number = Math.random): number {
  const base = Math.min(BACKOFF.maxMs, BACKOFF.minMs * 2 ** Math.min(n, 8));
  return Math.round(Math.min(BACKOFF.maxMs, Math.max(BACKOFF.minMs, base * (0.5 + random()))));
}

export type SocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export interface SocketHandlers {
  /** A link opened: `again` when it replaces one that dropped. */
  open(again: boolean): void;
  message(text: string): void;
  /** The status changed; `code` is the close code that changed it, if one did. */
  status(status: SocketStatus, code?: number): void;
}

export interface SocketOptions {
  /** Close codes after which it gives up rather than reconnecting. */
  readonly final?: (code: number) => boolean;
  /** The jitter's source; tests pass their own. */
  readonly random?: () => number;
}

export class Socket {
  status: SocketStatus = 'connecting';
  private link: Link | null = null;
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private everOpen = false;

  constructor(
    private readonly connect: Connect,
    private readonly h: SocketHandlers,
    private readonly o: SocketOptions = {},
  ) {}

  /** Opens the first link. */
  start(): void {
    if (this.status === 'connecting' && !this.link) this.dial();
  }

  /** Sends `text` if a link is open; false if it wasn't sent. */
  send(text: string): boolean {
    if (this.status !== 'open' || !this.link) return false;
    this.link.send(text);
    return true;
  }

  /** Closes for good: no more links. */
  close(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    const link = this.link;
    this.link = null;
    link?.close();
    this.set('closed');
  }

  private dial(): void {
    const link = this.connect({
      open: () => {
        if (this.link !== link) return;
        const again = this.everOpen;
        this.everOpen = true;
        this.set('open');
        this.h.open(again);
      },
      message: (text) => {
        if (this.link !== link) return;
        // Heard from: this link works, so the next drop starts the waits from the shortest.
        this.attempt = 0;
        this.h.message(text);
      },
      close: (code) => {
        if (this.link !== link) return;
        this.link = null;
        this.dropped(code);
      },
    });
    this.link = link;
  }

  private dropped(code: number): void {
    if (this.status === 'closed') return;
    if (this.o.final?.(code)) {
      this.set('closed', code);
      return;
    }
    this.set('reconnecting', code);
    const wait = backoffMs(this.attempt++, this.o.random);
    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.status === 'reconnecting') this.dial();
    }, wait);
  }

  private set(status: SocketStatus, code?: number): void {
    if (this.status === status) return;
    this.status = status;
    this.h.status(status, code);
  }
}
