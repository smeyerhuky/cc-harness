import {
  DEFAULT_RULES,
  Referee,
  TPS,
  type PlayerIndex,
  type Seed128,
  type ServerMessage,
} from '@garbage-day/engine';
import {
  CLOSE,
  encodeMatchToClient,
  parseClientToMatch,
  settingsToRules,
  type BotMark,
  type ClientToMatch,
  type JoinedGame,
  type MatchSettings,
  type MatchToClient,
} from '@garbage-day/protocol';
import type { GuardLimits } from './guard';
import { SocketDO, type RefusalCode } from './sockets';

// One match, quick, bot or private (kb/design/architecture.md, "Components"; GD-STORY-011).
// Whoever creates the match (the Lobby DO for a quick match, the Worker for a bot match or a
// private game) opens it with two join tokens. Each player's socket says `hello` with one, which
// seats it; with both seats taken the referee starts, on a seed that never leaves this object
// (PRD US-06). A private game first holds a lobby: the host's settings, both handles, and a
// Ready from each; it expires after 30 minutes with nothing happening (GD-STORY-010). The
// referee is the engine's, as in a local match: this object only carries its messages and keeps
// its clock.

/**
 * A player sends `pos` at most 15 times a second and a `lock`, with any `attack`, per piece; the
 * busiest golden replay averages under 15 messages a second a player. 40 a second, in bursts of
 * 60, is well over anything a real client sends, and caps what a flood makes the DO parse. Locks
 * are capped at 20 a second, as the architecture's trust rules say.
 */
export const MATCH_LIMITS: GuardLimits = { rate: 40, burst: 60, locks: 20, strikes: 20 };

/** What a match is opened with. */
interface MatchSetup {
  readonly tokens: readonly [string, string];
  /** A private game's host may change them in the lobby. */
  readonly settings: MatchSettings;
  /** A private game: the players meet in a lobby, and the match starts when both are ready. */
  readonly lobby?: boolean;
}

interface Seat {
  readonly seat: PlayerIndex;
  /** The handle its `hello` gave. */
  readonly handle: string;
  /** The seat is a bot, with these settings, as its `hello` said (GD-TICKET-016). */
  readonly bot?: BotMark;
}

/** A private game's lobby, kept in storage: the DO may sleep while the players wait. */
interface Lobby {
  /** Each seat's handle, once it has said hello. */
  readonly handles: [string | null, string | null];
  readonly ready: [boolean, boolean];
  /** The guest's token has been handed out, so a third visitor finds the game full. */
  readonly guest: boolean;
}

const NEW_LOBBY: Lobby = { handles: [null, null], ready: [false, false], guest: false };

/** A private game expires after this long with nothing happening in its lobby (PRD US-02). */
export const EXPIRY_MS = 30 * 60 * 1000;

const isSeat = (a: unknown): a is Seat =>
  typeof a === 'object' && a !== null && ((a as Seat).seat === 0 || (a as Seat).seat === 1);

const randomU32 = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

/** The dealing seed: 128 bits, so no player can work it out from the pieces they see. */
const randomSeed128 = (): Seed128 => {
  const [a = 0, b = 0, c = 0, d = 0] = crypto.getRandomValues(new Uint32Array(4));
  return [a, b, c, d];
};

/**
 * How often a running match's clock ticks the referee when no message wakes this object: it
 * notices a player gone silent while nobody sends anything, as during a pause, and it keeps this
 * object, and the referee in its memory, from hibernating meanwhile (GD-TICKET-013).
 */
const CLOCK_MS = 1000;

/** A running referee and the clock it runs on. */
interface Running {
  readonly referee: Referee;
  /** When tick 0 was, in ms since the epoch. */
  readonly t0: number;
  /** The last tick the referee has been told about. */
  tick: number;
  /** Each seat's garbage-hole seed, sent in its `start`. */
  readonly holes: readonly [number, number];
  /** The newest auto-response each seat has had, in ms, already passed on as a heartbeat. */
  readonly heard: [number, number];
  /** The clock between messages, until the match is over. */
  clock: ReturnType<typeof setInterval> | null;
}

