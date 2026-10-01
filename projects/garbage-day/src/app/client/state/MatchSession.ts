import {
  Bot,
  LocalMatch,
  TPS,
  botConfig,
  meterReady,
  type ClientMessage,
  type DealtPiece,
  type PieceType,
  type PlayerEvent,
  type PlayerIndex,
  type PlayerSim,
  type PowerKind,
  type RefereeEvent,
  type RefereeResult,
  type Rules,
  type ServerMessage,
  type ShowdownMessage,
} from '@garbage-day/engine';
import { clearLabel, type BoardView, type ClearLabel } from '@garbage-day/ui';
import type { InputController } from '../input/InputController';
import type { BotChoice } from './appMachine';
import type { Store } from './storeContext';

// A match in the browser (client architecture, "Where state lives"): the engine's `LocalMatch`,
// with the player's input controller as seat 0 and a bot as seat 1, stepped at the engine's 60 Hz
// from the animation frame. React reads a snapshot that changes only on events (a lock, a new
// second, a level), never every frame; the board canvases read `board(i)` every frame. What
// happens in a moment (a clear, an attack, garbage landing) goes out as effects, for the labels,
// flights, shakes and sounds that play once (GD-STORY-002). In M3 the same surface wraps the
// socket to the Match Durable Object instead of a local referee.

/**
 * A message between one player and the referee, for the developer overlay (GD-TICKET-024): `up`
 * from the player, `down` to them, stamped with the tick it was sent on.
 */
export type WireEntry =
  | {
      readonly tick: number;
      readonly dir: 'up';
      readonly seat: PlayerIndex;
      readonly msg: ClientMessage;
    }
  | {
      readonly tick: number;
      readonly dir: 'down';
      readonly seat: PlayerIndex;
      readonly msg: ServerMessage;
    };

/** A player's running totals, for the stats under each board and in the result. */
export interface PlayerTotals {
  readonly lines: number;
  readonly sent: number;
  readonly quads: number;
  readonly tspins: number;
  readonly powersUsed: number;
  readonly pieces: number;
}

export interface PlayerView {
  readonly hold: PieceType | null;
  readonly holdUsed: boolean;
  readonly next: readonly DealtPiece[];
  readonly power: PowerKind | null;
  readonly meterTotal: number;
  readonly meterReady: number;
  readonly shielded: boolean;
  readonly totals: PlayerTotals;
  readonly alive: boolean;
}

export type MatchPhase = 'countdown' | 'playing' | 'paused' | 'over';

/** A showdown being announced (`startsIn` seconds away) or under way (`startsIn` null). */
interface ShowdownView {
  readonly kind: 'double' | 'sudden';
  readonly startsIn: number | null;
}

/** Something that happens in a moment, for the screen, the sound and the haptics to play once. */
export type MatchEffect =
  | { readonly kind: 'move' }
  | { readonly kind: 'lock'; readonly p: PlayerIndex }
  | {
      readonly kind: 'clear';
      readonly p: PlayerIndex;
      readonly lines: number;
      readonly label: ClearLabel;
    }
  | { readonly kind: 'cancel'; readonly p: PlayerIndex; readonly rows: number }
  | { readonly kind: 'gem'; readonly p: PlayerIndex; readonly power: PowerKind }
  | { readonly kind: 'land'; readonly p: PlayerIndex; readonly rows: number }
  | {
      readonly kind: 'attack';
      readonly from: PlayerIndex;
      readonly to: PlayerIndex;
      readonly rows: number;
      readonly doubled: boolean;
    }
  | { readonly kind: 'blocked'; readonly p: PlayerIndex; readonly rows: number }
  | { readonly kind: 'powerUse'; readonly p: PlayerIndex; readonly power: PowerKind }
  | {
      readonly kind: 'powerApply';
      readonly p: PlayerIndex;
      readonly power: PowerKind;
      readonly by: PlayerIndex;
    }
  | {
      readonly kind: 'showdown';
      readonly showdown: 'double' | 'sudden';
      readonly phase: 'soon' | 'start' | 'end';
    }
  | { readonly kind: 'topout'; readonly p: PlayerIndex };

/** What the match screen needs of a match, local or online. */
export interface Session extends Store<MatchView> {
  /** The match's rules, as played. */
  readonly rules: Rules;
  readonly onEffect: (listener: (e: MatchEffect) => void) => () => void;
  readonly onWire: (listener: (e: WireEntry) => void) => () => void;
  /** Advances to `now`, an animation-frame time in ms; the canvases call it before drawing. */
  frame(now: number): void;
  /** What board `i` looks like now (0 is this player's). */
  board(i: PlayerIndex): BoardView;
  /** The tick and the referee's state as this side knows them, for the developer overlay. */
  inspect(): { readonly tick: number; readonly referee: string };
}

