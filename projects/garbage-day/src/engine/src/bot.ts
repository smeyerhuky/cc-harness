import { cellAt, clearRows, EMPTY, fullRows, height, holes, pieceCell, setCell } from './board';
import { H, SALT, W, type PieceType } from './constants';
import { cellsAt, fits, type Rotation, spawnPos } from './pieces';
import { type Input, NO_INPUT, type PlayerSim } from './player';
import { mulberry32, type Rng } from './rng';

/** How the bot values line clears: take any, prefer big ones, or build for four-line clears. */
export type BotStyle = 'safe' | 'mixed' | 'fourLine';

export interface BotConfig {
  /** Ticks to think before moving a new piece, plus up to `jitter` more. */
  readonly think: number;
  readonly jitter: number;
  /** Ticks between moves. */
  readonly move: number;
  /** Random noise added to each placement's score: more noise, worse choices. */
  readonly noise: number;
  readonly style: BotStyle;
  /** Whether the bot considers holding. */
  readonly hold: boolean;
}

// Skill and speed 1–10 (kb/design/architecture.md, "Bots"), as tables so no bot decision
// depends on Math.pow. Noise falls geometrically from 1.4 to 0.05; think and move time fall
// linearly from the proof of concept's rookie (26, 9 ticks) to faster than its pro (4, 2 ticks).
const NOISE = [1.4, 0.967, 0.668, 0.461, 0.318, 0.22, 0.152, 0.105, 0.072, 0.05] as const;
const THINK = [26, 24, 21, 19, 16, 14, 11, 9, 6, 4] as const;
const JITTER = [14, 13, 12, 10, 9, 8, 7, 6, 5, 4] as const;
const MOVE = [9, 8, 7, 7, 6, 5, 4, 4, 3, 2] as const;

const clampSetting = (v: number): number => Math.min(10, Math.max(1, Math.round(v))) - 1;

/** The bot for a skill and a speed, each from 1 (weakest, slowest) to 10. */
export function botConfig(skill: number, speed: number): BotConfig {
  const s = clampSetting(skill);
  const v = clampSetting(speed);
  return {
    noise: NOISE[s] ?? 1.4,
    style: s < 3 ? 'safe' : s < 6 ? 'mixed' : 'fourLine',
    hold: s >= 2,
    think: THINK[v] ?? 26,
    jitter: JITTER[v] ?? 14,
    move: MOVE[v] ?? 9,
  };
}

interface Plan {
  hold: boolean;
  afterHold: boolean;
  r: Rotation;
  x: number;
}

/**
 * A bot player, ported from the proof of concept's `Bot`. It reads only its own simulation and
 * turns a chosen placement into per-tick input, so it plays under exactly the rules a person
 * does. It cannot tuck or spin, so it never makes T-spins.
 */
export class Bot {
  private readonly rng: Rng;
  private plan: Plan | null = null;
  private key = '';
  private wait = 0;
  private fails = 0;
  private powerWait = 40;

  constructor(
    private readonly sim: PlayerSim,
    seed: number,
    readonly cfg: BotConfig,
  ) {
    this.rng = mulberry32((seed ^ SALT.bot ^ Math.imul(sim.idx + 1, 7919)) >>> 0);
  }

  /** This tick's input. */
  tick(t: number): Input {
    const P = this.sim;
    const p = P.cur;
    if (!p) return NO_INPUT;
    const inp: { -readonly [K in keyof Input]: Input[K] } = {};
    if (P.power) {
      if (this.powerWait > 0) this.powerWait--;
      else if (this.wantPower()) {
        inp.power = true;
        this.powerWait = 40;
      }
    }
    const key = `${P.stats.pieces}:${P.holdUsed}`;
    if (key !== this.key) {
      if (!(this.plan?.afterHold && P.holdUsed)) {
        this.plan = null;
        this.wait = this.cfg.think + Math.floor(this.rng() * this.cfg.jitter);
      }
      this.key = key;
      this.fails = 0;
    }
    if (this.wait > 0) {
      this.wait--;
      return inp;
    }
    this.plan ??= this.decide();
    const pl = this.plan;
    this.wait = this.cfg.move * (t < P.fx.fogUntil ? 2 : 1);
    if (pl.hold && !P.holdUsed) {
      inp.hold = true;
      pl.hold = false;
      pl.afterHold = true;
      return inp;
    }
    if (p.r !== pl.r && this.fails < 3) {
      const d = (pl.r - p.r + 4) % 4;
      const to = ((p.r + (d === 3 ? 3 : 1)) % 4) as Rotation;
      if (d === 3) inp.ccw = true;
      else inp.cw = true;
      if (!fits(P.board, p.t, to, p.x, p.y)) this.fails++;
      return inp;
    }
    if (p.x !== pl.x && this.fails < 3) {
      const dx = pl.x > p.x ? 1 : -1;
      if (!fits(P.board, p.t, p.r, p.x + dx, p.y)) {
        this.fails++;
        if (this.fails >= 3) inp.hard = true;
        return inp;
      }
      inp.dx = dx;
      return inp;
    }
    inp.hard = true;
    return inp;
  }

