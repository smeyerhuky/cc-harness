import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION, envelope } from './envelope';

describe('envelope', () => {
  it('accepts a message with the current version and a type', () => {
    expect(envelope.safeParse({ v: PROTOCOL_VERSION, t: 'ping' }).success).toBe(true);
  });

  it('rejects another version, a missing type and a non-object', () => {
    expect(envelope.safeParse({ v: PROTOCOL_VERSION + 1, t: 'ping' }).success).toBe(false);
    expect(envelope.safeParse({ v: PROTOCOL_VERSION }).success).toBe(false);
    expect(envelope.safeParse('ping').success).toBe(false);
  });
});