export class MatchDO extends SocketDO<ClientToMatch> {
  protected readonly limits = MATCH_LIMITS;
  private setup: MatchSetup | null = null;
  private running: Running | null = null;
  private rematchWanted: [boolean, boolean] = [false, false];
  private rematchTimer: ReturnType<typeof setTimeout> | null = null;

  protected parse(text: string) {
    return parseClientToMatch(text);
  }

  protected encodeError(code: RefusalCode | 'bad-token' | 'expired', message: string): string {
    return encodeMatchToClient({ type: 'error', code, message });
  }

  health(): 'ok' {
    return 'ok';
  }

  /**
   * Opens the match for the two players holding `tokens` (RPC). False if it is already open: the
   * caller picks another id, as the Worker does when a private game's code is taken.
   */
  async open(setup: MatchSetup): Promise<boolean> {
    const taken = await this.ctx.storage.get(['setup', 'expired']);
    if (taken.size > 0) return false;
    await this.ctx.storage.put('setup', setup);
    this.setup = setup;
    if (setup.lobby) {
      await this.ctx.storage.put('lobby', NEW_LOBBY);
      await this.touch();
    }
    return true;
  }

  /**
   * Hands a visitor a private game's guest seat (RPC: the Worker's join route). The guest token
   * goes out once; after that the game is full. An expired game says so, and anything else that
   * isn't an open private game has no seat to give.
   */
  async join(): Promise<JoinedGame> {
    if (await this.ctx.storage.get('expired')) return { error: 'expired' };
    const setup = await this.loadSetup();
    const lobby = await this.ctx.storage.get<Lobby>('lobby');
    if (!setup?.lobby || !lobby) return { error: 'none' };
    if (lobby.guest) return { error: 'full' };
    await this.ctx.storage.put('lobby', { ...lobby, guest: true } satisfies Lobby);
    await this.touch();
    return { token: setup.tokens[1] };
  }

  /** Thirty minutes passed in a private game's lobby with nothing happening: it expires. */
  override async alarm(): Promise<void> {
    if (this.running || (await this.ctx.storage.get('started'))) return;
    for (const [, ws] of this.sockets()) this.expire(ws);
    await this.ctx.storage.deleteAll();
    await this.ctx.storage.put('expired', true);
    this.setup = null;
  }

  /** The match's state, for tests and the developer overlay (RPC). */
  state(): { readonly seated: readonly PlayerIndex[]; readonly referee: string | null } {
    return {
      seated: this.sockets().map(([seat]) => seat),
      referee: this.running?.referee.state ?? null,
    };
  }

  protected async received(ws: WebSocket, msg: ClientToMatch): Promise<void> {
    const seat: unknown = ws.deserializeAttachment();
    if (msg.type === 'hello') {
      await this.hello(ws, msg.token, msg.handle, msg.bot);
      return;
    }
    if (!isSeat(seat)) {
      this.refuse(ws, 'Say hello with your token first');
      return;
    }
    if (msg.type === 'ready' || msg.type === 'settings') {
      await this.inLobby(seat.seat, msg);
      return;
    }
    if (msg.type === 'rematch') {
      this.onRematch(seat.seat);
      return;
    }
    const run = this.running;
    if (!run) return;
    const t = this.catchUp(run);
    run.referee.onMessage(seat.seat, msg, t);
    this.settle(run);
  }

  private onRematch(seat: PlayerIndex): void {
    if (!this.running || this.running.referee.state !== 'over') return;
    this.rematchWanted[seat] = true;
    for (const [s, ws] of this.sockets()) {
      if (s !== seat) ws.send(encodeMatchToClient({ type: 'rematch' }));
    }
    if (this.rematchWanted[0] && this.rematchWanted[1]) {
      if (this.rematchTimer) clearTimeout(this.rematchTimer);
      this.rematchTimer = null;
      this.rematchWanted = [false, false];
      for (const [, ws] of this.sockets()) ws.send(encodeMatchToClient({ type: 'agreed' }));
      this.start();
    } else if (!this.rematchTimer) {
      this.rematchTimer = setTimeout(() => {
        this.rematchTimer = null;
        this.rematchWanted = [false, false];
      }, 30000);
    }
  }

