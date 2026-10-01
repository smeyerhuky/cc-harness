import { type Clear, scoreClear } from './attack';
import {
  type Board,
  cellAt,
  clearRows,
  dropBottomRows,
  emptyBoard,
  fullRows,
  gemCell,
  gemPower,
  isEmpty,
  pieceCell,
  setCell,
  snapshot,
} from './board';
import { H, SALT, TPS, VIS, W, type PlayerIndex, type PowerKind } from './constants';
import { cancelGarbage, landGarbage, type MeterEntry, meterTotal } from './garbage';
import type {
  PlayerEvent,
  PlayerMessage,
  PlayerStats,
  PowerMessage,
  ServerMessage,
  ResultMessage,
  ShowdownMessage,
  TopOutReason,
} from './messages';
import {
  type ActivePiece,
  cellsAt,
  type DealtPiece,
  fits,
  spawnPos,
  tryRotate,
  tSpinCorners,
} from './pieces';
import { mulberry32, type Rng } from './rng';
import type { Rules } from './rules';
import { FIXED_ONE, gravity, levelAt, softGravity } from './speed';

/** One tick's input. Presses (rotate, hold, hard drop, power) act once; `soft` is held. */
export interface Input {
  readonly cw?: boolean;
  readonly ccw?: boolean;
  readonly hold?: boolean;
  readonly hard?: boolean;
  readonly power?: boolean;
  readonly soft?: boolean;
  /** A one-column move this tick: -1 left, 1 right. */
  readonly dx?: -1 | 0 | 1;
  /**
   * Rows to move down this tick, stopping where the piece lands: a touch drag soft-drops one row
   * per cell of travel, following the finger (controls and layout, "Touch gestures").
   */
  readonly drop?: number;
}

export const NO_INPUT: Input = Object.freeze({});

/** Where the simulation sends messages and reports events. */
export interface PlayerHost {
  send(msg: PlayerMessage): void;
  emit(ev: PlayerEvent): void;
}

/** Asks for the next bag when this many pieces or fewer are left in the queue. */
const REFILL_AT = 7;

const newStats = (): PlayerStats => ({
  pieces: 0,
  lines: 0,
  sent: 0,
  received: 0,
  cancelled: 0,
  fourLineClears: 0,
  tspins: 0,
  perfectClears: 0,
  powersUsed: 0,
  powersGot: 0,
  maxCombo: 0,
  garbageRows: 0,
});

/**
 * One player's board simulation, ported from the proof of concept's `Player`: deterministic,
 * tick-driven, with no DOM or clock access. The same code runs in the browser, in the bot's
 * worker and in tests; the referee decides everything shared (bags, garbage, power-up times).
 */
export class PlayerSim {
  board: Board = emptyBoard();
  queue: DealtPiece[] = [];
  hold: DealtPiece | null = null;
  holdUsed = false;
  cur: ActivePiece | null = null;
  /** Cleared rows waiting out the clear delay, still on the board. */
  clearing: { rows: number[]; until: number } | null = null;
  meter: MeterEntry[] = [];
  /** The highest garbage id received. */
  gotGarbage = 0;
  /** Whether the last clear was difficult, so the next difficult one is back-to-back. */
  b2b = false;
  /** Clears on consecutive pieces so far, -1 when the last lock cleared nothing. */
  combo = -1;
  power: PowerKind | null = null;
  readonly fx = { fogUntil: -1, rushUntil: -1, shieldUntil: -1 };
  alive = true;
  /** Frozen until the referee's start or resume time. */
  frozen = true;
  resumeAt = -1;
  showdown: ShowdownMessage | null = null;
  result: ResultMessage | null = null;
  readonly stats: PlayerStats = newStats();
  lockTicks = 0;
  resets = 0;

