import { describe, expect, it } from 'vitest';
import { PING_MS } from './link';
import { QualityMeter, SLOW_FOR_MS, type LinkQuality } from './quality';

/**
 * A link with `oneWayMs` each way, pinged every second as `webSocketLink` pings: the quality the
 * meter reads after each pong, from the first ping to `forMs`.
 */
function measure(oneWayMs: number, forMs: number, meter = new QualityMeter(), from = 0) {
  const seen: { at: number; quality: LinkQuality }[] = [];
  for (let sent = from; sent <= from + forMs; sent += PING_MS) {
    const back = sent + 2 * oneWayMs;
    meter.sample(back - sent, back);
    seen.push({ at: back - from, quality: meter.quality });
  }
  return seen;
}

const last = (seen: { quality: LinkQuality }[]) => seen.at(-1)?.quality;

describe('QualityMeter (GD-TICKET-017)', () => {
  it('reads 50 ms one way as good, 150 ms as fair, and 250 ms as poor', () => {
    expect(last(measure(50, 6000))).toBe('good');
    expect(last(measure(150, 6000))).toBe('fair');
    expect(last(measure(250, 6000))).toBe('poor');
  });

  it('reads a real 150 ms link as fair: the ms the two ends take to answer are not delay', () => {
    // Round trips measured in Chromium through a 150 ms proxy against `pnpm dev`.
    const meter = new QualityMeter();
    [202, 303, 302, 300, 303, 304].forEach((rtt, i) => meter.sample(rtt, i * PING_MS));
    expect(meter.quality).toBe('fair');
  });

  it('turns poor only once the delay has been past 150 ms one way for 3 s', () => {
    const seen = measure(250, 6000);
    const poorFrom = seen.find((s) => s.quality === 'poor')?.at ?? Infinity;
    // Slow from the first pong, 500 ms in; poor at the first pong 3 s after that.
    expect(poorFrom).toBeGreaterThanOrEqual(500 + SLOW_FOR_MS);
    expect(poorFrom).toBeLessThan(500 + SLOW_FOR_MS + PING_MS);
    expect(seen.filter((s) => s.at < poorFrom).every((s) => s.quality === 'fair')).toBe(true);
  });

  it('clears when the delay recovers', () => {
    const meter = new QualityMeter();
    measure(250, 6000, meter);
    expect(meter.quality).toBe('poor');
    expect(last(measure(50, 3000, meter, 7000))).toBe('good');
  });

  it('pays one late pong no mind', () => {
    const meter = new QualityMeter();
    measure(50, 3000, meter);
    expect(meter.sample(900, 4000)).toBe(false);
    expect(meter.quality).toBe('good');
  });

  it('starts again from good on a new connection', () => {
    const meter = new QualityMeter();
    measure(250, 6000, meter);
    expect(meter.reset()).toBe(true);
    expect(meter.quality).toBe('good');
    expect(meter.reset()).toBe(false);
  });
});
