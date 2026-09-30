import { describe, expect, it } from 'vitest';
import { isHandle } from './handle';
import { handle } from './schemas';

describe('isHandle', () => {
  it('agrees with the handle schema', () => {
    for (const value of [
      'Brisk Heron 42',
      'Quiet Wren 7',
      'Quiet Wren 100',
      'quiet Wren 7',
      'Quiet  Wren 7',
      'Quiet Wren',
      '<script>',
      `${'A'.padEnd(20, 'b')} ${'C'.padEnd(10, 'd')} 9`,
      '',
      42,
      null,
      undefined,
    ]) {
      expect({ value, ok: isHandle(value) }).toEqual({
        value,
        ok: handle.safeParse(value).success,
      });
    }
  });
});