  /** Gravity carried between ticks, 16.16 rows. */
  private g = 0;
  private lowY = 99;
  private spawnWait = 0;
  private lastRot = false;
  private bagPending = false;
  private lastPos = '';
  private pendingFx: PowerMessage[] = [];
  private readonly holes: Rng;

  constructor(
    readonly idx: PlayerIndex,
    seed: number,
    readonly rules: Rules,
    private readonly host: PlayerHost,
  ) {
    this.holes = mulberry32((seed ^ SALT.holes[idx]) >>> 0);
  }

  meterTotal(): number {
    return meterTotal(this.meter);
  }

  /** The current level; `activeTicks` is the match's active-play clock. */
  level(t: number, activeTicks: number): number {
    const sd = this.showdown;
    return levelAt(activeTicks, this.rules, {
      sudden: sd?.kind === 'sudden' && sd.phase === 'start',
      rush: t < this.fx.rushUntil,
    });
  }

  /** One row down; a new lowest row gives the lock-delay resets back. */
  private fall(p: ActivePiece): void {
    p.y--;
    this.lastRot = false;
    if (p.y < this.lowY) {
      this.lowY = p.y;
      this.resets = 0;
    }
  }

  grounded(): boolean {
    const p = this.cur;
    return !!p && !fits(this.board, p.t, p.r, p.x, p.y - 1);
  }

  /** A bag has been asked for and hasn't come yet. */
  get awaitingBag(): boolean {
    return this.bagPending;
  }

  /** Unfreezes once the referee's start or resume tick arrives. */
  checkResume(t: number): void {
    if (this.resumeAt >= 0 && t >= this.resumeAt) {
      this.frozen = false;
      this.resumeAt = -1;
    }
  }

  /** Advances one tick. */
  step(t: number, input: Input, activeTicks: number): void {
    this.applyFx(t);
    if (this.clearing) {
      if (t < this.clearing.until) return;
      this.board = clearRows(this.board, this.clearing.rows);
      this.clearing = null;
    }
    if (!this.cur) {
      if (this.spawnWait > 0) {
        this.spawnWait--;
        return;
      }
      if (!this.spawn()) return;
    }
    if (input.power && this.power) this.usePower();
    if (input.hold && !this.holdUsed) {
      this.doHold();
      if (!this.cur || !this.alive) return;
    }
    const p = this.cur;
    if (!p) return;
    const b = this.board;
    if (input.cw && tryRotate(b, p, 1)) this.moved(true);
    if (input.ccw && tryRotate(b, p, -1)) this.moved(true);
    if (input.dx && fits(b, p.t, p.r, p.x + input.dx, p.y)) {
      p.x += input.dx;
      this.moved(false);
    }
    if (input.hard) {
      let d = 0;
      while (fits(b, p.t, p.r, p.x, p.y - 1)) {
        p.y--;
        d++;
      }
      if (d) this.lastRot = false;
      this.lock(t);
      return;
    }
    for (let n = 0; n < (input.drop ?? 0) && fits(b, p.t, p.r, p.x, p.y - 1); n++) this.fall(p);
    let g = gravity(this.level(t, activeTicks));
    if (input.soft) g = softGravity(g, this.rules.softFactor);
    this.g += g;
    while (this.g >= FIXED_ONE) {
      this.g -= FIXED_ONE;
      if (fits(b, p.t, p.r, p.x, p.y - 1)) this.fall(p);
      else {
        this.g = 0;
        break;
      }
    }
    if (this.grounded()) {
      this.lockTicks++;
      if (this.lockTicks >= this.rules.lockDelay) this.lock(t);
    } else this.lockTicks = 0;
  }