  override webSocketClose(ws: WebSocket): void {
    super.webSocketClose(ws);
    this.ctx.waitUntil(this.leftLobby(ws));
  }

  /** A private game's player left the lobby: they are no longer ready. */
  private async leftLobby(ws: WebSocket): Promise<void> {
    const seat: unknown = ws.deserializeAttachment();
    if (!isSeat(seat) || this.running) return;
    const lobby = await this.ctx.storage.get<Lobby>('lobby');
    if (!lobby?.ready[seat.seat] || this.sockets().some(([s]) => s === seat.seat)) return;
    const ready: Lobby['ready'] = [...lobby.ready];
    ready[seat.seat] = false;
    await this.saveLobby({ ...lobby, ready });
  }

  private async loadSetup(): Promise<MatchSetup | null> {
    this.setup ??= (await this.ctx.storage.get<MatchSetup>('setup')) ?? null;
    return this.setup;
  }

  /** Something happened in a private game's lobby: its 30 minutes start again. */
  private async touch(): Promise<void> {
    if (this.setup?.lobby && !this.running) {
      await this.ctx.storage.setAlarm(Date.now() + EXPIRY_MS);
    }
  }

  /** `ready` and `settings`, which only a private game's lobby hears; only the host sets. */
  private async inLobby(seat: PlayerIndex, msg: ClientToMatch): Promise<void> {
    const setup = await this.loadSetup();
    const lobby = await this.ctx.storage.get<Lobby>('lobby');
    if (this.running || !setup?.lobby || !lobby) return;
    if (msg.type === 'ready') {
      const ready: Lobby['ready'] = [...lobby.ready];
      ready[seat] = true;
      await this.saveLobby({ ...lobby, ready });
    } else if (msg.type === 'settings' && seat === 0) {
      // New settings need both to agree again.
      this.setup = { ...setup, settings: msg.settings };
      await this.ctx.storage.put('setup', this.setup);
      await this.saveLobby({ ...lobby, ready: [false, false] });
    }
  }

  /** Keeps the lobby, tells both players, and starts the match once both are there and ready. */
  private async saveLobby(lobby: Lobby): Promise<void> {
    await this.ctx.storage.put('lobby', lobby);
    await this.touch();
    const setup = this.setup;
    if (!setup) return;
    const seated = this.sockets();
    for (const [you, ws] of seated) {
      const msg: MatchToClient = { type: 'lobby', ...lobby, settings: setup.settings, you };
      ws.send(encodeMatchToClient(msg));
    }
    if (lobby.ready[0] && lobby.ready[1] && seated.length === 2) {
      await this.ctx.storage.deleteAlarm();
      this.start();
    }
  }

  private expire(ws: WebSocket): void {
    ws.send(this.encodeError('expired', 'This game has expired'));
    ws.close(CLOSE.gone, 'Game expired');
  }

  private async hello(ws: WebSocket, token: string, handle: string, bot?: BotMark): Promise<void> {
    if (await this.ctx.storage.get('expired')) {
      this.expire(ws);
      return;
    }
    const setup = await this.loadSetup();
    const seat = setup?.tokens.indexOf(token);
    if (seat !== 0 && seat !== 1) {
      this.refuse(ws, 'That token seats nobody in this match');
      return;
    }
    for (const [s, other] of this.sockets()) {
      if (s === seat && other !== ws) other.close(CLOSE.replaced, 'Replaced by a newer connection');
    }
    // Started once, but the referee isn't here: this object restarted (a deploy, an eviction)
    // and lost it. Starting again would deal a second match over the first, so the player hears
    // it is gone. Restoring it from a snapshot comes with M4.
    if (!this.running && (await this.ctx.storage.get<boolean>('started'))) {
      ws.send(this.encodeError('expired', 'This match is no longer running'));
      ws.close(CLOSE.gone, 'Match gone');
      return;
    }
    ws.serializeAttachment((bot ? { seat, handle, bot } : { seat, handle }) satisfies Seat);
    if (this.running) return;
    if (setup?.lobby) {
      const lobby = (await this.ctx.storage.get<Lobby>('lobby')) ?? NEW_LOBBY;
      const handles: Lobby['handles'] = [...lobby.handles];
      handles[seat] = handle;
      await this.saveLobby({ ...lobby, handles });
    } else if (this.sockets().length === 2) this.start();
  }

