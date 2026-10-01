// The WebSocket close codes the Durable Objects close with, and which of them a client should
// take as final rather than reconnect after (GD-TICKET-013). Any other close, a dropped
// connection's 1006 or a restart's 1001 among them, is worth reconnecting after.

export const CLOSE = {
  /** Done: paired, left the queue, or answered a client that closed. */
  done: 1000,
  /** Too many refused messages: the message guard gave up on the connection. */
  refused: 1008,
  /** A newer connection took this seat, in another tab or after a reconnect. */
  replaced: 4000,
  /** The token seats nobody in this match. */
  badToken: 4001,
  /**
   * The match isn't running any more: its Durable Object restarted and lost it. Restoring a
   * match from its snapshot comes with M4.
   */
  gone: 4002,
} as const;

const FINAL: ReadonlySet<number> = new Set(Object.values(CLOSE));

/** Whether a client should stay closed after the server closed it with `code`. */
export const isFinalClose = (code: number): boolean => FINAL.has(code);
