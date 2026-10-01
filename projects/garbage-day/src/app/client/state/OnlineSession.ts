import {
  ClientMatch,
  emptyBoard,
  TPS,
  type ClientMessage,
  type PlayerEvent,
  type PlayerIndex,
  type RefereeResult,
  type Rules,
  type ServerMessage,
  type ShowdownMessage,
} from '@garbage-day/engine';
import {
  encodeClientToMatch,
  isFinalClose,
  parseMatchToClient,
  type BotMark,
} from '@garbage-day/protocol';
import { clearLabel, type BoardView } from '@garbage-day/ui';
import type { InputController } from '../input/InputController';
import type { Connect } from '../net/link';
import { Socket } from '../net/Socket';
import {
  MAX_CATCH_UP_MS,
  playerView,
  RISE_TICKS,
  showdownView,
  TICK_MS,
  type Connection,
  type MatchEffect,
  type MatchPhase,
  type MatchView,
  type PlayerView,
  type Session,
  type WireEntry,
} from './MatchSession';

// A match against another person, through the Match DO (GD-STORY-011): the engine's
// `ClientMatch` for this player, fed by the socket, and the other player as the referee relays
// them. It has the surface the local `MatchSession` has, so the match screen draws either. The
// screen's side 0 is always this player, whichever seat the referee gave them. When the
// connection drops, the player freezes and the socket comes back on its own; on the new socket
// the session says hello again and rejoins (GD-TICKET-013).

export interface OnlineSessionOptions {
  /** Opens the socket to this match's DO. */
  readonly connect: Connect;
  /** This player's join token and handle, sent in `hello`. */
  readonly token: string;
  readonly handle: string;
  readonly input: InputController;
  /** The countdown ended: play has started. */
  readonly onGo?: () => void;
  /** The referee decided the match. */
  readonly onEnd?: (result: RefereeResult) => void;
  /** The Match DO says the rival is a bot, with these settings (GD-TICKET-016). */
  readonly onRivalBot?: (bot: BotMark) => void;
}

/** The longest absence a `rejoin` can report (the protocol's bound on `awayMs`). */
const MAX_AWAY_MS = 1_000_000;

/** An empty view of the other player before they have played. */
const NO_TOTALS = { lines: 0, sent: 0, quads: 0, tspins: 0, powersUsed: 0, pieces: 0 };

export class OnlineSession implements Session {
  readonly match: ClientMatch;
  private socket: Socket | null = null;
  private connection: Connection = 'online';
  /** When the connection dropped, in ms, for the rejoin's `awayMs`. */
  private droppedAt: number | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly effectListeners = new Set<(e: MatchEffect) => void>();
  private readonly wireListeners = new Set<(e: WireEntry) => void>();
  private lastShowdown: ShowdownMessage | null = null;
  private view: MatchView;
  private viewKey: string;
  private lastNow: number | null = null;
  private acc = 0;
  private announced = { go: false, end: false };
  private rise: { n: number; t: number } | null = null;

  constructor(private readonly o: OnlineSessionOptions) {
    this.match = new ClientMatch({
      send: (msg) => this.wire(msg),
      onPlayerEvent: (ev) => this.onPlayerEvent(ev),
    });
    this.match.controller = o.input;
    this.view = this.computeView();
    this.viewKey = JSON.stringify(this.view);
  }

  /**
   * Opens the socket and says hello. The screen calls it once mounted, not in a constructor a
   * render may run twice, so only one socket ever takes the seat.
   */
  start(): void {
    if (this.socket) return;
    const socket = new Socket(
      this.o.connect,
      {
        open: (again) => {
          socket.send(
            encodeClientToMatch({ type: 'hello', token: this.o.token, handle: this.o.handle }),
          );
          if (again) {
            const away = this.droppedAt === null ? 0 : Date.now() - this.droppedAt;
            this.match.rejoin(Math.min(Math.max(0, away), MAX_AWAY_MS));
          }
          this.droppedAt = null;
        },
        message: (text) => this.onText(text),
        status: (status) => this.onStatus(status),
      },
      // A close the server meant is final, and so is any once the match has a result.
      { final: (code) => isFinalClose(code) || this.match.result !== null },
    );
    this.socket = socket;
    socket.start();
  }