  private refuse(ws: WebSocket, message: string): void {
    ws.send(this.encodeError('bad-token', message));
    ws.close(CLOSE.badToken, 'Bad token');
  }

  /** The seated sockets, by seat, with the seat's bot mark if it is a bot. */
  private sockets(): [PlayerIndex, WebSocket, BotMark | undefined][] {
    const out: [PlayerIndex, WebSocket, BotMark | undefined][] = [];
    for (const ws of this.ctx.getWebSockets()) {
      const a: unknown = ws.deserializeAttachment();
      if (isSeat(a) && ws.readyState === WebSocket.OPEN) out.push([a.seat, ws, a.bot]);
    }
    return out;
  }

  private start(): void {
    const setup = this.setup;
    if (!setup) return;
    const holes: [number, number] = [randomU32(), randomU32()];
    const referee = new Referee(
      randomSeed128(),
      { ...DEFAULT_RULES, ...settingsToRules(setup.settings) },
      {
        send: (to, msg) => this.send(to, msg),
        emit: () => undefined,
      },
    );
    const t0 = Date.now();
    const run: Running = { referee, t0, tick: 0, holes, heard: [t0, t0], clock: null };
    this.running = run;
    void this.ctx.storage.put('started', true);
    referee.start(0);
    run.clock = setInterval(() => {
      this.catchUp(run);
      this.tellClock(run);
      this.settle(run);
    }, CLOCK_MS);
  }

  /**
   * Tells both players the referee's tick and active time, from which each takes its own: the
   * speed level and match clock follow the referee's active time, paused time not counted
   * (GD-STORY-013). Not before play starts, and not once it's over.
   */
  private tellClock(run: Running): void {
    const { state, activeTicks } = run.referee;
    if (state !== 'playing' && state !== 'paused' && state !== 'resuming') return;
    for (const seat of [0, 1] as const) {
      this.send(seat, { type: 'clock', tick: run.tick, active: activeTicks });
    }
  }

  /** Stops the clock once the match is over: nothing is left to time. */
  private settle(run: Running): void {
    if (run.referee.state === 'over' && run.clock !== null) {
      clearInterval(run.clock);
      run.clock = null;
    }
  }

  /**
   * Sends the referee's message to seat `to`. Its `start` also carries the match's settings, the
   * seat, its hole seed, and the rival's bot mark if the rival is a bot.
   */
  private send(to: PlayerIndex, msg: ServerMessage): void {
    const rivalBot = this.sockets().find(([seat]) => seat !== to)?.[2];
    const settings = this.setup?.settings;
    const out: MatchToClient =
      msg.type === 'start' && this.running
        ? {
            ...msg,
            ...(settings ? { settings } : {}),
            holes: this.running.holes[to],
            you: to,
            ...(rivalBot ? { rivalBot } : {}),
          }
        : msg;
    for (const [seat, ws] of this.sockets()) if (seat === to) ws.send(encodeMatchToClient(out));
  }

  /**
   * Brings the referee up to now: first the heartbeats the auto-response answered without waking
   * this object, then every tick since the last. Returns the current tick.
   */
  private catchUp(run: Running): number {
    const now = Date.now();
    const tickOf = (ms: number) => Math.floor(((ms - run.t0) * TPS) / 1000);
    for (const [seat, ws] of this.sockets()) {
      const at = this.ctx.getWebSocketAutoResponseTimestamp(ws)?.getTime() ?? 0;
      if (at > run.heard[seat]) {
        run.heard[seat] = at;
        run.referee.onMessage(seat, { type: 'hb' }, Math.max(run.tick, tickOf(at)));
      }
    }
    const t = tickOf(now);
    while (run.tick < t) run.referee.tick(++run.tick);
    return run.tick;
  }
}
