import {
  Bot,
  LocalMatch,
  TPS,
  botConfig,
  meterReady,
  type DealtPiece,
  type PieceType,
  type PlayerEvent,
  type PlayerIndex,
  type PlayerSim,
  type PowerKind,
  type RefereeResult,
  type Rules,
} from '@garbage-day/engine';
import type { BoardView } from '@garbage-day/ui';
import type { InputController } from '../input/InputController';
import type { BotChoice } from './appMachine';
import type { Store } from './storeContext';

// A match in the browser (client architecture, "Where state lives"): the engine's `LocalMatch`,
// with the player's input controller as seat 0 and a bot as seat 1, stepped at the engine's 60 Hz
// from the animation frame. React reads a snapshot that changes only on events (a lock, a new
// second, a level), never every frame; the board canvases read `board(i)` every frame. In M3 the
// same surface wraps the socket to the Match Durable Object instead of a local referee.

interface PlayerView {
  readonly hold: PieceType | null;
  readonly holdUsed: boolean;
  readonly next: readonly DealtPiece[];
  readonly power: PowerKind | null;
  readonly meterTotal: number;
  readonly meterReady: number;
  readonly shielded: boolean;
  readonly lines: number;
  readonly sent: number;
  readonly alive: boolean;
}

type MatchPhase = 'countdown' | 'playing' | 'paused' | 'over';

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
  readonly players: readonly [PlayerView, PlayerView];
  readonly result: RefereeResult | null;
}

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

const TICK_MS = 1000 / TPS;
/** A long gap (a hidden tab, a slow frame) catches up at most this much, never in a burst. */
const MAX_CATCH_UP_MS = 250;
/** Ticks the stack takes to rise when garbage lands, as in the proof of concept. */
const RISE_TICKS = 9;
/** The simulated connection between the players and the local referee, in ms each way. */
const LOCAL_LATENCY_MS = 10;

export class MatchSession implements Store<MatchView> {
  readonly match: LocalMatch;
  private readonly input: InputController;
  private readonly listeners = new Set<() => void>();
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
    for (let i = 0; i < steps && !this.match.over; i++) this.match.step();
    this.refresh();
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

  private onPlayerEvent(ev: PlayerEvent): void {
    if (ev.type === 'lock' && ev.rise > 0) this.rise[ev.p] = { n: ev.rise, t: this.match.t };
  }

  private refresh(): void {
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
    return {
      phase,
      countdown,
      clock: Math.floor(r.activeTicks / TPS),
      level,
      progress,
      hot: t < me.fx.rushUntil || (sd?.kind === 'sudden' && sd.phase === 'start'),
      players: [playerView(m.players[0], t), playerView(m.players[1], t)],
      result: r.result,
    };
  }
}

function playerView(P: PlayerSim, t: number): PlayerView {
  return {
    hold: P.hold?.t ?? null,
    holdUsed: P.holdUsed,
    next: P.queue.slice(0, 5),
    power: P.power,
    meterTotal: P.meterTotal(),
    meterReady: meterReady(P.meter, t),
    shielded: t < P.fx.shieldUntil,
    lines: P.stats.lines,
    sent: P.stats.sent,
    alive: P.alive,
  };
}
