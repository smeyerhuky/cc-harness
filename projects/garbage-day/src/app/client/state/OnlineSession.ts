import {
  emptyBoard,
  TPS,
  type ClientMatch,
  type ClientMessage,
  type PlayerEvent,
  type PlayerIndex,
  type RefereeResult,
  type Rules,
  type ShowdownMessage,
} from '@garbage-day/engine';
import type { BotMark, MatchSettings } from '@garbage-day/protocol';
import { clearLabel, type BoardView } from '@garbage-day/ui';
import type { InputController } from '../input/InputController';
import {
  MatchClient,
  type LinkState,
  type LobbyMessage,
  type RefereeMessage,
  type Refusal,
  type SeatTicket,
} from '../net/MatchClient';
import {
  MAX_CATCH_UP_MS,
  playerView,
  RISE_TICKS,
  showdownView,
  TICK_MS,
  type MatchEffect,
  type MatchPhase,
  type MatchView,
  type PlayerView,
  type Session,
  type WireEntry,
} from './MatchSession';

// A match through the Match DO (GD-STORY-011), against a person or a bot's worker (GD-STORY-015):
// this player's seat as a `MatchClient`, which keeps the socket and rejoins after a drop
// (GD-TICKET-013), and the other player as the referee relays them. It has the surface the local
// `MatchSession` has, so the match screen draws either. The screen's side 0 is always this
// player, whichever seat the referee gave them.

export interface OnlineSessionOptions {
  /** This player's handle, sent in `hello`. */
  readonly handle: string;
  readonly input: InputController;
  /** The countdown ended: play has started. */
  readonly onGo?: () => void;
  /** The referee decided the match. */
  readonly onEnd?: (result: RefereeResult) => void;
  /** The Match DO says the rival is a bot, with these settings (GD-TICKET-016). */
  readonly onRivalBot?: (bot: BotMark) => void;
  /**
   * The referee's `start` arrived: the countdown began, and a private game left its lobby, which
   * comes with it as last told.
   */
  readonly onStart?: (lobby: LobbyMessage | null) => void;
  /** Both players agreed to a rematch. */
  readonly onRematch?: () => void;
}

/** An empty view of the other player before they have played. */
const NO_TOTALS = { lines: 0, sent: 0, quads: 0, tspins: 0, powersUsed: 0, pieces: 0 };

export class OnlineSession implements Session {
  match: ClientMatch;
  private readonly client: MatchClient;
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
  /** A private game's lobby, as last told (GD-STORY-010). */
  private lobby: LobbyMessage | null = null;
  private refusal: Refusal | null = null;
  private rematchWanted: { mine: boolean; theirs: boolean } | null = null;

  constructor(private readonly o: OnlineSessionOptions) {
    this.client = new MatchClient({
      handle: o.handle,
      onPlayerEvent: (ev) => this.onPlayerEvent(ev),
      onHeard: (msg) => this.onHeard(msg),
      onSent: (msg) => this.onSent(msg),
      onLink: (state) => this.onLink(state),
      onLobby: (msg) => {
        this.lobby = msg;
        this.listeners.forEach((l) => l());
      },
      onRefused: (why) => {
        this.refusal = why;
        this.listeners.forEach((l) => l());
      },
      onRematchRequest: () => {
        if (!this.rematchWanted) this.rematchWanted = { mine: false, theirs: true };
        else this.rematchWanted.theirs = true;
        this.refresh();
      },
      onRenew: (match) => {
        this.match = match;
        this.match.controller = this.o.input;
        this.rematchWanted = null;
        this.view = this.computeView();
        this.o.onRematch?.();
        this.refresh();
      },
    });
    this.match = this.client.match;
    this.match.controller = o.input;
    this.view = this.computeView();
    this.viewKey = JSON.stringify(this.view);
  }

  /**
   * Takes the seat: opens its socket and says hello. The screen calls it once mounted, not in a
   * constructor a render may run twice, so only one socket ever takes the seat.
   */
  start(seat: SeatTicket): void {
    this.client.start(seat);
  }

  /** No seat could be had, as when a bot match can't be made: the connection reads as lost. */
  fail(): void {
    this.client.fail();
  }

  readonly subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  };

  readonly getSnapshot = (): MatchView => this.view;

  /** A private game's lobby, before its match starts; null in any other match. */
  readonly getLobby = (): LobbyMessage | null => this.lobby;

  /** Why the Match DO turned this seat away, if it did. */
  readonly getRefusal = (): Refusal | null => this.refusal;

  /** Asks for a rematch. */
  rematch(): void {
    if (!this.rematchWanted) this.rematchWanted = { mine: true, theirs: false };
    else this.rematchWanted.mine = true;
    this.client.rematch();
    this.refresh();
  }

  /** Says this player is ready, in a private game's lobby. */
  ready(): void {
    this.client.say({ type: 'ready' });
  }

  /** Changes a private game's settings: only the host's are taken, and both must be ready again. */
  changeSettings(settings: MatchSettings): void {
    this.client.say({ type: 'settings', settings });
  }

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
    const c = this.client.link;
    return { tick: this.match.t, referee: c === 'online' ? this.view.phase : c };
  }

  /** Leaves the match: tells the referee, then closes the socket. */
  leave(): void {
    this.client.leave();
  }

  /** Closes the socket for good, as the screen goes. */
  close(): void {
    this.client.close();
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

  /** What the match sends, before the socket takes it. */
  private onSent(msg: ClientMessage): void {
    if (msg.type === 'attack') {
      this.emit({ kind: 'attack', from: 0, to: 1, rows: msg.rows, doubled: this.doubled() });
    }
    if (this.wireListeners.size) this.tap({ tick: this.match.t, dir: 'up', seat: 0, msg });
  }

  /** The connection dropped, came back, or was lost. */
  private onLink(state: LinkState): void {
    // What is pressed while frozen isn't played on the return.
    if (state === 'reconnecting') this.o.input.reset();
    this.refresh();
  }

  /** What the referee says, before the match takes it. */
  private onHeard(msg: RefereeMessage): void {
    if (this.wireListeners.size) this.tap({ tick: this.match.t, dir: 'down', seat: 0, msg });
    if (msg.type === 'start' && msg.rivalBot) this.o.onRivalBot?.(msg.rivalBot);
    if (msg.type === 'start') this.o.onStart?.(this.lobby);
    this.onServer(msg);
  }

  /** The moments the referee's messages bring, before the simulation takes them. */
  private onServer(msg: RefereeMessage): void {
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
      connection: this.client.link,
      powerUps: m.rules.gemChance > 0,
      ...(this.rematchWanted ? { rematch: this.rematchWanted } : {}),
    };
  }
}
