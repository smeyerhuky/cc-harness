// How good the connection to the Match DO is, from the round trips of its pings (GD-TICKET-017).
// The PRD holds play to 150 ms one way and asks it to degrade visibly above that: past it for
// more than 3 s the connection reads as poor, and the rival's panel says "Slow connection".

/** Good, fair, or poor: the indicator beside the clock. */
export type LinkQuality = 'good' | 'fair' | 'poor';

/** One way, in ms: good up to this. */
const GOOD_MS = 100;
/** One way, in ms: the PRD's bound for play. Past it, the connection is slow. */
const SLOW_MS = 150;
/** Slow for this long, in ms, and the connection is poor. */
export const SLOW_FOR_MS = 3000;
/**
 * What a round trip spends being answered rather than travelling, in ms: the page's and the
 * Match DO's handling of the ping and pong. Measured at 5–6 ms against `pnpm dev` with no delay;
 * without it, a link of exactly 150 ms each way would read as slow.
 */
const ANSWER_MS = 10;
/** The round trips it judges by: the middle one of the last three, so one late pong doesn't. */
const SAMPLES = 3;

export class QualityMeter {
  quality: LinkQuality = 'good';
  private trips: number[] = [];
  /** When the delay went past `SLOW_MS`, in ms, while it stays there. */
  private slowSince: number | null = null;

  /** A pong came back `rttMs` after its ping, at `now` in ms. True if the quality changed. */
  sample(rttMs: number, now: number): boolean {
    this.trips.push(rttMs);
    if (this.trips.length > SAMPLES) this.trips.shift();
    const oneWay = Math.max(0, middle(this.trips) - ANSWER_MS) / 2;
    if (oneWay <= SLOW_MS) this.slowSince = null;
    else this.slowSince ??= now;
    const slow = this.slowSince !== null && now - this.slowSince >= SLOW_FOR_MS;
    return this.set(slow ? 'poor' : oneWay <= GOOD_MS ? 'good' : 'fair');
  }

  /** A new connection: nothing measured yet. True if the quality changed. */
  reset(): boolean {
    this.trips = [];
    this.slowSince = null;
    return this.set('good');
  }

  private set(quality: LinkQuality): boolean {
    if (quality === this.quality) return false;
    this.quality = quality;
    return true;
  }
}

/** The median of a few numbers. */
function middle(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}
