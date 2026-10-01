import { Dealer } from './bag';
import { TPS, type PlayerIndex, type PowerKind } from './constants';
import type {
  AwayReason,
  ClientMessage,
  MatchState,
  PlayerMessage,
  Presence,
  ResultReason,
  ServerMessage,
} from './messages';
import type { Rules } from './rules';
import type { Seed } from './rng';

/** Ticks from `start` to go, and from a return to the resume: the 3-second countdown. */
export const COUNTDOWN_TICKS = 3 * TPS;
/** Ticks between a power-up's use and its effect on both boards. */
export const POWER_DELAY_TICKS = 12;

/** Where the referee sends messages and reports what happened. */
export interface RefereeHost {
  send(to: PlayerIndex, msg: ServerMessage): void;
  emit(ev: RefereeEvent): void;
}

/** What happened in the match, for the match feed, the developer overlay and tests. */
export type RefereeEvent =
  | { readonly type: 'state'; readonly from: MatchState; readonly to: MatchState }
  | { readonly type: 'presence'; readonly p: PlayerIndex; readonly to: Presence }
  | { readonly type: 'bag'; readonly to: PlayerIndex; readonly n: number }
  | {
      readonly type: 'route';
      readonly from: PlayerIndex;
      readonly to: PlayerIndex;
      readonly rows: number;
      readonly id: number;
      readonly doubled: boolean;
    }
  | { readonly type: 'blocked'; readonly p: PlayerIndex; readonly rows: number }
  | {
      readonly type: 'power';
      readonly by: PlayerIndex;
      readonly kind: PowerKind;
      readonly at: number;
    }
  | {
      readonly type: 'showdown';
      readonly kind: 'double' | 'sudden';
      readonly phase: 'soon' | 'start' | 'end';
    }
  | {
      readonly type: 'pause';
      readonly by: PlayerIndex;
      readonly reason: AwayReason;
      readonly budgeted: boolean;
      readonly pausesLeft: number;
      readonly reconnects: number;
    }
  | { readonly type: 'grace'; readonly by: PlayerIndex; readonly until: number }
  | { readonly type: 'extend'; readonly by: PlayerIndex; readonly deadline: number }
  | { readonly type: 'bothAway'; readonly endsAt: number }
  | { readonly type: 'bothAwayCancelled'; readonly waitingFor: PlayerIndex }
  | {
      readonly type: 'back';
      readonly by: PlayerIndex;
      readonly away: number;
      readonly resumeAt: number | null;
    }
  | { readonly type: 'rejoin'; readonly p: PlayerIndex; readonly resent: number }
  | {
      readonly type: 'result';
      readonly winner: PlayerIndex | null;
      readonly reason: ResultReason;
      readonly by: PlayerIndex | null;
    };

interface Seat {
  presence: Presence;
  reason: AwayReason | null;
  pausesLeft: number;
  reconnects: number;
  lastHb: number;
  awayAt: number;
  graceUntil: number;
  bagIdx: number;
  /** Routed garbage the player has not acknowledged yet. */
  gOut: { id: number; rows: number }[];
  gAck: number;
  shieldUntil: number;
  /** The player's last lock message: their board, meter and stats, for a rejoin. */
  lastLock: Extract<PlayerMessage, { type: 'lock' }> | null;
}

interface Pause {
  by: PlayerIndex;
  reason: AwayReason;
  since: number;
  deadline: number;
  extensions: number;
  budgeted: boolean;
}

/** Everything the referee knows, as plain JSON: what the Match DO stores in SQLite. */
export interface RefereeSnapshot {
  readonly seed: Seed;
  readonly rules: Rules;
  readonly state: MatchState;
  readonly seats: readonly [Seat, Seat];
  readonly gid: number;
  readonly activeTicks: number;
  readonly goAt: number;
  readonly resumeAt: number;
  readonly pause: Pause | null;
  readonly abandonAt: number;
  readonly sdIdx: number;
  readonly sdWarned: boolean;
  readonly showdown: { kind: 'double' | 'sudden'; until: number | null } | null;
  readonly result: RefereeResult | null;
  readonly counts: MessageCounts;
}

