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

/** A uniform random number in [0, 1) from the platform's secure generator. */
function secureRandom(): number {
  return (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 2 ** 32;
}

const pick = <T>(list: readonly T[], r: number): T => list[Math.floor(r * list.length)] as T;

/** A new handle: an adjective, a bird and a number from 1 to 99. */
export function randomHandle(random: () => number = secureRandom): string {
  return `${pick(ADJECTIVES, random())} ${pick(BIRDS, random())} ${1 + Math.floor(random() * 99)}`;
}
