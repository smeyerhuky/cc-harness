import { describe, expect, it, vi } from 'vitest';
import { Sfx, tones, type SoundName } from './sfx';

/** An audio context stand-in that records the tones started on it. */
function fakeContext() {
  const started: { type: string; freq: number; at: number }[] = [];
  const param = () => ({
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  const ctx = {
    currentTime: 10,
    state: 'running',
    destination: {},
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
    createGain: () => ({ gain: param(), connect: (x: unknown) => x }),
    createOscillator: () => {
      const osc = {
        type: 'sine',
        frequency: { ...param(), setValueAtTime: vi.fn((f: number) => (osc.freq = f)) },
        freq: 0,
        connect: (x: unknown) => x,
        start: (at: number) => started.push({ type: osc.type, freq: osc.freq, at }),
        stop: vi.fn(),
      };
      return osc;
    },
  };
  return { ctx: ctx as unknown as AudioContext, started, raw: ctx };
}

describe('tones', () => {
  it('rises one note per cleared row, up to four', () => {
    expect([1, 2, 3, 4, 9].map((n) => tones('clear', n).length)).toEqual([1, 2, 3, 4, 4]);
    expect(tones('clear', 4).map((t) => t.freq)).toEqual([523, 659, 784, 1046]);
  });

  it('has a sound for every moment the UI language names', () => {
    const names: SoundName[] = [
      'move',
      'lock',
      'clear',
      'attack',
      'cancel',
      'land',
      'showdown',
      'power',
      'win',
      'lose',
    ];
    for (const n of names) expect(tones(n).length).toBeGreaterThan(0);
  });
});

describe('Sfx', () => {
  it('starts each tone of a sound at its offset', () => {
    const f = fakeContext();
    const sfx = new Sfx(() => f.ctx);
    sfx.play('showdown');
    expect(f.started).toEqual([
      { type: 'square', freq: 392, at: 10 },
      { type: 'square', freq: 392, at: 10.18 },
      { type: 'square', freq: 523, at: 10.36 },
    ]);
  });

  it('makes one audio context, resumes it if the browser suspended it, and closes it', () => {
    const f = fakeContext();
    const make = vi.fn(() => f.ctx);
    const sfx = new Sfx(make);
    f.raw.state = 'suspended';
    sfx.play('move');
    sfx.play('lock');
    expect(make).toHaveBeenCalledOnce();
    expect(f.raw.resume).toHaveBeenCalled();
    sfx.close();
    expect(f.raw.close).toHaveBeenCalledOnce();
  });

  it('stays silent where Web Audio is missing or fails', () => {
    expect(() => new Sfx(() => null).play('win')).not.toThrow();
    expect(() =>
      new Sfx(() => {
        throw new Error('no audio');
      }).play('win'),
    ).not.toThrow();
  });
});
