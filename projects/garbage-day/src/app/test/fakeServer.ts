import {
  DEFAULT_RULES,
  Referee,
  TPS,
  type PlayerIndex,
  type ServerMessage,
} from '@garbage-day/engine';
import {
  encodeMatchToClient,
  parseClientToMatch,
  PING,
  PONG,
  type BotMark,
  type ClientToMatch,
  type MatchToClient,
} from '@garbage-day/protocol';
import { vi } from 'vitest';
import type { BotJob } from '../client/bot/bot.worker';
import { runBot } from '../client/bot/botClient';
import { webSocketLink } from '../client/net/link';

// The server side of a bot match, in the test's own page (GD-STORY-015): `POST /api/bot-matches`
// opens a match, sockets to `/ws/match/<id>` are seated by token and refereed by the engine's
// `Referee` on the wall clock, as the Match DO does, and the bot's "worker" runs the same
// `runBot` the real worker runs, beside the page. Any other socket (the lobby) never opens, so
// nobody else is ever waiting. The Worker tests cover the real Match DO.

/** The referee's clock, as the Match DO keeps it: 60 ticks a second from the start. */
const STEP_MS = 1000 / TPS;

/** One match, as the Match DO runs it: seats, the referee, its clock. */
class FakeMatch {
  readonly seats: (FakeSocket | null)[] = [null, null];
  /** What each seat's `hello` said it was. */
  readonly bots: (BotMark | null)[] = [null, null];
  /** Every message the match accepted, by seat. */
  readonly heard: { seat: PlayerIndex; msg: ClientToMatch }[] = [];
  referee: Referee | null = null;
  private t0 = 0;
  private tick = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    readonly id: string,
    readonly tokens: readonly [string, string],
  ) {}

  /** Stops the clock, ended or not. */
  end(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  /** A seat leaves, as its `leave` would say. */
  leave(seat: PlayerIndex): void {
    this.referee?.onMessage(seat, { type: 'leave' }, this.catchUp());
  }

  receive(ws: FakeSocket, text: string): void {
    const seat = this.seats.indexOf(ws);
    // The auto-response: a pong, and a heartbeat the referee hears.
    if (text === PING) {
      ws.deliver(PONG);
      if (seat >= 0) this.referee?.onMessage(seat as PlayerIndex, { type: 'hb' }, this.catchUp());
      return;
    }
    const r = parseClientToMatch(text);
    if (!r.ok) throw r.error;
    const msg = r.msg;
    if (msg.type === 'hello') {
      const s = this.tokens.indexOf(msg.token);
      if (s !== 0 && s !== 1) return;
      this.seats[s]?.close(4000);
      this.seats[s] = ws;
      this.bots[s] = msg.bot ?? null;
      this.heard.push({ seat: s, msg });
      if (!this.referee && this.seats[0] && this.seats[1]) this.start();
      return;
    }
    if (seat < 0 || !this.referee) return;
    this.heard.push({ seat: seat as PlayerIndex, msg });
    if (msg.type === 'ready' || msg.type === 'settings') return;
    this.referee.onMessage(seat as PlayerIndex, msg, this.catchUp());
  }

  closed(ws: FakeSocket): void {
    const seat = this.seats.indexOf(ws);
    if (seat >= 0) this.seats[seat] = null;
  }

  private start(): void {
    const referee = new Referee(0x5eed, DEFAULT_RULES, {
      send: (to, msg) => this.send(to, msg),
      emit: () => undefined,
    });
    this.referee = referee;
    this.t0 = Date.now();
    referee.start(0);
    let lastClock = 0;
    this.timer = setInterval(() => {
      const t = this.catchUp();
      const { state, activeTicks } = referee;
      if (
        (state === 'playing' || state === 'paused' || state === 'resuming') &&
        t - lastClock >= TPS
      ) {
        lastClock = t;
        for (const s of [0, 1] as const)
          this.send(s, { type: 'clock', tick: t, active: activeTicks });
      }
      if (state === 'over') this.end();
    }, STEP_MS);
  }

  private catchUp(): number {
    const referee = this.referee;
    if (!referee) return 0;
    const t = Math.floor(((Date.now() - this.t0) * TPS) / 1000);
    while (this.tick < t) referee.tick(++this.tick);
    return this.tick;
  }

  private send(to: PlayerIndex, msg: ServerMessage): void {
    const rivalBot = this.bots[to === 0 ? 1 : 0];
    const out: MatchToClient =
      msg.type === 'start'
        ? { ...msg, holes: 7 + to, you: to, ...(rivalBot ? { rivalBot } : {}) }
        : msg;
    this.seats[to]?.deliver(encodeMatchToClient(out));
  }
}

