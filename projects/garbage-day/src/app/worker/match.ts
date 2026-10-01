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
  settingsToRules,
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

/** Close code when a seat's newer socket replaces its older one. */
export const CLOSE_REPLACED = 4000;
/** Close code for a socket whose token seats nobody. */
export const CLOSE_BAD_TOKEN = 4001;

interface Seat {
  readonly seat: PlayerIndex;
}

const isSeat = (a: unknown): a is Seat =>
  typeof a === 'object' && a !== null && ((a as Seat).seat === 0 || (a as Seat).seat === 1);

const randomU32 = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;

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
}

export class MatchDO extends SocketDO<ClientToMatch> {
  protected readonly limits = MATCH_LIMITS;
  private setup: MatchSetup | null = null;
  private running: Running | null = null;

  protected parse(text: string) {
    return parseClientToMatch(text);
  }

  protected encodeError(code: RefusalCode | 'bad-token', message: string): string {
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
      await this.hello(ws, msg.token);
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
  }

  private async hello(ws: WebSocket, token: string): Promise<void> {
    this.setup ??= (await this.ctx.storage.get<MatchSetup>('setup')) ?? null;
    const seat = this.setup?.tokens.indexOf(token);
    if (seat !== 0 && seat !== 1) {
      this.refuse(ws, 'That token seats nobody in this match');
      return;
    }
    for (const [s, other] of this.sockets()) {
      if (s === seat && other !== ws) other.close(CLOSE_REPLACED, 'Replaced by a newer connection');
    }
    ws.serializeAttachment({ seat } satisfies Seat);
    if (!this.running && this.sockets().length === 2) this.start();
  }

  private refuse(ws: WebSocket, message: string): void {
    ws.send(this.encodeError('bad-token', message));
    ws.close(CLOSE_BAD_TOKEN, 'Bad token');
  }

  /** The seated sockets, by seat. */
  private sockets(): [PlayerIndex, WebSocket][] {
    const out: [PlayerIndex, WebSocket][] = [];
    for (const ws of this.ctx.getWebSockets()) {
      const a: unknown = ws.deserializeAttachment();
      if (isSeat(a) && ws.readyState === WebSocket.OPEN) out.push([a.seat, ws]);
    }
    return out;
  }

  private start(): void {
    const setup = this.setup;
    if (!setup) return;
    const holes: [number, number] = [randomU32(), randomU32()];
    const referee = new Referee(
      randomU32(),
      { ...DEFAULT_RULES, ...settingsToRules(setup.settings) },
      {
        send: (to, msg) => this.send(to, msg),
        emit: () => undefined,
      },
    );
    const t0 = Date.now();
    this.running = { referee, t0, tick: 0, holes, heard: [t0, t0] };
    referee.start(0);
  }

  /** Sends the referee's message to seat `to`, adding its hole seed to `start`. */
  private send(to: PlayerIndex, msg: ServerMessage): void {
    const out: MatchToClient =
      msg.type === 'start' && this.running ? { ...msg, holes: this.running.holes[to] } : msg;
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