  /** Handles a message from the referee that arrived at tick `t`. */
  onMessage(msg: ServerMessage, t: number): void {
    switch (msg.type) {
      case 'start':
        this.resumeAt = msg.goAt;
        break;
      case 'bag':
        this.queue.push(...msg.pieces);
        this.bagPending = false;
        break;
      case 'garbage':
        if (msg.id <= this.gotGarbage) break;
        this.gotGarbage = msg.id;
        this.meter.push({ id: msg.id, rows: msg.rows, ready: t + this.rules.garbageDelay });
        this.stats.received += msg.rows;
        this.host.emit({ type: 'incoming', p: this.idx, rows: msg.rows });
        break;
      case 'power':
        this.pendingFx.push(msg);
        break;
      case 'paused':
        this.frozen = true;
        this.resumeAt = -1;
        break;
      case 'resume':
        // Play resumes at `at` and not before, also for a player who missed the pause.
        this.frozen = true;
        this.resumeAt = msg.at;
        break;
      case 'showdown':
        this.showdown = msg;
        break;
      case 'result':
        this.result = msg;
        this.frozen = true;
        break;
      default:
        break;
    }
  }

  /** The position message for the opponent's view, or null when nothing changed. */
  posMessage(): PlayerMessage | null {
    const c = this.cur;
    const meter = this.meterTotal();
    const key = c ? `${c.t}${c.r}${c.x},${c.y}|${meter}` : `-|${meter}`;
    if (key === this.lastPos) return null;
    this.lastPos = key;
    return {
      type: 'pos',
      cur: c ? { t: c.t, r: c.r, x: c.x, y: c.y } : null,
      meter,
      gack: this.gotGarbage,
      power: this.power,
      hold: this.hold?.t ?? null,
    };
  }

  private moved(rotated: boolean): void {
    this.lastRot = rotated;
    if (this.lockTicks > 0 && this.resets < this.rules.maxResets) {
      this.lockTicks = 0;
      this.resets++;
    }
  }

  private spawn(): boolean {
    const next = this.queue.shift();
    if (!next) return false;
    if (this.queue.length <= REFILL_AT && !this.bagPending) {
      this.bagPending = true;
      this.host.send({ type: 'bagReq' });
    }
    return this.place(next);
  }

  private place(piece: DealtPiece): boolean {
    const sp = spawnPos(piece.t);
    const p: ActivePiece = { t: piece.t, r: 0, x: sp.x, y: sp.y, gem: piece.gem };
    this.cur = p;
    this.g = 0;
    this.lockTicks = 0;
    this.resets = 0;
    this.lowY = p.y;
    this.lastRot = false;
    if (!fits(this.board, p.t, 0, p.x, p.y)) {
      this.topOut('block out');
      return false;
    }
    return true;
  }

  private doHold(): void {
    const cur = this.cur;
    if (!cur) return;
    const held: DealtPiece = { t: cur.t, gem: cur.gem };
    this.holdUsed = true;
    if (this.hold) {
      const h = this.hold;
      this.hold = held;
      this.place(h);
    } else {
      this.hold = held;
      this.cur = null;
      this.spawn();
    }
    this.host.emit({ type: 'hold', p: this.idx });
  }

  private usePower(): void {
    const kind = this.power;
    if (!kind) return;
    this.power = null;
    this.stats.powersUsed++;
    this.host.send({ type: 'use', power: kind });
    this.host.emit({ type: 'powerUse', p: this.idx, kind });
  }

  /** Applies power-ups whose stamped tick has come, to whichever side each one affects. */
  private applyFx(t: number): void {
    if (!this.pendingFx.length) return;
    const R = this.rules;
    this.pendingFx = this.pendingFx.filter((f) => {
      if (f.at > t) return true;
      const mine = f.by === this.idx;
      if (f.kind === 'shield' && mine) {
        this.meter = [];
        this.fx.shieldUntil = f.at + R.shieldSec * TPS;
      } else if (f.kind === 'bomb' && mine) {
        const n = R.bombRows;
        this.board = dropBottomRows(this.board, n);
        // Rows waiting to clear move down with the board (the proof of concept left them behind).
        if (this.clearing) {
          this.clearing.rows = this.clearing.rows.map((y) => y - n).filter((y) => y >= 0);
        }
      } else if (f.kind === 'fog' && !mine) this.fx.fogUntil = f.at + R.powerSec * TPS;
      else if (f.kind === 'rush' && !mine) this.fx.rushUntil = f.at + R.powerSec * TPS;
      this.host.emit({ type: 'powerApply', p: this.idx, kind: f.kind, by: f.by });
      return false;
    });
  }