/** The browser's WebSocket, as far as `webSocketLink` uses it, joined to a fake match. */
class FakeSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 3;
  readyState = FakeSocket.CONNECTING;
  private readonly match: FakeMatch | undefined;

  constructor(url: string) {
    super();
    const id = /\/ws\/match\/([^/]+)$/.exec(url)?.[1];
    this.match = id ? server?.matches.get(id) : undefined;
    // Only a match's socket opens: the lobby's waits for ever.
    if (this.match) {
      setTimeout(() => {
        if (this.readyState !== FakeSocket.CONNECTING) return;
        this.readyState = FakeSocket.OPEN;
        this.dispatchEvent(new Event('open'));
      });
    }
  }

  /** Sent while open, a message arrives even if the socket closes before it does. */
  send(text: string): void {
    if (this.readyState !== FakeSocket.OPEN) return;
    setTimeout(() => this.match?.receive(this, text));
  }

  close(code = 1000): void {
    if (this.readyState === FakeSocket.CLOSED) return;
    this.readyState = FakeSocket.CLOSED;
    // After whatever was sent before it.
    setTimeout(() => {
      this.match?.closed(this);
      this.dispatchEvent(Object.assign(new Event('close'), { code }));
    });
  }

  /** A message from the match. */
  deliver(text: string): void {
    setTimeout(() => {
      if (this.readyState === FakeSocket.OPEN) {
        this.dispatchEvent(Object.assign(new Event('message'), { data: text }));
      }
    });
  }
}

/** The bot's worker, run beside the page: the same `runBot` the real worker runs. */
class FakeWorker {
  static readonly made: FakeWorker[] = [];
  job: BotJob | null = null;
  terminated = false;
  private stop: (() => void) | null = null;

  constructor() {
    FakeWorker.made.push(this);
  }

  postMessage(job: BotJob): void {
    this.job = job;
    this.stop = runBot({
      seat: { connect: webSocketLink(job.url), token: job.token },
      bot: job.bot,
      seed: 1,
    });
  }

  terminate(): void {
    this.terminated = true;
    this.stop?.();
  }
}

interface FakeServer {
  readonly matches: Map<string, FakeMatch>;
  /** The bots' workers, in the order the page started them. */
  readonly workers: FakeWorker[];
  /** Opens a match, as `POST /api/bot-matches` does. */
  open(): FakeMatch;
  /** The newest match. */
  last(): FakeMatch;
  /** Stops every match's clock and every bot. */
  close(): void;
}

let server: FakeServer | null = null;

/**
 * Stands the fake server in for the network: `fetch` for `POST /api/bot-matches` (anything else
 * goes to the `fetch` already in place), `WebSocket` and `Worker`. `vi.unstubAllGlobals` undoes it.
 */
export function fakeServer(): FakeServer {
  const matches = new Map<string, FakeMatch>();
  FakeWorker.made.length = 0;
  const s: FakeServer = {
    matches,
    workers: FakeWorker.made,
    open: () => {
      const n = matches.size + 1;
      const id = `B-TEST${String(n).padStart(6, '0')}`;
      const m = new FakeMatch(id, [`player-token-${n}-000000`, `bot-token-${n}-0000000000`]);
      matches.set(id, m);
      return m;
    },
    last: () => {
      const m = [...matches.values()].at(-1);
      if (!m) throw new Error('no match made');
      return m;
    },
    close: () => {
      for (const m of matches.values()) m.end();
      for (const w of FakeWorker.made) w.terminate();
    },
  };
  server = s;
  const prior = globalThis.fetch;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (!url.endsWith('/api/bot-matches') || init?.method !== 'POST') return prior(input, init);
    const { id, tokens } = s.open();
    const body = JSON.stringify({ matchId: id, token: tokens[0], botToken: tokens[1] });
    return Promise.resolve(new Response(body, { headers: { 'content-type': 'application/json' } }));
  });
  vi.stubGlobal('WebSocket', FakeSocket);
  vi.stubGlobal('Worker', FakeWorker);
  return s;
}