export interface MatchView {
  readonly phase: MatchPhase;
  /** Whole seconds left in the countdown (3, 2, 1), and 0 once play runs. */
  readonly countdown: number;
  /** Whole seconds of active play: the match clock. */
  readonly clock: number;
  readonly level: number;
  /** How far to the next level, in twentieths, so it changes a few times a second at most. */
  readonly progress: number;
  /** Rush or sudden death is raising the speed. */
  readonly hot: boolean;
  readonly showdown: ShowdownView | null;
  readonly players: readonly [PlayerView, PlayerView];
  readonly result: RefereeResult | null;
  /**
   * The connection to the Match DO: `local` for a match played here, else online, reconnecting
   * (the player stands frozen meanwhile) or lost for good (GD-TICKET-013).
   */
  readonly connection: Connection;
  /** Whether the match deals power-ups: a Classic one has none (PRD, "Match settings"). */
  readonly powerUps: boolean;
}

type Connection = 'local' | 'online' | 'reconnecting' | 'lost';

export interface MatchSessionOptions {
  readonly seed: number;
  readonly bot: BotChoice;
  readonly input: InputController;
  readonly rules?: Partial<Rules>;
  /** The countdown ended: play has started. */
  readonly onGo?: () => void;
  /** The referee decided the match. */
  readonly onEnd?: (result: RefereeResult) => void;
}

export const TICK_MS = 1000 / TPS;
/** A long gap (a hidden tab, a slow frame) catches up at most this much, never in a burst. */
export const MAX_CATCH_UP_MS = 250;
/** Ticks the stack takes to rise when garbage lands, as in the proof of concept. */
export const RISE_TICKS = 9;
/** The simulated connection between the players and the local referee, in ms each way. */
const LOCAL_LATENCY_MS = 10;

export class MatchSession implements Session {
  readonly match: LocalMatch;
  private readonly input: InputController;
  private readonly listeners = new Set<() => void>();
  private readonly effectListeners = new Set<(e: MatchEffect) => void>();
  private readonly wireListeners = new Set<(e: WireEntry) => void>();
  private lastShowdown: ShowdownMessage | null = null;
  private view: MatchView;
  private viewKey: string;
  private lastNow: number | null = null;
  private acc = 0;
  private started = false;
  private announced: { go: boolean; end: boolean } = { go: false, end: false };
  private readonly rise: [{ n: number; t: number } | null, { n: number; t: number } | null] = [
    null,
    null,
  ];

  constructor(private readonly o: MatchSessionOptions) {
    this.input = o.input;
    this.match = new LocalMatch({
      seed: o.seed,
      ...(o.rules ? { rules: o.rules } : {}),
      latencyMs: [LOCAL_LATENCY_MS, LOCAL_LATENCY_MS],
      jitterMs: 0,
      onPlayerEvent: (ev) => this.onPlayerEvent(ev),
      onRefereeEvent: (ev) => this.onRefereeEvent(ev),
      // Every message passes through untouched; with nobody listening, nothing more happens.
      wire: {
        client: (msg, seat) => {
          if (this.wireListeners.size) this.tap({ tick: this.match.t, dir: 'up', seat, msg });
          return msg;
        },
        server: (msg, seat) => {
          if (this.wireListeners.size) this.tap({ tick: this.match.t, dir: 'down', seat, msg });
          return msg;
        },
      },
    });
    this.match.controllers[0] = o.input;
    this.match.controllers[1] = new Bot(
      this.match.players[1],
      o.seed,
      botConfig(o.bot.skill, o.bot.speed),
    );
    this.view = this.computeView();
    this.viewKey = JSON.stringify(this.view);
  }

