// The game's sounds (UI language, "Sound"): synthesized tones from the proof of concept
// (spikes/proof-of-concept/live/app.js), made with Web Audio, so there are no files to load. Off
// until the player turns sound on (US-20). Recorded sounds can replace a tone later without
// changing which moment plays it.

export type SoundName =
  'move' | 'lock' | 'clear' | 'attack' | 'cancel' | 'land' | 'showdown' | 'power' | 'win' | 'lose';

interface Tone {
  readonly freq: number;
  readonly dur: number;
  readonly type: OscillatorType;
  readonly vol: number;
  /** Seconds after the sound starts. */
  readonly when?: number;
  /** Slides to this frequency over the tone. */
  readonly slide?: number;
}

const notes = (
  freqs: readonly number[],
  dur: number,
  vol: number,
  gap: number,
  type: OscillatorType = 'triangle',
): Tone[] => freqs.map((freq, i) => ({ freq, dur, type, vol, when: i * gap }));

/** Each sound's tones; `clear` plays one note per cleared row, rising. */
export function tones(name: SoundName, rows = 1): readonly Tone[] {
  switch (name) {
    case 'move':
      return [{ freq: 330, dur: 0.03, type: 'square', vol: 0.02 }];
    case 'lock':
      return [{ freq: 120, dur: 0.08, type: 'square', vol: 0.05, slide: 70 }];
    case 'clear':
      return notes([523, 659, 784, 1046].slice(0, Math.max(1, Math.min(rows, 4))), 0.1, 0.05, 0.06);
    case 'attack':
      return [{ freq: 260, dur: 0.3, type: 'sawtooth', vol: 0.025, slide: 1100 }];
    case 'cancel':
      return [{ freq: 820, dur: 0.14, type: 'square', vol: 0.035, slide: 260 }];
    case 'land':
      return [{ freq: 95, dur: 0.35, type: 'sawtooth', vol: 0.05, slide: 50 }];
    case 'showdown':
      return notes([392, 392, 523], 0.16, 0.04, 0.18, 'square');
    case 'power':
      return [{ freq: 440, dur: 0.18, type: 'triangle', vol: 0.05, slide: 1400 }];
    case 'win':
      return notes([523, 659, 784, 1046, 1318], 0.16, 0.06, 0.1);
    case 'lose':
      return [{ freq: 160, dur: 0.22, type: 'square', vol: 0.05, slide: 90 }];
  }
}

type AudioContextClass = typeof AudioContext;

/**
 * Plays the game's sounds; the caller checks the sound setting first. The audio context is made
 * on the first sound, which comes after a key press or tap, so browsers let it start. Where Web
 * Audio is missing or fails, it stays silent.
 */
export class Sfx {
  private ctx: AudioContext | null = null;

  constructor(
    private readonly make: () => AudioContext | null = () => {
      const Ctor = (globalThis as { AudioContext?: AudioContextClass }).AudioContext;
      return Ctor ? new Ctor() : null;
    },
  ) {}

  play(name: SoundName, rows?: number): void {
    try {
      this.ctx ??= this.make();
      const ctx = this.ctx;
      if (!ctx) return;
      if (ctx.state === 'suspended') void ctx.resume();
      for (const tone of tones(name, rows)) this.tone(ctx, tone);
    } catch {
      // Audio unavailable: the game plays on in silence.
    }
  }

  /** Lets the audio hardware go, when the match screen closes. */
  close(): void {
    const ctx = this.ctx;
    this.ctx = null;
    if (ctx) void ctx.close().catch(() => undefined);
  }

  private tone(ctx: AudioContext, t: Tone): void {
    const at = ctx.currentTime + (t.when ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type;
    osc.frequency.setValueAtTime(t.freq, at);
    if (t.slide) osc.frequency.exponentialRampToValueAtTime(t.slide, at + t.dur);
    gain.gain.setValueAtTime(t.vol, at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + t.dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + t.dur + 0.02);
  }
}