export interface RefereeResult {
  readonly winner: PlayerIndex | null;
  readonly reason: ResultReason;
  readonly by: PlayerIndex | null;
  readonly activeTicks: number;
  readonly ticks: number;
}

/** Messages the referee received, by kind: what the Match DO is billed for. */
export interface MessageCounts {
  in: number;
  pos: number;
  hb: number;
  lock: number;
  relayed: number;
}

const other = (i: PlayerIndex): PlayerIndex => (i === 0 ? 1 : 0);
const BOTH = [0, 1] as const;

const newSeat = (rules: Rules): Seat => ({
  presence: 'present',
  reason: null,
  pausesLeft: rules.pauseBudget,
  reconnects: rules.reconnects,
  lastHb: 0,
  awayAt: -1,
  graceUntil: -1,
  bagIdx: 0,
  gOut: [],
  gAck: 0,
  shieldUntil: -1,
  lastLock: null,
});

/**
 * The match's rules on the server side, ported from the proof of concept's `MatchDO`: it deals
 * bags, relays positions and locks, routes garbage through the acknowledgement ledger, stamps
 * power-ups, runs showdowns, and referees every pause and presence rule. Plain and serializable,
 * so the Match DO, a local bot match and the tests run the same rules.
 */
export class Referee {
  state: MatchState = 'lobby';
  activeTicks = 0;
  result: RefereeResult | null = null;
  readonly counts: MessageCounts = { in: 0, pos: 0, hb: 0, lock: 0, relayed: 0 };

  private readonly dealer: Dealer;
  private seats: [Seat, Seat];
  private gid = 0;
  private goAt = -1;
  private resumeAt = -1;
  private pause: Pause | null = null;
  private abandonAt = -1;
  private sdIdx = 0;
  private sdWarned = false;
  private showdown: { kind: 'double' | 'sudden'; until: number | null } | null = null;

  constructor(
    private readonly seed: Seed,
    readonly rules: Rules,
    private readonly host: RefereeHost,
  ) {
    this.dealer = new Dealer(seed, rules.gemChance);
    this.seats = [newSeat(rules), newSeat(rules)];
  }

  /** Rebuilds a referee from its snapshot; the dealer is rebuilt from the seed. */
  static restore(snap: RefereeSnapshot, host: RefereeHost): Referee {
    const r = new Referee(snap.seed, snap.rules, host);
    const copy = structuredClone(snap);
    r.state = copy.state;
    r.seats = [copy.seats[0], copy.seats[1]];
    r.gid = copy.gid;
    r.activeTicks = copy.activeTicks;
    r.goAt = copy.goAt;
    r.resumeAt = copy.resumeAt;
    r.pause = copy.pause;
    r.abandonAt = copy.abandonAt;
    r.sdIdx = copy.sdIdx;
    r.sdWarned = copy.sdWarned;
    r.showdown = copy.showdown;
    r.result = copy.result;
    Object.assign(r.counts, copy.counts);
    return r;
  }

  snapshot(): RefereeSnapshot {
    return structuredClone({
      seed: this.seed,
      rules: this.rules,
      state: this.state,
      seats: this.seats,
      gid: this.gid,
      activeTicks: this.activeTicks,
      goAt: this.goAt,
      resumeAt: this.resumeAt,
      pause: this.pause,
      abandonAt: this.abandonAt,
      sdIdx: this.sdIdx,
      sdWarned: this.sdWarned,
      showdown: this.showdown,
      result: this.result,
      counts: this.counts,
    });
  }

  presence(i: PlayerIndex): Presence {
    return this.seats[i].presence;
  }

  pausesLeft(i: PlayerIndex): number {
    return this.seats[i].pausesLeft;
  }

  reconnectsLeft(i: PlayerIndex): number {
    return this.seats[i].reconnects;
  }

