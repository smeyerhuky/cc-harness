import { snapshot } from './board';
import { SALT, TPS, type PlayerIndex } from './constants';
import type {
  AwayReason,
  ClientMessage,
  PlayerEvent,
  PlayerStats,
  ServerMessage,
} from './messages';
import { type Input, NO_INPUT, PlayerSim } from './player';
import { type MessageCounts, Referee, type RefereeEvent, type RefereeResult } from './referee';
import { mulberry32, type Rng } from './rng';
import { DEFAULT_RULES, type Rules } from './rules';

/** Anything that produces a player's input each tick: a bot, a scripted test, a keyboard. */
export interface Controller {
  tick(t: number): Input;
}

/** Something to do once the match has been active for `at` seconds. */
export interface ScriptStep {
  readonly at: number;
  readonly run: (m: LocalMatch) => void;
}

export interface LocalMatchOptions {
  readonly seed: number;
  readonly rules?: Partial<Rules>;
  /** One-way latency per player in milliseconds, plus up to `jitterMs` more per message. */
  readonly latencyMs?: readonly [number, number];
  readonly jitterMs?: number;
  readonly script?: readonly ScriptStep[];
  readonly onPlayerEvent?: (ev: PlayerEvent) => void;
  readonly onRefereeEvent?: (ev: RefereeEvent) => void;
  /**
   * Passes every message through these on its way, as a real connection would: the protocol's
   * tests encode and parse each one to show a match over the wire plays out the same, and the
   * app's developer overlay logs them. Each is told whose connection the message is on.
   */
  readonly wire?: {
    readonly client: (msg: ClientMessage, from: PlayerIndex) => ClientMessage;
    readonly server: (msg: ServerMessage, to: PlayerIndex) => ServerMessage;
  };
}

interface Packet {
  readonly at: number;
  readonly seq: number;
  readonly to: PlayerIndex | 'referee';
  readonly from: PlayerIndex;
  readonly msg: ClientMessage | ServerMessage;
}

/** A player's connection as the harness models it. */
interface Link {
  away: boolean;
  offline: boolean;
  closed: boolean;
  /** Messages kept while disconnected, sent on rejoin. */
  outbox: ClientMessage[];
}

const newLink = (): Link => ({ away: false, offline: false, closed: false, outbox: [] });

/** What a finished (or stopped) match comes to: what golden replays compare. */
export interface MatchSummary {
  readonly result: RefereeResult | null;
  readonly ticks: number;
  readonly activeTicks: number;
  /** FNV-1a hashes of both final boards' snapshots. */
  readonly boardHashes: readonly [string, string];
  readonly stats: readonly [PlayerStats, PlayerStats];
  readonly pausesLeft: readonly [number, number];
  readonly reconnectsLeft: readonly [number, number];
  readonly counts: MessageCounts;
  /** Messages into the referee per minute of wall-clock match time: the billing measure. */
  readonly messagesPerMinute: number;
}

/** A 32-bit FNV-1a hash as 8 hex digits. */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/**
 * Two players' simulations and a referee joined by a modelled network with latency and jitter,
 * headless and deterministic: the proof of concept's `Match`, kept as the harness for tests,
 * golden replays and offline play. Presence changes (a hidden tab, a dropped connection, a closed
 * tab) are driven through `away` and `back`, as the browser would.
 */
export class LocalMatch {
  readonly rules: Rules;
  readonly players: readonly [PlayerSim, PlayerSim];
  readonly referee: Referee;
  readonly controllers: [Controller | null, Controller | null] = [null, null];
  t = 0;
  over = false;

  private readonly latencyMs: readonly [number, number];
  private readonly jitterMs: number;
  private readonly netRng: Rng;
  private net: Packet[] = [];
  private seq = 0;
  private readonly channelAt = new Map<string, number>();
  private timers: { at: number; run: (m: LocalMatch) => void }[] = [];
  private readonly script: { at: number; run: (m: LocalMatch) => void; done: boolean }[];
  private readonly link: readonly [Link, Link] = [newLink(), newLink()];

  constructor(private readonly o: LocalMatchOptions) {
    const seed = o.seed >>> 0;
    this.rules = { ...DEFAULT_RULES, ...o.rules };
    this.latencyMs = o.latencyMs ?? [40, 40];
    this.jitterMs = o.jitterMs ?? 12;
    this.netRng = mulberry32((seed ^ SALT.net) >>> 0);
    this.script = (o.script ?? []).map((s) => ({ ...s, done: false }));
    const playerHost = (i: PlayerIndex) => ({
      send: (msg: ClientMessage) => this.clientSend(i, msg),
      emit: (ev: PlayerEvent) => o.onPlayerEvent?.(ev),
    });
    this.players = [
      new PlayerSim(0, seed, this.rules, playerHost(0)),
      new PlayerSim(1, seed, this.rules, playerHost(1)),
    ];
    this.referee = new Referee(seed, this.rules, {
      send: (to, msg) => this.serverSend(to, msg),
      emit: (ev) => {
        if (ev.type === 'result') this.over = true;
        o.onRefereeEvent?.(ev);
      },
    });
  }

  start(): this {
    this.referee.start(this.t);
    return this;
  }

  /** Runs `fn` after `ticks` ticks. */
  later(ticks: number, run: (m: LocalMatch) => void): void {
    this.timers.push({ at: this.t + ticks, run });
  }

  /** Sends a control message from player `i`'s client, as if a button was pressed. */
  send(i: PlayerIndex, msg: ClientMessage): void {
    this.clientSend(i, msg);
  }

