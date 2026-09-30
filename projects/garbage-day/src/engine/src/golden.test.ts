// Golden replays: seeded bot matches, and one with every kind of interruption, each run twice
// and compared with its golden file in ../test/golden/. A change to the rules or the protocol
// that changes any match shows up here. To accept a deliberate change, regenerate them with
// `pnpm --filter @garbage-day/engine golden:update` and commit the files on their own, saying why
// (kb/process/definition-of-done.md, project item 1).
import { describe, expect, it } from 'vitest';
import { Bot, botConfig } from './bot';
import { TPS } from './constants';
import { LocalMatch, type ScriptStep } from './local-match';
import type { RefereeEvent } from './referee';
import type { Rules } from './rules';

interface Case {
  readonly name: string;
  readonly seed: number;
  /** Each bot's [skill, speed]. */
  readonly bots: readonly [readonly [number, number], readonly [number, number]];
  readonly rules?: Partial<Rules>;
  readonly script?: readonly ScriptStep[];
}

const s = (seconds: number) => seconds * TPS;

/** Every interruption in the pause and presence rules, at these seconds of active play. */
const INTERRUPTIONS: readonly ScriptStep[] = [
  {
    at: 20, // a hidden tab; the waiting player extends; back after 18 s
    run: (m) => {
      m.away(1, 'tab');
      m.later(s(6), (mm) => mm.send(0, { type: 'extend' }));
      m.later(s(18), (mm) => mm.back(1));
    },
  },
  {
    at: 45, // a dropped connection, noticed by silence: a free reconnect
    run: (m) => {
      m.away(0, 'lost');
      m.later(s(14), (mm) => mm.back(0));
    },
  },
  {
    at: 70, // a closed tab, rejoined: the piece in hand is dealt again
    run: (m) => {
      m.away(0, 'closed');
      m.later(s(10), (mm) => mm.back(0));
    },
  },
  {
    at: 95, // both away: the session timer starts, and stops when the first comes back
    run: (m) => {
      m.away(1, 'tab');
      m.later(s(2), (mm) => mm.away(0, 'tab'));
      m.later(s(12), (mm) => mm.back(0));
      m.later(s(25), (mm) => mm.back(1));
    },
  },
  {
    at: 125, // no pauses left: the match runs on and the player is back within the 15 s
    run: (m) => {
      m.away(1, 'tab');
      m.later(s(6), (mm) => mm.back(1));
    },
  },
];

const CASES: readonly Case[] = [
  {
    name: 'bots-5eed01',
    seed: 0x5eed01,
    bots: [
      [9, 9],
      [7, 8],
    ],
  },
  {
    name: 'bots-5eed02',
    seed: 0x5eed02,
    bots: [
      [10, 10],
      [10, 10],
    ],
  },
  {
    name: 'bots-1234',
    seed: 0x1234,
    bots: [
      [6, 6],
      [6, 4],
    ],
  },
  {
    name: 'bots-beef',
    seed: 0xbeef,
    bots: [
      [3, 5],
      [8, 3],
    ],
  },
  {
    name: 'bots-c0ffee',
    seed: 0xc0ffee,
    bots: [
      [5, 5],
      [5, 5],
    ],
  },
  {
    name: 'bots-777',
    seed: 0x777,
    bots: [
      [8, 10],
      [2, 2],
    ],
  },
  {
    name: 'bots-a11ce',
    seed: 0xa11ce,
    bots: [
      [7, 7],
      [9, 4],
    ],
  },
  {
    name: 'bots-d0d0',
    seed: 0xd0d0,
    bots: [
      [1, 10],
      [10, 1],
    ],
  },
  {
    name: 'classic-2b2b',
    seed: 0x2b2b,
    bots: [
      [7, 6],
      [7, 6],
    ],
    rules: { gemChance: 0, showdowns: [] },
  },
  {
    name: 'interruptions-5eed04',
    seed: 0x5eed04,
    bots: [
      [6, 4],
      [6, 4],
    ],
    script: INTERRUPTIONS,
  },
];

const describeEvent = (ev: RefereeEvent): string => {
  const { type, ...rest } = ev;
  return `${type} ${JSON.stringify(rest)}`;
};

function play(c: Case) {
  const timeline: string[] = [];
  let fired = 0;
  const script = c.script?.map((step) => ({
    at: step.at,
    run: (m: LocalMatch) => {
      fired++;
      step.run(m);
    },
  }));
  const m = new LocalMatch({
    seed: c.seed,
    latencyMs: [35, 55],
    ...(c.rules ? { rules: c.rules } : {}),
    ...(script ? { script } : {}),
    onRefereeEvent: (ev) => {
      if (ev.type !== 'route' && ev.type !== 'bag') timeline.push(`${m.t} ${describeEvent(ev)}`);
    },
  });
  m.controllers[0] = new Bot(m.players[0], c.seed, botConfig(...c.bots[0]));
  m.controllers[1] = new Bot(m.players[1], c.seed, botConfig(...c.bots[1]));
  m.start().run(s(15 * 60));
  return {
    seed: `0x${c.seed.toString(16)}`,
    bots: c.bots,
    rules: c.rules ?? 'default',
    scriptsFired: fired,
    ...m.summary(),
    timeline,
  };
}

describe.each(CASES)('golden replay $name', (c) => {
  it('replays identically twice and matches its golden file', async () => {
    const first = play(c);
    expect(play(c)).toEqual(first);
    expect(first.result).not.toBeNull();
    expect(first.scriptsFired).toBe(c.script?.length ?? 0);
    await expect(`${JSON.stringify(first, null, 2)}\n`).toMatchFileSnapshot(
      `../test/golden/${c.name}.json`,
    );
  }, 60_000);
});
