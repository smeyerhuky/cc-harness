import { dropBottomRows, emptyBoard, parse, type Board } from './board';
import { TPS, type PieceType, type PlayerIndex, type PowerKind } from './constants';
import type { Controller } from './local-match';
import type {
  ClientMessage,
  PlayerEvent,
  PlayerStats,
  PowerMessage,
  ResultMessage,
  ServerMessage,
} from './messages';
import type { ActivePiece } from './pieces';
import { NO_INPUT, PlayerSim } from './player';
import { COUNTDOWN_TICKS } from './referee';
import { DEFAULT_RULES, type Rules } from './rules';

// One player's side of a match played over a network (GD-STORY-011): this player's simulation,
// stepped as `LocalMatch` steps each of its two, and what the referee says of the other player.
// The referee is the Match DO's; this class only hears it. It is pure, like the rest of the
// engine, so the client wraps it with a socket and the tests wrap it with a referee.

type OppMessage = Extract<ServerMessage, { type: 'opp' }>;

/**
 * What a player knows of their opponent: the board as of the opponent's last lock, and where the
 * falling piece, meter, hold and power-up were at their last position. Never their next pieces.
 * The power-ups that land on them land here too, on the referee's tick, as they do on the
 * opponent's own screen (GD-STORY-012).
 */
export class OpponentView {
  board: Board = emptyBoard();
  /** The falling piece; its gem, if any, isn't relayed. */
  cur: ActivePiece | null = null;
  meter = 0;
  hold: PieceType | null = null;
  power: PowerKind | null = null;
  stats: PlayerStats | null = null;
  /** Their effects, as their own simulation keeps them. */
  readonly fx = { fogUntil: -1, rushUntil: -1, shieldUntil: -1 };
  /** Power-ups stamped to land on them, until their tick. */
  private pending: PowerMessage[] = [];

  /**
   * A power-up the referee stamped: kept if it lands on the opponent, at seat `them`. Shield and
   * Bomb land on whoever used them; Fog and Rush on the other player.
   */
  stamp(msg: PowerMessage, them: PlayerIndex): void {
    const own = msg.kind === 'shield' || msg.kind === 'bomb';
    if ((msg.by === them) === own) this.pending.push(msg);
  }

  /** Lands the power-ups due by tick `t`, as `PlayerSim` does; returns them. */
  land(t: number, rules: Rules): PowerMessage[] {
    const due = this.pending.filter((f) => f.at <= t);
    if (!due.length) return due;
    this.pending = this.pending.filter((f) => f.at > t);
    for (const f of due) {
      if (f.kind === 'shield') {
        this.meter = 0;
        this.fx.shieldUntil = f.at + rules.shieldSec * TPS;
      } else if (f.kind === 'bomb') this.board = dropBottomRows(this.board, rules.bombRows);
      else if (f.kind === 'fog') this.fx.fogUntil = f.at + rules.powerSec * TPS;
      else this.fx.rushUntil = f.at + rules.powerSec * TPS;
    }
    return due;
  }

  apply(msg: OppMessage): void {
    this.meter = msg.meter;
    this.hold = msg.hold;
    this.power = msg.power;
    if (msg.kind === 'pos') {
      this.cur = msg.cur ? { ...msg.cur, gem: null } : null;
    } else {
      this.board = parse(msg.board);
      this.stats = msg.stats;
      this.cur = null;
    }
  }
}

/** What comes with `start` besides the engine's message: this player's seat and hole seed. */
export interface StartExtras {
  readonly you?: PlayerIndex;
  readonly holes?: number;
}

export interface ClientMatchOptions {
  /** This player's seat, until `start` says otherwise. */
  readonly seat?: PlayerIndex;
  readonly rules?: Partial<Rules>;
  /** Sends a message to the referee. */
  readonly send: (msg: ClientMessage) => void;
  /** Events from this player's simulation, and the opponent's power-ups as they are used and land. */
  readonly onPlayerEvent?: (ev: PlayerEvent) => void;
}