  /** Both players are in: deal two bags each and count down to the start. */
  start(t: number): void {
    this.setState('countdown');
    this.goAt = t + COUNTDOWN_TICKS;
    for (const i of BOTH) {
      this.seats[i].lastHb = t;
      this.deal(i);
      this.deal(i);
      this.host.send(i, { type: 'start', goAt: this.goAt });
    }
  }

  /** Handles a message from player `i` that arrived at tick `t`. */
  onMessage(i: PlayerIndex, msg: ClientMessage, t: number): void {
    const P = this.seats[i];
    const o = other(i);
    this.counts.in++;
    if ('gack' in msg && msg.gack) {
      P.gAck = Math.max(P.gAck, msg.gack);
      P.gOut = P.gOut.filter((e) => e.id > P.gAck);
    }
    switch (msg.type) {
      case 'hb':
        this.counts.hb++;
        P.lastHb = t;
        return;
      case 'pos':
        this.counts.pos++;
        P.lastHb = t;
        if (this.relaying()) {
          const { cur, meter, power, hold } = msg;
          this.host.send(o, { type: 'opp', kind: 'pos', cur, meter, power, hold });
          this.counts.relayed++;
        }
        return;
      case 'bagReq':
        this.deal(i);
        return;
      case 'lock': {
        this.counts.lock++;
        P.lastHb = t;
        P.lastLock = msg;
        if (this.relaying()) this.relayLock(i);
        return;
      }
      case 'attack':
        this.route(i, msg.rows, t);
        return;
      case 'use': {
        const at = t + POWER_DELAY_TICKS;
        if (msg.power === 'shield') P.shieldUntil = at + this.rules.shieldSec * TPS;
        this.broadcast({ type: 'power', kind: msg.power, by: i, at });
        this.host.emit({ type: 'power', by: i, kind: msg.power, at });
        return;
      }
      case 'topout':
        this.end(o, 'topout', i, t);
        return;
      case 'away':
        this.onAway(i, msg.reason, t);
        return;
      case 'back':
      case 'rejoin':
        this.onBack(i, t, msg);
        return;
      case 'extend':
        if (this.pause && this.pause.by !== i) {
          this.pause.deadline += this.rules.extendSec * TPS;
          this.pause.extensions++;
          this.broadcast({ type: 'deadline', deadline: this.pause.deadline });
          this.host.emit({ type: 'extend', by: i, deadline: this.pause.deadline });
        }
        return;
      case 'leave':
        if (this.state === 'paused' && this.pause && this.pause.by !== i) {
          this.end(this.rules.leaveResult === 'win' ? i : null, 'left-while-paused', i, t);
        } else if (this.state !== 'over') this.end(o, 'left', i, t);
        return;
    }
  }