  readonly subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  };

  readonly getSnapshot = (): MatchView => this.view;

  /** Listens for effects; returns the function that stops listening. */
  readonly onEffect = (listener: (e: MatchEffect) => void): (() => void) => {
    this.effectListeners.add(listener);
    return () => this.effectListeners.delete(listener);
  };

  /** Listens for every message on the wire; returns the function that stops listening. */
  readonly onWire = (listener: (e: WireEntry) => void): (() => void) => {
    this.wireListeners.add(listener);
    return () => this.wireListeners.delete(listener);
  };

  /**
   * Advances the match to `now` (an animation-frame time in ms), in whole 60 Hz ticks. Calling it
   * twice with the same `now` does nothing, so every canvas can call it before drawing. A key
   * pressed since the last tick runs one tick early, borrowed from the next frame, so a move is
   * drawn in the first frame after the key whatever the display's refresh rate (US-05).
   */
  frame(now: number): void {
    if (now === this.lastNow || !Number.isFinite(now)) return;
    if (this.lastNow === null || !this.started) {
      this.match.start();
      this.started = true;
      this.lastNow = now;
      this.refresh();
      return;
    }
    this.acc += Math.min(now - this.lastNow, MAX_CATCH_UP_MS);
    this.lastNow = now;
    let steps = Math.floor(this.acc / TICK_MS);
    if (steps === 0 && this.input.hasPending() && this.acc > -TICK_MS) steps = 1;
    this.acc -= steps * TICK_MS;
    const me = this.match.players[0];
    for (let i = 0; i < steps && !this.match.over; i++) {
      const piece = me.cur;
      const x = piece?.x;
      const r = piece?.r;
      this.match.step();
      // The same piece, somewhere else: the player moved or rotated it.
      if (piece && me.cur === piece && (piece.x !== x || piece.r !== r))
        this.emit({ kind: 'move' });
    }
    this.refresh();
  }

  get rules(): Rules {
    return this.match.rules;
  }

  inspect(): { readonly tick: number; readonly referee: string } {
    return { tick: this.match.t, referee: this.match.referee.state };
  }

  /** What board `i` looks like now: the canvases call this every frame. */
  board(i: PlayerIndex): BoardView {
    const P = this.match.players[i];
    const t = this.match.t;
    const r = this.rise[i];
    const rise = r && t - r.t < RISE_TICKS ? r.n * (1 - (t - r.t) / RISE_TICKS) : 0;
    return {
      board: P.board,
      piece: P.cur,
      ghost: i === 0,
      clearing: P.clearing?.rows ?? null,
      rise,
      fog: t < P.fx.fogUntil,
      dead: !P.alive,
    };
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
        const { p } = ev;
        this.emit({ kind: 'lock', p });
        const label = ev.clear ? clearLabel(ev.clear) : null;
        if (ev.clear && label) this.emit({ kind: 'clear', p, lines: ev.clear.lines, label });
        if (ev.cancelled > 0) this.emit({ kind: 'cancel', p, rows: ev.cancelled });
        if (ev.power) this.emit({ kind: 'gem', p, power: ev.power });
        if (ev.rise > 0) {
          this.rise[p] = { n: ev.rise, t: this.match.t };
          this.emit({ kind: 'land', p, rows: ev.rise });
        }
        break;
      }
      case 'powerUse':
        this.emit({ kind: 'powerUse', p: ev.p, power: ev.kind });
        break;
      case 'powerApply':
        this.emit({ kind: 'powerApply', p: ev.p, power: ev.kind, by: ev.by });
        break;
      case 'topout':
        this.emit({ kind: 'topout', p: ev.p });
        break;
      default:
        break;
    }
  }

  private onRefereeEvent(ev: RefereeEvent): void {
    if (ev.type === 'route') {
      this.emit({ kind: 'attack', from: ev.from, to: ev.to, rows: ev.rows, doubled: ev.doubled });
    } else if (ev.type === 'blocked') {
      this.emit({ kind: 'blocked', p: ev.p, rows: ev.rows });
    }
  }

  private refresh(): void {
    // Showdowns as the player was told them, as a client online would hear them.
    const sd = this.match.players[0].showdown;
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
      this.input.reset();
      this.o.onGo?.();
    }
    if (next.result && !this.announced.end) {
      this.announced.end = true;
      this.input.reset();
      this.o.onEnd?.(next.result);
    }
  }

  private computeView(): MatchView {
    const m = this.match;
    const r = m.referee;
    const t = m.t;
    const me = m.players[0];
    const phase: MatchPhase =
      r.state === 'playing'
        ? 'playing'
        : r.state === 'paused'
          ? 'paused'
          : r.state === 'over'
            ? 'over'
            : 'countdown';
    // The countdown is read from what the player was told (the start or resume tick), as a
    // client online would; before that message arrives it shows 3.
    const countdown =
      phase !== 'countdown'
        ? 0
        : me.resumeAt >= 0
          ? Math.max(0, Math.ceil((me.resumeAt - t) / TPS))
          : 3;
    const level = me.level(t, r.activeTicks);
    const rampTicks = m.rules.rampSec * TPS;
    const progress =
      level >= m.rules.maxLevel
        ? 1
        : Math.floor(((r.activeTicks % rampTicks) / rampTicks) * 20) / 20;
    const sd = me.showdown;
    const clock = Math.floor(r.activeTicks / TPS);
    return {
      phase,
      countdown,
      clock,
      level,
      progress,
      hot: t < me.fx.rushUntil || (sd?.kind === 'sudden' && sd.phase === 'start'),
      showdown: showdownView(sd, clock),
      players: [playerView(m.players[0], t), playerView(m.players[1], t)],
      result: r.result,
      connection: 'local',
      powerUps: m.rules.gemChance > 0,
    };
  }
}

export function playerView(P: PlayerSim, t: number): PlayerView {
  return {
    hold: P.hold?.t ?? null,
    holdUsed: P.holdUsed,
    next: P.queue.slice(0, 5),
    power: P.power,
    meterTotal: P.meterTotal(),
    meterReady: meterReady(P.meter, t),
    shielded: t < P.fx.shieldUntil,
    totals: {
      lines: P.stats.lines,
      sent: P.stats.sent,
      quads: P.stats.fourLineClears,
      tspins: P.stats.tspins,
      powersUsed: P.stats.powersUsed,
      pieces: P.stats.pieces,
    },
    alive: P.alive,
  };
}

export function showdownView(sd: ShowdownMessage | null, clock: number): ShowdownView | null {
  if (!sd || sd.phase === 'end') return null;
  if (sd.phase === 'soon') {
    return { kind: sd.kind, startsIn: Math.max(0, (sd.startsAt ?? clock) - clock) };
  }
  return { kind: sd.kind, startsIn: null };
}
