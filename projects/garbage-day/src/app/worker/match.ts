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
  type MatchSettings,
  type MatchToClient,
} from '@garbage-day/protocol';
import type { GuardLimits } from './guard';
import { SocketDO, type RefusalCode } from './sockets';

// One match, quick or private (kb/design/architecture.md, "Components"; GD-STORY-011). Whoever
// creates the match (the Lobby DO for a quick match, the Worker for a private game) opens it with
// two join tokens. Each player's socket says `hello` with one, which seats it; with both seats
// taken the referee starts, on a seed that never leaves this object (PRD US-06). The referee is
// the engine's, as in a local match: this object only carries its messages and keeps its clock.

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
  readonly settings: MatchSettings;
}

interface Seat {
  readonly seat: PlayerIndex;
  /** The seat is a bot, with these settings, as its `hello` said (GD-TICKET-016). */
  readonly bot?: BotMark;
}

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
    if (await this.ctx.storage.get('setup')) return false;
    await this.ctx.storage.put('setup', setup);
    this.setup = setup;
    return true;
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
      await this.hello(ws, msg.token, msg.bot);
      return;
    }
    if (!isSeat(seat)) {
      this.refuse(ws, 'Say hello with your token first');
      return;
    }
    const run = this.running;
    if (!run) return;
    const t = this.catchUp(run);
    if (msg.type === 'ready' || msg.type === 'settings') return; // the private lobby (GD-STORY-010)
    run.referee.onMessage(seat.seat, msg, t);
    this.settle(run);
  }

  private async hello(ws: WebSocket, token: string, bot?: BotMark): Promise<void> {
    this.setup ??= (await this.ctx.storage.get<MatchSetup>('setup')) ?? null;
    const seat = this.setup?.tokens.indexOf(token);
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
    ws.serializeAttachment((bot ? { seat, bot } : { seat }) satisfies Seat);
    if (!this.running && this.sockets().length === 2) this.start();
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
   * Sends the referee's message to seat `to`. Its `start` also carries the seat, its hole seed,
   * and the rival's bot mark if the rival is a bot.
   */
  private send(to: PlayerIndex, msg: ServerMessage): void {
    const rivalBot = this.sockets().find(([seat]) => seat !== to)?.[2];
    const out: MatchToClient =
      msg.type === 'start' && this.running
        ? { ...msg, holes: this.running.holes[to], you: to, ...(rivalBot ? { rivalBot } : {}) }
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