  /** Advances the referee's clock and timers to tick `t`. */
  tick(t: number): void {
    const R = this.rules;
    if (this.state === 'countdown' && t >= this.goAt) this.setState('playing');
    if (this.state === 'resuming' && t >= this.resumeAt) this.setState('playing');
    if (this.state === 'playing') {
      this.activeTicks++;
      this.runShowdowns();
      for (const i of BOTH) {
        const P = this.seats[i];
        if (P.presence === 'grace' && t >= P.graceUntil) {
          this.end(other(i), 'grace', i, t);
          return;
        }
      }
    }
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'resuming') {
      for (const i of BOTH) {
        const P = this.seats[i];
        if (P.presence === 'present' && t - P.lastHb > R.heartbeatSec * TPS)
          this.onAway(i, 'lost', t);
      }
    }
    if (this.state === 'paused') {
      if (this.abandonAt >= 0 && t >= this.abandonAt) {
        this.end(null, 'abandoned', null, t);
        return;
      }
      if (this.abandonAt < 0 && this.pause && t >= this.pause.deadline) {
        const by = this.pause.by;
        this.seats[by].presence = 'forfeit';
        this.host.emit({ type: 'presence', p: by, to: 'forfeit' });
        this.end(other(by), 'timeout', by, t);
      }
    }
  }

  private runShowdowns(): void {
    const sec = this.activeTicks / TPS;
    const sd = this.rules.showdowns[this.sdIdx];
    if (sd && !this.sdWarned && sec >= sd.at - 5) {
      this.sdWarned = true;
      this.broadcast({ type: 'showdown', kind: sd.kind, phase: 'soon', startsAt: sd.at });
      this.host.emit({ type: 'showdown', kind: sd.kind, phase: 'soon' });
    }
    if (sd && sec >= sd.at) {
      const until = sd.dur ? this.activeTicks + sd.dur * TPS : null;
      this.showdown = { kind: sd.kind, until };
      this.sdIdx++;
      this.sdWarned = false;
      this.broadcast({ type: 'showdown', kind: sd.kind, phase: 'start', until });
      this.host.emit({ type: 'showdown', kind: sd.kind, phase: 'start' });
    }
    const on = this.showdown;
    if (on && on.until !== null && this.activeTicks >= on.until) {
      this.broadcast({ type: 'showdown', kind: on.kind, phase: 'end' });
      this.host.emit({ type: 'showdown', kind: on.kind, phase: 'end' });
      this.showdown = null;
    }
  }

  private route(from: PlayerIndex, rows: number, t: number): void {
    if (this.state === 'over') return;
    const to = other(from);
    const doubled = this.showdown !== null;
    const n = rows * (doubled ? 2 : 1);
    if (this.seats[to].shieldUntil > t) {
      this.host.emit({ type: 'blocked', p: to, rows: n });
      return;
    }
    const id = ++this.gid;
    this.seats[to].gOut.push({ id, rows: n });
    this.host.send(to, { type: 'garbage', rows: n, id });
    this.host.emit({ type: 'route', from, to, rows: n, id, doubled });
  }

  private deal(i: PlayerIndex): void {
    const P = this.seats[i];
    const pieces = this.dealer.bag(P.bagIdx++);
    this.host.send(i, { type: 'bag', pieces });
    this.host.emit({ type: 'bag', to: i, n: P.bagIdx });
  }

  /** Boards are hidden while paused, so nothing about either board is relayed then. */
  private relaying(): boolean {
    return this.state !== 'paused' && this.state !== 'over';
  }

  /** Sends player `i`'s last lock to the other player as their view of `i`'s board. */
  private relayLock(i: PlayerIndex): void {
    const lock = this.seats[i].lastLock;
    if (!lock) return;
    const { board, meter, stats, lines, clear, power, hold } = lock;
    this.host.send(other(i), {
      type: 'opp',
      kind: 'lock',
      board,
      meter,
      stats,
      lines,
      clear,
      power,
      hold,
    });
    this.counts.relayed++;
  }

  private broadcast(msg: ServerMessage): void {
    this.host.send(0, msg);
    this.host.send(1, msg);
  }

  private setState(to: MatchState): void {
    if (this.state === to) return;
    const from = this.state;
    this.state = to;
    this.host.emit({ type: 'state', from, to });
  }

  private setPresence(i: PlayerIndex, to: Presence): void {
    this.seats[i].presence = to;
    this.host.emit({ type: 'presence', p: i, to });
  }

  private onAway(i: PlayerIndex, reason: AwayReason, t: number): void {
    const P = this.seats[i];
    if (this.state === 'over' || this.state === 'lobby') return;
    if (P.presence !== 'present') return;
    P.reason = reason;
    P.awayAt = reason === 'lost' ? P.lastHb : t;
    this.setPresence(i, reason === 'tab' || reason === 'step' ? 'away' : 'gone');
    if (this.state === 'paused') {
      if (this.pause && this.pause.by !== i && this.abandonAt < 0) {
        this.abandonAt = t + this.rules.abandonSec * TPS;
        this.broadcast({ type: 'bothAway', endsAt: this.abandonAt });
        this.host.emit({ type: 'bothAway', endsAt: this.abandonAt });
      }
      return;
    }
    if (reason === 'lost' && P.reconnects > 0) {
      P.reconnects--;
      this.startPause(i, reason, t, false);
    } else if (P.pausesLeft > 0) {
      P.pausesLeft--;
      this.startPause(i, reason, t, true);
    } else {
      P.graceUntil = t + this.rules.graceSec * TPS;
      this.setPresence(i, 'grace');
      this.broadcast({ type: 'grace', by: i, until: P.graceUntil });
      this.host.emit({ type: 'grace', by: i, until: P.graceUntil });
    }
  }

  private startPause(i: PlayerIndex, reason: AwayReason, t: number, budgeted: boolean): void {
    const P = this.seats[i];
    this.setState('paused');
    const deadline = t + this.rules.pauseSec * TPS;
    this.pause = { by: i, reason, since: t, deadline, extensions: 0, budgeted };
    this.broadcast({ type: 'paused', by: i, reason, deadline, pausesLeft: P.pausesLeft, budgeted });
    this.host.emit({
      type: 'pause',
      by: i,
      reason,
      budgeted,
      pausesLeft: P.pausesLeft,
      reconnects: P.reconnects,
    });
  }

  private onBack(
    i: PlayerIndex,
    t: number,
    msg: Extract<ClientMessage, { type: 'back' | 'rejoin' }>,
  ): void {
    const P = this.seats[i];
    const o = other(i);
    if (P.presence === 'present' || this.state === 'over') return;
    const away = Math.max(t - P.awayAt, msg.awayMs ? Math.round((msg.awayMs / 1000) * TPS) : 0);
    const wasGrace = P.presence === 'grace';
    P.lastHb = t;
    this.setPresence(i, 'present');
    if (msg.type === 'rejoin') {
      const resend = P.gOut.filter((e) => e.id > P.gAck);
      for (const e of resend) this.host.send(i, { type: 'garbage', rows: e.rows, id: e.id });
      this.host.emit({ type: 'rejoin', p: i, resent: resend.length });
    }
    if (wasGrace) {
      this.broadcast({ type: 'back', by: i, away, pausesLeft: P.pausesLeft });
      this.host.emit({ type: 'back', by: i, away, resumeAt: null });
      return;
    }
    const pause = this.pause;
    if (this.state !== 'paused' || !pause) return;
    if (this.abandonAt >= 0) {
      // One of two absent players is back: the session timer stops and the pause goes on,
      // now waiting for whoever is still away, with a fresh deadline if it was the returner's.
      this.abandonAt = -1;
      if (pause.by === i) {
        pause.by = o;
        pause.reason = this.seats[o].reason ?? 'tab';
        pause.deadline = t + this.rules.pauseSec * TPS;
      }
      this.broadcast({
        type: 'paused',
        by: pause.by,
        reason: pause.reason,
        deadline: pause.deadline,
        pausesLeft: this.seats[pause.by].pausesLeft,
        budgeted: true,
      });
      this.host.emit({ type: 'bothAwayCancelled', waitingFor: pause.by });
      return;
    }
    if (pause.by !== i) return;
    this.setState('resuming');
    this.resumeAt = t + COUNTDOWN_TICKS;
    this.broadcast({
      type: 'resume',
      at: this.resumeAt,
      by: i,
      away,
      pausesLeft: P.pausesLeft,
      free: !pause.budgeted,
    });
    this.host.emit({ type: 'back', by: i, away, resumeAt: this.resumeAt });
    this.pause = null;
    // Views were not updated while paused; bring both up to date for the countdown.
    for (const j of BOTH) this.relayLock(j);
  }

  private end(
    winner: PlayerIndex | null,
    reason: ResultReason,
    by: PlayerIndex | null,
    t: number,
  ): void {
    if (this.state === 'over') return;
    this.setState('over');
    this.result = { winner, reason, by, activeTicks: this.activeTicks, ticks: t };
    this.broadcast({ type: 'result', winner, reason, by });
    this.host.emit({ type: 'result', winner, reason, by });
  }
}
