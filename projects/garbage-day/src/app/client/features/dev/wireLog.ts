import type { Session, WireEntry } from '../../state/MatchSession';
import type { Store } from '../../state/storeContext';

// The overlay's record of one match's messages (GD-TICKET-024). It listens only while the overlay
// shows it, keeps the newest messages in two buffers, and hands React a new view at most four
// times a second. The match never waits on it: the session passes each message on unchanged
// and steps by the clock, whatever the overlay costs.

/** Messages kept in each buffer. */
export const WIRE_LOG_SIZE = 200;
/** How often the view refreshes, in ms. */
export const WIRE_REFRESH_MS = 250;

/** Positions and heartbeats: many a second, so the log hides them unless asked. */
export function isChatter(e: WireEntry): boolean {
  const m = e.msg;
  return m.type === 'pos' || m.type === 'hb' || (m.type === 'opp' && m.kind === 'pos');
}

export interface WireLogView {
  /** Messages seen since the log began listening. */
  readonly total: number;
  /** The newest messages, newest first. */
  readonly all: readonly WireEntry[];
  /** The same without positions and heartbeats. */
  readonly events: readonly WireEntry[];
  readonly tick: number;
  readonly referee: string;
}

export class WireLog implements Store<WireLogView> {
  private all: WireEntry[] = [];
  private events: WireEntry[] = [];
  private total = 0;
  private view: WireLogView;
  private readonly listeners = new Set<() => void>();
  private stop: (() => void) | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly session: Session) {
    this.view = this.make();
  }

  readonly subscribe = (onChange: () => void): (() => void) => {
    this.listeners.add(onChange);
    if (this.listeners.size === 1) this.start();
    return () => {
      this.listeners.delete(onChange);
      if (this.listeners.size === 0) this.end();
    };
  };

  readonly getSnapshot = (): WireLogView => this.view;

  private start(): void {
    this.stop = this.session.onWire((e) => {
      this.total++;
      this.all = keep(this.all, e);
      if (!isChatter(e)) this.events = keep(this.events, e);
    });
    this.timer = setInterval(() => this.refresh(), WIRE_REFRESH_MS);
  }

  private end(): void {
    this.stop?.();
    this.stop = null;
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  private refresh(): void {
    const v = this.view;
    const now = this.session.inspect();
    if (v.total === this.total && v.tick === now.tick && v.referee === now.referee) return;
    this.view = this.make();
    this.listeners.forEach((l) => l());
  }

  private make(): WireLogView {
    const now = this.session.inspect();
    return {
      total: this.total,
      all: this.all.slice(-WIRE_LOG_SIZE).reverse(),
      events: this.events.slice(-WIRE_LOG_SIZE).reverse(),
      tick: now.tick,
      referee: now.referee,
    };
  }
}

/** Appends `e`, trimming the buffer back to size once it is twice over, so trims are rare. */
function keep(buffer: WireEntry[], e: WireEntry): WireEntry[] {
  buffer.push(e);
  return buffer.length > 2 * WIRE_LOG_SIZE ? buffer.slice(-WIRE_LOG_SIZE) : buffer;
}

const short = (v: unknown): string => {
  if (v === null || v === undefined) return '–';
  if (typeof v === 'string') return v.length > 16 ? `${v.slice(0, 16)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v !== 'object') return typeof v;
  if (Array.isArray(v)) return `[${v.length}]`;
  const json = JSON.stringify(v);
  return json.length > 32 ? `${json.slice(0, 32)}…` : json;
};

/** A detail line's longest length: the whole message is a hover away. */
const DETAIL_MAX = 72;

/** A message's fields after its type, short enough for a line or two. */
export function detail(e: WireEntry): string {
  const line = Object.entries(e.msg)
    .filter(([k]) => k !== 'type')
    .map(([k, v]) => `${k} ${short(v)}`)
    .join(' · ');
  return line.length > DETAIL_MAX ? `${line.slice(0, DETAIL_MAX)}…` : line;
}