  private lock(t: number): void {
    const p = this.cur;
    if (!p) return;
    const R = this.rules;
    const b = this.board;
    const cells = cellsAt(p.t, p.r, p.x, p.y);
    const tspin = p.t === 'T' && this.lastRot && tSpinCorners(b, p.x, p.y);
    cells.forEach(([x, y], k) => {
      if (y < H) setCell(b, x, y, p.gem?.i === k ? gemCell(p.gem.type) : pieceCell(p.t));
    });
    this.cur = null;
    this.holdUsed = false;
    this.stats.pieces++;
    this.spawnWait = R.spawnDelay;
    if (cells.every(([, y]) => y >= VIS)) {
      this.topOut('lock out');
      return;
    }
    const rows = fullRows(b);
    const S = this.stats;
    let clear: Clear | null = null;
    let sent = 0;
    let cancelled = 0;
    let rise = 0;
    let banked: PowerKind | null = null;
    const lockEvent = (): PlayerEvent => ({
      type: 'lock',
      p: this.idx,
      piece: p.t,
      cells,
      rows,
      tspin,
      clear,
      sent,
      cancelled,
      rise,
      power: banked,
    });
    if (rows.length) {
      const lines = rows.length;
      const gems: PowerKind[] = [];
      for (const y of rows) {
        for (let x = 0; x < W; x++) {
          const kind = gemPower(cellAt(b, x, y));
          if (kind) gems.push(kind);
        }
      }
      this.clearing = { rows, until: t + R.clearDelay };
      this.combo++;
      const scored = scoreClear({
        lines,
        tspin,
        perfectClear: isEmpty(clearRows(b, rows)),
        backToBack: this.b2b,
        combo: this.combo,
      });
      clear = scored.clear;
      this.b2b = scored.difficult;
      ({ sent, cancelled } = cancelGarbage(this.meter, clear.attack));
      S.lines += lines;
      S.sent += sent;
      S.cancelled += cancelled;
      if (lines === 4) S.fourLineClears++;
      if (tspin) S.tspins++;
      if (clear.perfectClear) S.perfectClears++;
      S.maxCombo = Math.max(S.maxCombo, this.combo);
      if (sent > 0) this.host.send({ type: 'attack', rows: sent, clear });
      const gem = gems[0];
      if (gem && !this.power) {
        this.power = gem;
        S.powersGot++;
        banked = gem;
      }
    } else {
      this.combo = -1;
      const landed = landGarbage(b, this.meter, t, R.garbageCap, this.holes);
      this.board = landed.board;
      rise = landed.landed;
      S.garbageRows += rise;
      if (landed.overflow) {
        this.host.emit(lockEvent());
        this.sendLock(clear);
        this.topOut('buried');
        return;
      }
    }
    this.sendLock(clear);
    this.host.emit(lockEvent());
  }

  private sendLock(clear: Clear | null): void {
    const board = this.clearing ? clearRows(this.board, this.clearing.rows) : this.board;
    this.host.send({
      type: 'lock',
      board: snapshot(board),
      lines: clear?.lines ?? 0,
      attack: clear?.attack ?? 0,
      clear,
      meter: this.meterTotal(),
      gack: this.gotGarbage,
      hold: this.hold?.t ?? null,
      power: this.power,
      stats: { ...this.stats },
    });
  }

  private topOut(why: TopOutReason): void {
    if (!this.alive) return;
    this.alive = false;
    this.host.send({ type: 'topout', why });
    this.host.emit({ type: 'topout', p: this.idx, why });
  }
}