  /**
   * Player `i` goes away: a hidden tab or a step away tells the referee; a closed tab tells it and
   * disconnects; a lost connection just goes silent, and the referee notices by heartbeats.
   */
  away(i: PlayerIndex, reason: AwayReason): void {
    const L = this.link[i];
    if (L.away || L.offline || !this.players[i].alive || this.over) return;
    if (reason === 'lost') {
      L.offline = true;
      return;
    }
    L.away = true;
    this.clientSend(i, { type: 'away', reason });
    if (reason === 'closed') L.closed = true;
  }

  /** Player `i` comes back: rejoins after a closed tab or a lost connection, else reports back. */
  back(i: PlayerIndex, awayMs?: number): void {
    const L = this.link[i];
    const P = this.players[i];
    if (this.over) return;
    const extra = awayMs === undefined ? {} : { awayMs };
    if (L.offline || L.closed) {
      const wasClosed = L.closed;
      L.offline = false;
      L.closed = false;
      L.away = false;
      // A closed tab loses the piece in hand; it is dealt again.
      if (wasClosed && P.cur) {
        P.queue.unshift({ t: P.cur.t, gem: P.cur.gem });
        P.cur = null;
      }
      const out = L.outbox.splice(0);
      for (const msg of out) this.clientSend(i, msg);
      // It missed the pause while gone: frozen until the referee says when play resumes, so it
      // resumes on the same tick as the other player (pause and presence, "Returning").
      P.frozen = true;
      P.resumeAt = -1;
      this.clientSend(i, { type: 'rejoin', gack: P.gotGarbage, ...extra });
    } else if (L.away) {
      L.away = false;
      this.clientSend(i, { type: 'back', ...extra });
    }
  }

  /** Advances the whole match one tick. */
  step(): void {
    const t = ++this.t;
    if (this.net.length) {
      const due = this.net.filter((e) => e.at <= t).sort((a, b) => a.at - b.at || a.seq - b.seq);
      if (due.length) {
        this.net = this.net.filter((e) => e.at > t);
        for (const e of due) {
          if (e.to === 'referee') this.referee.onMessage(e.from, e.msg as ClientMessage, t);
          else if (!this.link[e.to].offline && !this.link[e.to].closed) {
            this.players[e.to].onMessage(e.msg as ServerMessage, t);
          }
        }
      }
    }
    this.referee.tick(t);
    if (this.timers.length) {
      const due = this.timers.filter((x) => x.at <= t);
      if (due.length) {
        this.timers = this.timers.filter((x) => x.at > t);
        for (const x of due) x.run(this);
      }
    }
    if (this.script.length && !this.over) {
      const sec = this.referee.activeTicks / TPS;
      for (const s of this.script) {
        if (!s.done && sec >= s.at && this.referee.state === 'playing') {
          s.done = true;
          s.run(this);
        }
      }
    }
    for (const i of [0, 1] as const) {
      const P = this.players[i];
      const L = this.link[i];
      P.checkResume(t);
      if (!L.offline && !L.closed && t % TPS === i * 30) this.clientSend(i, { type: 'hb' });
      if (P.frozen || L.away || L.offline || !P.alive || this.over) continue;
      P.step(t, this.controllers[i]?.tick(t) ?? NO_INPUT, this.referee.activeTicks);
      if (t % 4 === i * 2) {
        const pos = P.posMessage();
        if (pos) this.clientSend(i, pos);
      }
    }
  }

  /** Runs until the match ends or `maxTicks` more ticks pass. */
  run(maxTicks: number): this {
    for (let n = 0; !this.over && n < maxTicks; n++) this.step();
    return this;
  }

  summary(): MatchSummary {
    const r = this.referee;
    const [a, b] = this.players;
    return {
      result: r.result,
      ticks: this.t,
      activeTicks: r.activeTicks,
      boardHashes: [fnv1a(snapshot(a.board)), fnv1a(snapshot(b.board))],
      stats: [{ ...a.stats }, { ...b.stats }],
      pausesLeft: [r.pausesLeft(0), r.pausesLeft(1)],
      reconnectsLeft: [r.reconnectsLeft(0), r.reconnectsLeft(1)],
      counts: { ...r.counts },
      messagesPerMinute: this.t ? Math.round((r.counts.in * TPS * 60 * 10) / this.t) / 10 : 0,
    };
  }

  private latency(i: PlayerIndex, channel: string): number {
    const ticks = Math.max(
      1,
      Math.round(((this.latencyMs[i] + this.netRng() * this.jitterMs) / 1000) * TPS),
    );
    // Messages on one channel arrive in order, as on a WebSocket.
    const at = Math.max(this.t + ticks, this.channelAt.get(channel) ?? 0);
    this.channelAt.set(channel, at);
    return at;
  }

  private clientSend(i: PlayerIndex, msg: ClientMessage): void {
    const L = this.link[i];
    if (L.offline || L.closed) {
      if (msg.type !== 'hb' && msg.type !== 'pos') L.outbox.push(msg);
      return;
    }
    const sent = this.o.wire ? this.o.wire.client(msg, i) : msg;
    this.net.push({
      at: this.latency(i, `up${i}`),
      seq: this.seq++,
      to: 'referee',
      from: i,
      msg: sent,
    });
  }

  private serverSend(i: PlayerIndex, msg: ServerMessage): void {
    const L = this.link[i];
    if (L.offline || L.closed) return;
    const sent = this.o.wire ? this.o.wire.server(msg, i) : msg;
    this.net.push({ at: this.latency(i, `down${i}`), seq: this.seq++, to: i, from: i, msg: sent });
  }
}