export class ClientMatch {
  readonly rules: Rules;
  /** This player's tick: set from `start`, then one a step. */
  t = 0;
  /** Ticks of play, as the referee counts them: from the go tick, while not frozen. */
  activeTicks = 0;
  /** This player's simulation, made when `start` brings its garbage-hole seed. */
  me: PlayerSim | null = null;
  readonly opponent = new OpponentView();
  controller: Controller | null = null;
  result: ResultMessage | null = null;
  /**
   * The connection is down (GD-TICKET-013): this player stands still from the moment it drops,
   * and what it would send waits in the outbox.
   */
  offline = false;
  /** What arrived before `start`: the first two bags. */
  private early: ServerMessage[] = [];
  /** Game messages made while offline, in order; positions and heartbeats aren't kept. */
  private readonly outbox: ClientMessage[] = [];

  constructor(private readonly o: ClientMatchOptions) {
    this.rules = { ...DEFAULT_RULES, ...o.rules };
  }

  /** The connection dropped: freeze at once, and hold what would be sent. */
  drop(): void {
    if (this.offline || this.result) return;
    this.offline = true;
  }

  /**
   * Connected again, and the new socket has said hello: send what waited, in order, then `rejoin`
   * with the last garbage received, so the referee resends the rest. This player stays frozen
   * until the referee says when play resumes, which it always does for a rejoin. A bag asked
   * for and never heard is asked for again.
   */
  rejoin(awayMs?: number): void {
    if (!this.offline) return;
    this.offline = false;
    for (const m of this.outbox.splice(0)) this.o.send(m);
    const P = this.me;
    if (P && !this.result) {
      P.frozen = true;
      P.resumeAt = -1;
    }
    this.o.send({
      type: 'rejoin',
      gack: P?.gotGarbage ?? 0,
      ...(awayMs === undefined ? {} : { awayMs: Math.round(awayMs) }),
    });
    if (P?.awaitingBag) this.o.send({ type: 'bagReq' });
  }

  /** This player's seat at the referee: from `start`, or the option until then. */
  get seat(): PlayerIndex {
    return this.me?.idx ?? this.o.seat ?? 0;
  }

  /**
   * A message from the referee. `start` brings this player's seat and garbage-hole seed with it:
   * power-ups name players by seat, so the simulation must sit where the referee seated it.
   */
  receive(msg: ServerMessage, extras: StartExtras = {}): void {
    if (msg.type === 'opp') {
      this.opponent.apply(msg);
      return;
    }
    if (msg.type === 'power') {
      const them: PlayerIndex = this.seat === 0 ? 1 : 0;
      this.opponent.stamp(msg, them);
      if (msg.by === them) this.o.onPlayerEvent?.({ type: 'powerUse', p: them, kind: msg.kind });
    }
    if (msg.type === 'result') this.result = msg;
    if (!this.me) {
      if (msg.type !== 'start') {
        this.early.push(msg);
        return;
      }
      this.me = new PlayerSim(extras.you ?? this.seat, extras.holes ?? 0, this.rules, {
        send: (m) => this.send(m),
        emit: (ev) => this.o.onPlayerEvent?.(ev),
      });
      // `start` is sent as the countdown begins: this player's clock is set there, whatever it
      // counted while waiting.
      this.t = msg.goAt - COUNTDOWN_TICKS;
      for (const m of this.early.splice(0)) this.me.onMessage(m, this.t);
    }
    this.me.onMessage(msg, this.t);
  }

  /** Advances this player one tick, sending a position every fourth tick when it has changed. */
  step(): void {
    const t = ++this.t;
    const P = this.me;
    if (!P) return;
    const them: PlayerIndex = P.idx === 0 ? 1 : 0;
    for (const f of this.opponent.land(t, this.rules)) {
      this.o.onPlayerEvent?.({ type: 'powerApply', p: them, kind: f.kind, by: f.by });
    }
    P.checkResume(t);
    if (P.frozen || this.offline || !P.alive || this.result) return;
    this.activeTicks++;
    P.step(t, this.controller?.tick(t) ?? NO_INPUT, this.activeTicks);
    if (t % 4 === P.idx * 2) {
      const pos = P.posMessage();
      if (pos) this.send(pos);
    }
  }

  /** Sends a message to the referee, or, while offline, keeps it for the rejoin. */
  send(msg: ClientMessage): void {
    if (!this.offline) this.o.send(msg);
    else if (msg.type !== 'hb' && msg.type !== 'pos') this.outbox.push(msg);
  }
}
