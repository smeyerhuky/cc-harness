import { emptyBoard, parse, type Board } from './board';
import type { PieceType, PlayerIndex, PowerKind } from './constants';
import type { Controller } from './local-match';
import type {
  ClientMessage,
  PlayerEvent,
  PlayerStats,
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
 */
export class OpponentView {
  board: Board = emptyBoard();
  /** The falling piece; its gem, if any, isn't relayed. */
  cur: ActivePiece | null = null;
  meter = 0;
  hold: PieceType | null = null;
  power: PowerKind | null = null;
  stats: PlayerStats | null = null;

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
  /** What arrived before `start`: the first two bags. */
  private early: ServerMessage[] = [];

  constructor(private readonly o: ClientMatchOptions) {
    this.rules = { ...DEFAULT_RULES, ...o.rules };
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
    if (msg.type === 'result') this.result = msg;
    if (!this.me) {
      if (msg.type !== 'start') {
        this.early.push(msg);
        return;
      }
      this.me = new PlayerSim(extras.you ?? this.seat, extras.holes ?? 0, this.rules, {
        send: (m) => this.o.send(m),
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
    P.checkResume(t);
    if (P.frozen || !P.alive || this.result) return;
    this.activeTicks++;
    P.step(t, this.controller?.tick(t) ?? NO_INPUT, this.activeTicks);
    if (t % 4 === P.idx * 2) {
      const pos = P.posMessage();
      if (pos) this.o.send(pos);
    }
  }
}
