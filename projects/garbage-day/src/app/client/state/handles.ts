// Generated handles (PRD US-04): an adjective, a bird and a number, such as "Brisk Heron 42".
// Players regenerate them but can't type one in v1, so no free text ever reaches the other
// player. Every combination passes the protocol's `handle` schema (handles.test.ts).

const words = (list: string): readonly string[] => list.trim().split(/\s+/);

const ADJECTIVES = words(`
  Bold Brisk Bright Calm Cheery Clever Daring Dapper Eager Fancy
  Frisky Gentle Hardy Hasty Jaunty Jolly Keen Lively Lucky Mellow
  Merry Nimble Peppy Plucky Proud Quick Quiet Rapid Ready Rowdy
  Sly Snappy Spry Steady Sturdy Sunny Tidy Witty Zesty Chipper
`);

const BIRDS = words(`
  Bunting Crow Curlew Dipper Dunnock Egret Falcon Finch Godwit Grebe
  Gull Hawk Heron Jay Kestrel Kite Lark Linnet Magpie Merlin
  Nuthatch Oriole Osprey Owl Pelican Petrel Pipit Plover Puffin Raven
  Robin Siskin Sparrow Starling Swallow Swift Tern Thrush Warbler Wren
`);

export const HANDLE_WORDS = { adjectives: ADJECTIVES, birds: BIRDS } as const;

/**
 * A uniform whole number from 0 to `n - 1` from the platform's secure generator, with no bias:
 * it takes only as many random bits as `n` needs and draws again when they come to `n` or more.
 * (Scaling a 32-bit draw down to `n` would favour some values, if very slightly.)
 */
export function secureInt(n: number): number {
  const mask = 2 ** Math.ceil(Math.log2(n)) - 1;
  const draw = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(draw);
    const v = (draw[0] ?? 0) & mask;
    if (v < n) return v;
  }
}

/** A new handle: an adjective, a bird and a number from 1 to 99. */
export function randomHandle(int: (n: number) => number = secureInt): string {
  const adjective = ADJECTIVES[int(ADJECTIVES.length)] ?? 'Brisk';
  const bird = BIRDS[int(BIRDS.length)] ?? 'Heron';
  return `${adjective} ${bird} ${1 + int(99)}`;
}
