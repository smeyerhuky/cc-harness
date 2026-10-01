import { describe, expect, it } from 'vitest';
import { CLOSE, isFinalClose } from './close-codes';

describe('close codes', () => {
  it('are final when the server meant it, and not when the connection dropped', () => {
    for (const code of Object.values(CLOSE)) expect(isFinalClose(code)).toBe(true);
    // Abnormal closure (a dropped connection), going away (a restart), service restart.
    for (const code of [1001, 1006, 1011, 1012]) expect(isFinalClose(code)).toBe(false);
  });
});