  private wantPower(): boolean {
    const P = this.sim;
    if (P.power === 'shield') return P.meterTotal() >= 3;
    if (P.power === 'bomb') return height(P.board) >= 11 || holes(P.board) >= 6;
    return true;
  }

  private decide(): Plan {
    const P = this.sim;
    const cur = P.cur;
    if (!cur) return { hold: false, afterHold: false, r: 0, x: 0 };
    const alt = P.hold?.t ?? P.queue[0]?.t ?? null;
    let best = this.best(cur.t);
    let hold = false;
    if (this.cfg.hold && alt && alt !== cur.t && !P.holdUsed) {
      const b2 = this.best(alt);
      if (b2 && (!best || b2.score > best.score + 0.35)) {
        best = b2;
        hold = true;
      }
    }
    if (!best) return { hold: false, afterHold: false, r: cur.r, x: cur.x };
    return { hold, afterHold: false, r: best.r, x: best.x };
  }

  /** The best reachable placement for piece `t`, straight down from its spawn row. */
  private best(t: PieceType): { r: Rotation; x: number; score: number } | null {
    const b = this.sim.board;
    const sp = spawnPos(t);
    let best: { r: Rotation; x: number; score: number } | null = null;
    const rots: readonly Rotation[] = t === 'O' ? [0] : [0, 1, 2, 3];
    for (const r of rots) {
      if (!fits(b, t, r, sp.x, sp.y)) continue;
      for (let x = -2; x < W; x++) {
        if (!fits(b, t, r, x, sp.y)) continue;
        let reachable = true;
        const s = Math.sign(x - sp.x);
        for (let xx = sp.x; xx !== x; xx += s) {
          if (!fits(b, t, r, xx + s, sp.y)) {
            reachable = false;
            break;
          }
        }
        if (!reachable) continue;
        let y = sp.y;
        while (fits(b, t, r, x, y - 1)) y--;
        const score = this.score(t, r, x, y);
        if (!best || score > best.score) best = { r, x, score };
      }
    }
    return best;
  }

  private score(t: PieceType, r: Rotation, x: number, y: number): number {
    const b = this.sim.board.slice();
    for (const [cx, cy] of cellsAt(t, r, x, y)) if (cy < H) setCell(b, cx, cy, pieceCell(t));
    const rows = fullRows(b);
    const lines = rows.length;
    const nb = lines ? clearRows(b, rows) : b;
    const hs: number[] = [];
    let hole = 0;
    for (let c = 0; c < W; c++) {
      let top = -1;
      for (let yy = H - 1; yy >= 0; yy--) {
        if (cellAt(nb, c, yy) !== EMPTY) {
          top = yy;
          break;
        }
      }
      hs.push(top + 1);
      for (let yy = top - 1; yy >= 0; yy--) if (cellAt(nb, c, yy) === EMPTY) hole++;
    }
    let agg = 0;
    let bump = 0;
    let maxH = 0;
    for (let c = 0; c < W; c++) {
      const h = hs[c] ?? 0;
      agg += h;
      maxH = Math.max(maxH, h);
      if (c < W - 1) bump += Math.abs(h - (hs[c + 1] ?? 0));
    }
    const right = hs[W - 1] ?? 0;
    const danger = this.sim.meterTotal() >= 4 || maxH > 12;
    let s = -0.51 * agg - 0.36 * hole * 1.4 - 0.18 * bump;
    const style = this.cfg.style;
    if (style === 'safe' || danger) s += 0.76 * lines * 1.6;
    else if (style === 'fourLine') {
      s += lines === 4 ? 14 : -1.8 * lines;
      s -= 1.1 * right;
      s += 0.18 * Math.abs((hs[W - 2] ?? 0) - right);
    } else {
      s += lines >= 3 ? 3 * lines : 0.5 * lines;
      s -= 0.2 * right;
    }
    if (maxH > 14) s -= (maxH - 14) * 3;
    return s + (this.rng() - 0.5) * this.cfg.noise;
  }
}
