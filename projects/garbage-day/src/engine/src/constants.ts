/** Board width in columns. */
export const W = 10;
/** Visible rows. */
export const VIS = 20;
/** All rows: the visible board plus 4 hidden rows above it. Row 0 is the floor. */
export const H = 24;
/** Simulation ticks per second. All game time is counted in ticks. */
export const TPS = 60;
/** The highest level Sudden death and Rush can push a player to. */
export const MAX_BOOSTED_LEVEL = 20;

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];

export const POWER_KINDS = ['shield', 'bomb', 'fog', 'rush'] as const;
export type PowerKind = (typeof POWER_KINDS)[number];

export type PlayerIndex = 0 | 1;

/**
 * Salts that derive independent streams from the match seed, so garbage, gems, the network model
 * and bots never consume a piece-stream draw. Values from the proof of concept.
 */
export const SALT = {
  holes: [0x9e3779b9, 0x85ebca6b],
  gems: 0xc2b2ae35,
  net: 0x27d4eb2f,
  bot: 0x165667b1,
} as const;