  readonly subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  };

  readonly getSnapshot = (): MatchView => this.view;

  readonly onEffect = (listener: (e: MatchEffect) => void): (() => void) => {
    this.effectListeners.add(listener);
    return () => this.effectListeners.delete(listener);
  };

  readonly onWire = (listener: (e: WireEntry) => void): (() => void) => {
    this.wireListeners.add(listener);
    return () => this.wireListeners.delete(listener);
  };

  get rules(): Rules {
    return this.match.rules;
  }

  inspect(): { readonly tick: number; readonly referee: string } {
    const c = this.connection;
    return { tick: this.match.t, referee: c === 'online' ? this.view.phase : c };
  }

  /** Leaves the match: tells the referee, then closes the socket. */
  leave(): void {
    if (!this.match.result) this.match.send({ type: 'leave' });
    this.close();
  }

  /** Closes the socket for good, as the screen goes. */
  close(): void {
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }

  frame(now: number): void {
    if (now === this.lastNow || !Number.isFinite(now)) return;
    if (this.lastNow === null) {
      this.lastNow = now;
      this.refresh();
      return;
    }
    this.acc += Math.min(now - this.lastNow, MAX_CATCH_UP_MS);
    this.lastNow = now;
    let steps = Math.floor(this.acc / TICK_MS);
    if (steps === 0 && this.o.input.hasPending() && this.acc > -TICK_MS) steps = 1;
    this.acc -= steps * TICK_MS;
    for (let i = 0; i < steps; i++) {
      const piece = this.match.me?.cur;
      const x = piece?.x;
      const r = piece?.r;
      this.match.step();
      if (piece && this.match.me?.cur === piece && (piece.x !== x || piece.r !== r))
        this.emit({ kind: 'move' });
    }
    this.refresh();
  }

  board(i: PlayerIndex): BoardView {
    const t = this.match.t;
    const result = this.view.result;
    if (i === 1) {
      const them = this.match.opponent;
      return {
        board: them.board,
        piece: them.cur,
        ghost: false,
        fog: t < them.fx.fogUntil,
        dead: result?.reason === 'topout' && result.by === 1,
      };
    }
    const P = this.match.me;
    if (!P) return { board: emptyBoard(), ghost: true };
    const r = this.rise;
    return {
      board: P.board,
      piece: P.cur,
      ghost: true,
      clearing: P.clearing?.rows ?? null,
      rise: r && t - r.t < RISE_TICKS ? r.n * (1 - (t - r.t) / RISE_TICKS) : 0,
      fog: t < P.fx.fogUntil,
      dead: !P.alive,
    };
  }

  /** The screen's side for a referee seat: 0 is this player. */
  private side(seat: PlayerIndex): PlayerIndex {
    return seat === this.match.seat ? 0 : 1;
  }

  /** What the match sends, onto the socket. */
  private wire(msg: ClientMessage): void {
    if (msg.type === 'attack') {
      this.emit({ kind: 'attack', from: 0, to: 1, rows: msg.rows, doubled: this.doubled() });
    }
    if (this.wireListeners.size) this.tap({ tick: this.match.t, dir: 'up', seat: 0, msg });
    this.socket?.send(encodeClientToMatch(msg));
  }

  /** The socket dropped, came back, or gave up. */
  private onStatus(status: Socket['status']): void {
    if (status === 'reconnecting') {
      this.droppedAt ??= Date.now();
      this.match.drop();
      // What is pressed while frozen isn't played on the return.
      this.o.input.reset();
      this.connection = 'reconnecting';
    } else if (status === 'closed') {
      // Closed by the screen, or by the match ending, is not a lost connection.
      this.connection = this.socket && !this.match.result ? 'lost' : 'online';
      if (this.connection === 'lost') this.match.drop();
    } else if (status === 'open') {
      this.connection = 'online';
    }
    this.refresh();
  }

  private onText(text: string): void {
    const r = parseMatchToClient(text);
    if (!r.ok) return;
    const msg = r.msg;
    if (msg.type === 'pong' || msg.type === 'lobby' || msg.type === 'error') return;
    if (this.wireListeners.size) this.tap({ tick: this.match.t, dir: 'down', seat: 0, msg });
    if (msg.type === 'start' && msg.rivalBot) this.o.onRivalBot?.(msg.rivalBot);
    this.onServer(msg);
    this.match.receive(
      msg,
      msg.type === 'start'
        ? { ...(msg.you === undefined ? {} : { you: msg.you }), holes: msg.holes ?? 0 }
        : {},
    );
  }

  /** The moments the referee's messages bring, before the simulation takes them. */
  private onServer(msg: ServerMessage): void {
    if (msg.type === 'garbage' && msg.id > (this.match.me?.gotGarbage ?? 0)) {
      this.emit({ kind: 'attack', from: 1, to: 0, rows: msg.rows, doubled: this.doubled() });
    } else if (msg.type === 'opp' && msg.kind === 'lock') {
      // A resume re-sends the last lock so the view is current; it isn't a new one.
      if (msg.stats.pieces === this.match.opponent.stats?.pieces) return;
      this.emit({ kind: 'lock', p: 1 });
      const label = msg.clear ? clearLabel(msg.clear) : null;
      if (msg.clear && label) this.emit({ kind: 'clear', p: 1, lines: msg.clear.lines, label });
      // Garbage that landed on them with this lock, as their stats count it.
      const landed = msg.stats.garbageRows - (this.match.opponent.stats?.garbageRows ?? 0);
      if (landed > 0) this.emit({ kind: 'land', p: 1, rows: landed });
    }
  }

  private doubled(): boolean {
    const sd = this.match.me?.showdown;
    return sd?.phase === 'start';
  }

  private emit(e: MatchEffect): void {
    this.effectListeners.forEach((l) => l(e));
  }

  private tap(e: WireEntry): void {
    this.wireListeners.forEach((l) => l(e));
  }

  private onPlayerEvent(ev: PlayerEvent): void {
    switch (ev.type) {
      case 'lock': {
        this.emit({ kind: 'lock', p: 0 });
        const label = ev.clear ? clearLabel(ev.clear) : null;
        if (ev.clear && label) this.emit({ kind: 'clear', p: 0, lines: ev.clear.lines, label });
        if (ev.cancelled > 0) this.emit({ kind: 'cancel', p: 0, rows: ev.cancelled });
        if (ev.power) this.emit({ kind: 'gem', p: 0, power: ev.power });
        if (ev.rise > 0) {
          this.rise = { n: ev.rise, t: this.match.t };
          this.emit({ kind: 'land', p: 0, rows: ev.rise });
        }
        break;
      }
      case 'powerUse':
        this.emit({ kind: 'powerUse', p: this.side(ev.p), power: ev.kind });
        break;
      case 'powerApply':
        this.emit({ kind: 'powerApply', p: this.side(ev.p), power: ev.kind, by: this.side(ev.by) });
        break;
      case 'topout':
        this.emit({ kind: 'topout', p: 0 });
        break;
      default:
        break;
    }
  }

  private refresh(): void {
    const sd = this.match.me?.showdown ?? null;
    if (sd && sd !== this.lastShowdown) {
      this.lastShowdown = sd;
      this.emit({ kind: 'showdown', showdown: sd.kind, phase: sd.phase });
    }
    const next = this.computeView();
    const key = JSON.stringify(next);
    if (key !== this.viewKey) {
      this.view = next;
      this.viewKey = key;
      this.listeners.forEach((l) => l());
    }
    if (next.phase === 'playing' && !this.announced.go) {
      this.announced.go = true;
      this.o.input.reset();
      this.o.onGo?.();
    }
    if (next.result && !this.announced.end) {
      this.announced.end = true;
      this.o.input.reset();
      this.o.onEnd?.(next.result);
    }
  }

  private computeView(): MatchView {
    const m = this.match;
    const me = m.me;
    const t = m.t;
    const result: RefereeResult | null = m.result && {
      winner: m.result.winner === null ? null : this.side(m.result.winner),
      reason: m.result.reason,
      by: m.result.by === null ? null : this.side(m.result.by),
      activeTicks: m.activeTicks,
      ticks: t,
    };
    const phase: MatchPhase = result
      ? 'over'
      : !me || me.resumeAt >= 0
        ? 'countdown'
        : me.frozen
          ? 'paused'
          : 'playing';
    const countdown =
      phase !== 'countdown' ? 0 : me ? Math.max(0, Math.ceil((me.resumeAt - t) / TPS)) : 3;
    const level = me ? me.level(t, m.activeTicks) : 1;
    const rampTicks = m.rules.rampSec * TPS;
    const progress =
      level >= m.rules.maxLevel
        ? 1
        : Math.floor(((m.activeTicks % rampTicks) / rampTicks) * 20) / 20;
    const sd = me?.showdown ?? null;
    const clock = Math.floor(m.activeTicks / TPS);
    const them = m.opponent;
    const theirs: PlayerView = {
      hold: them.hold,
      holdUsed: false,
      next: [],
      power: them.power,
      meterTotal: them.meter,
      meterReady: 0,
      shielded: t < them.fx.shieldUntil,
      totals: them.stats
        ? {
            lines: them.stats.lines,
            sent: them.stats.sent,
            quads: them.stats.fourLineClears,
            tspins: them.stats.tspins,
            powersUsed: them.stats.powersUsed,
            pieces: them.stats.pieces,
          }
        : NO_TOTALS,
      alive: !(result?.reason === 'topout' && result.by === 1),
    };
    const mine: PlayerView = me
      ? playerView(me, t)
      : { ...theirs, hold: null, power: null, meterTotal: 0, totals: NO_TOTALS, alive: true };
    return {
      phase,
      countdown,
      clock,
      level,
      progress,
      hot: (me ? t < me.fx.rushUntil : false) || (sd?.kind === 'sudden' && sd.phase === 'start'),
      showdown: showdownView(sd, clock),
      players: [mine, theirs],
      result,
      connection: this.connection,
    };
  }
}
