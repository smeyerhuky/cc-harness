import type { Ctx } from '../src/game/draw';

export interface Call {
  readonly name: string;
  readonly args: unknown[];
  readonly fill: unknown;
  readonly stroke: unknown;
  readonly alpha: unknown;
}

/** A 2D context that records every call with the fill, stroke and alpha in force. */
export function recordingContext(): { ctx: Ctx; calls: Call[] } {
  const calls: Call[] = [];
  const state: Record<string, unknown> = { globalAlpha: 1 };
  const ctx = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop in state) return state[prop];
        return (...args: unknown[]) => {
          calls.push({
            name: prop,
            args,
            fill: state.fillStyle,
            stroke: state.strokeStyle,
            alpha: state.globalAlpha,
          });
          if (prop === 'createLinearGradient') return { addColorStop: () => undefined };
          return undefined;
        };
      },
      set(_, prop: string, value: unknown) {
        state[prop] = value;
        return true;
      },
    },
  );
  return { ctx: ctx as Ctx, calls };
}
