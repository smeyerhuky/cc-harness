import {
  DEFAULT_RULES,
  Referee,
  TPS,
  type PlayerIndex,
  type ServerMessage,
} from '@garbage-day/engine';
import {
  CLOSE,
  DEFAULT_SETTINGS,
  encodeMatchToClient,
  parseClientToMatch,
  PING,
  PONG,
  settingsToRules,
  type BotMark,
  type ClientToMatch,
  type JoinedGame,
  type MatchSettings,
  type MatchToClient,
} from '@garbage-day/protocol';
import { vi } from 'vitest';
import type { BotJob } from '../client/bot/bot.worker';
import { runBot } from '../client/bot/botClient';
import { webSocketLink } from '../client/net/link';

// The server side of bot matches and private games, in the test's own page (GD-STORY-015,
// GD-STORY-010). `POST /api/bot-matches` and `POST /api/games` open a match, and
// `POST /api/games/:code/join` hands out a private game's guest seat. Sockets to `/ws/match/<id>`
// are seated by token, held in a private game's lobby until both are ready, and refereed by the
// engine's `Referee` on the wall clock, as the Match DO does. The bot's "worker" runs the same
// `runBot` the real worker runs, beside the page. Any other socket (the lobby) never opens, so
// nobody else is ever waiting. The Worker tests cover the real Match DO.

/** The referee's clock, as the Match DO keeps it: 60 ticks a second from the start. */
const STEP_MS = 1000 / TPS;

/** One match, as the Match DO runs it: seats, a private game's lobby, the referee, its clock. */
class FakeMatch {
  readonly seats: (FakeSocket | null)[] = [null, null];
  /** What each seat's `hello` said it was. */
  readonly bots: (BotMark | null)[] = [null, null];
  readonly handles: [string | null, string | null] = [null, null];
  readonly ready: [boolean, boolean] = [false, false];
  /** Every message the match accepted, by seat. */
  readonly heard: { seat: PlayerIndex; msg: ClientToMatch }[] = [];
  referee: Referee | null = null;
  expired = false;
  private guest = false;
  private t0 = 0;
  private rematchWanted: [boolean, boolean] = [false, false];
  private rematchTimer: ReturnType<typeof setTimeout> | null = null;
  private tick = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    readonly id: string,
    readonly tokens: readonly [string, string],
    public settings: MatchSettings = DEFAULT_SETTINGS,
    /** A private game, which holds a lobby first. */
    readonly lobby = false,
  ) {}

  /** A private game's guest seat, once, as `POST /api/games/:code/join` answers. */
  join(): JoinedGame {
    if (this.expired) return { error: 'expired' };
    if (!this.lobby) return { error: 'none' };
    if (this.guest) return { error: 'full' };
    this.guest = true;
    return { token: this.tokens[1] };
  }

  /** Thirty minutes pass with nothing happening: an unstarted private game expires. */
  expire(): void {
    if (this.referee) return;
    this.expired = true;
    for (const ws of this.seats) if (ws) this.turnAway(ws);
  }

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
      if (this.expired) {
        this.turnAway(ws);
        return;
      }
      const s = this.tokens.indexOf(msg.token);
      if (s !== 0 && s !== 1) return;
      this.seats[s]?.close(CLOSE.replaced);
      this.seats[s] = ws;
      this.bots[s] = msg.bot ?? null;
      this.handles[s] = msg.handle;
      this.heard.push({ seat: s, msg });
      if (this.referee) return;
      if (this.lobby) this.tellLobby();
      else if (this.seats[0] && this.seats[1]) this.start();
      return;
    }
    if (seat < 0) return;
    this.heard.push({ seat: seat as PlayerIndex, msg });
    if (msg.type === 'ready' || msg.type === 'settings') {
      if (this.referee || !this.lobby) return;
      if (msg.type === 'ready') this.ready[seat] = true;
      else if (seat === 0) {
        this.settings = msg.settings;
        this.ready.fill(false);
      } else return;
      this.tellLobby();
      return;
    }
    if (msg.type === 'rematch') {
      this.onRematch(seat as PlayerIndex);
      return;
    }
    this.referee?.onMessage(seat as PlayerIndex, msg, this.catchUp());
  }

  private onRematch(seat: PlayerIndex): void {
    if (!this.referee || this.referee.state !== 'over') return;
    this.rematchWanted[seat] = true;
    for (const s of [0, 1] as const) {
      if (s !== seat && this.seats[s])
        this.seats[s]?.deliver(encodeMatchToClient({ type: 'rematch' }));
    }
    if (this.rematchWanted[0] && this.rematchWanted[1]) {
      if (this.rematchTimer) clearTimeout(this.rematchTimer);
      this.rematchTimer = null;
      this.rematchWanted = [false, false];
      for (const s of [0, 1] as const)
        this.seats[s]?.deliver(encodeMatchToClient({ type: 'agreed' }));
      this.start();
    } else if (!this.rematchTimer) {
      this.rematchTimer = setTimeout(() => {
        this.rematchTimer = null;
        this.rematchWanted = [false, false];
      }, 30000);
    }
  }

  closeRematch(): void {
    if (this.rematchTimer) {
      clearTimeout(this.rematchTimer);
      this.rematchTimer = null;
      this.rematchWanted = [false, false];
    }
  }

  closed(ws: FakeSocket): void {
    const seat = this.seats.indexOf(ws);
    if (seat < 0) return;
    this.seats[seat] = null;
    // Leaving a lobby takes back a Ready.
    if (this.lobby && !this.referee && this.ready[seat]) {
      this.ready[seat] = false;
      this.tellLobby();
    }
  }

  private turnAway(ws: FakeSocket): void {
    ws.deliver(encodeMatchToClient({ type: 'error', code: 'expired', message: 'Expired' }));
    setTimeout(() => ws.close(CLOSE.gone));
  }

  /** Tells both players the lobby, and starts the match once both are there and ready. */
  private tellLobby(): void {
    for (const you of [0, 1] as const) {
      const msg: MatchToClient = {
        type: 'lobby',
        handles: [...this.handles],
        settings: this.settings,
        ready: [...this.ready],
        you,
      };
      this.seats[you]?.deliver(encodeMatchToClient(msg));
    }
    if (this.ready[0] && this.ready[1] && this.seats[0] && this.seats[1]) this.start();
  }

  private start(): void {
    const rules = { ...DEFAULT_RULES, ...settingsToRules(this.settings) };
    const referee = new Referee(0x5eed, rules, {
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
        ? {
            ...msg,
            settings: this.settings,
            holes: 7 + to,
            you: to,
            ...(rivalBot ? { rivalBot } : {}),
          }
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
  /** Opens a bot match, as `POST /api/bot-matches` does, on the defaults unless told. */
  open(settings?: MatchSettings): FakeMatch;
  /** Opens a private game, as `POST /api/games` does. */
  openGame(settings?: MatchSettings): FakeMatch;
  /** The newest match. */
  last(): FakeMatch;
  closeRematch(): void;
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
    open: (settings = DEFAULT_SETTINGS) => {
      const n = matches.size + 1;
      const id = `B-TEST${String(n).padStart(6, '0')}`;
      const tokens = [`player-token-${n}-000000`, `bot-token-${n}-0000000000`] as const;
      const m = new FakeMatch(id, tokens, settings);
      matches.set(id, m);
      return m;
    },
    openGame: (settings = DEFAULT_SETTINGS) => {
      const n = matches.size + 1;
      const code = `GD-T${String(n).padStart(3, '0')}`;
      const tokens = [`host-token-${n}-000000000`, `guest-token-${n}-00000000`] as const;
      const m = new FakeMatch(code, tokens, settings, true);
      matches.set(code, m);
      return m;
    },
    last: () => {
      const m = [...matches.values()].at(-1);
      if (!m) throw new Error('no match made');
      return m;
    },
    closeRematch: () => {
      for (const m of matches.values()) m.closeRematch();
    },
    close: () => {
      for (const m of matches.values()) m.end();
      for (const w of FakeWorker.made) w.terminate();
    },
  };
  server = s;
  const prior = globalThis.fetch;
  const answer = (body: unknown, status = 200) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    );
  const REFUSED = { full: 409, expired: 410, none: 404 } as const;
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const post = init?.method === 'POST';
    if (post && url.endsWith('/api/bot-matches')) {
      const body = typeof init.body === 'string' ? init.body : '{}';
      const { settings } = JSON.parse(body) as { settings?: MatchSettings };
      const { id, tokens } = s.open(settings);
      return answer({ matchId: id, token: tokens[0], botToken: tokens[1] });
    }
    if (post && url.endsWith('/api/games')) {
      const body = typeof init.body === 'string' ? init.body : '{}';
      const { settings } = JSON.parse(body) as { settings: MatchSettings };
      const { id, tokens } = s.openGame(settings);
      return answer({ code: id, token: tokens[0] });
    }
    const join = post ? /\/api\/games\/([^/]+)\/join$/.exec(url)?.[1] : undefined;
    if (join !== undefined) {
      const joined = matches.get(join)?.join() ?? { error: 'none' };
      return answer(joined, 'error' in joined ? REFUSED[joined.error] : 200);
    }
    return prior(input, init);
  });
  vi.stubGlobal('WebSocket', FakeSocket);
  vi.stubGlobal('Worker', FakeWorker);
  return s;
}
