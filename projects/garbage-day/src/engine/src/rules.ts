/** A showdown on the active-play clock: `at` seconds in, lasting `dur` seconds (0: to the end). */
export interface Showdown {
  readonly at: number;
  readonly kind: 'double' | 'sudden';
  readonly dur: number;
}

/**
 * Every tunable value of a match. Durations suffixed `Sec` are seconds; the others are ticks
 * unless noted. Defaults are the values in kb/product/game-rules.md and pause-and-presence.md.
 */
export interface Rules {
  /** Ticks a grounded piece waits before locking. */
  readonly lockDelay: number;
  /** Moves or rotations that may restart the lock delay per piece. */
  readonly maxResets: number;
  /** Ticks before arriving garbage is ready to land. */
  readonly garbageDelay: number;
  /** Garbage rows that may land on one lock. */
  readonly garbageCap: number;
  /** Ticks between a lock and the next spawn. */
  readonly spawnDelay: number;
  /** Ticks cleared rows stay on the board while they flash. */
  readonly clearDelay: number;
  /** Seconds of active play per speed level. */
  readonly rampSec: number;
  /** The highest level reached by time alone. */
  readonly maxLevel: number;
  /** Soft drop multiplies gravity by this, and is at least half a row per tick. */
  readonly softFactor: number;
  /** Levels Sudden death adds. */
  readonly suddenLevels: number;
  readonly pauseBudget: number;
  readonly pauseSec: number;
  readonly extendSec: number;
  readonly graceSec: number;
  readonly reconnects: number;
  readonly heartbeatSec: number;
  readonly abandonSec: number;
  /** What leaving while the opponent is paused gives: no contest, or a win for the one who stayed. */
  readonly leaveResult: 'nocontest' | 'win';
  readonly showdowns: readonly Showdown[];
  /** Chance that a dealt piece carries a gem (0 turns gems off). */
  readonly gemChance: number;
  /** Seconds Fog and Rush last. */
  readonly powerSec: number;
  /** Seconds Shield blocks attacks. */
  readonly shieldSec: number;
  /** Levels Rush adds. */
  readonly rushLevels: number;
  /** Bottom rows Bomb removes. */
  readonly bombRows: number;
}

export const DEFAULT_RULES: Rules = Object.freeze({
  lockDelay: 30,
  maxResets: 15,
  garbageDelay: 30,
  garbageCap: 8,
  spawnDelay: 4,
  clearDelay: 12,
  rampSec: 15,
  maxLevel: 15,
  softFactor: 20,
  suddenLevels: 4,
  pauseBudget: 2,
  pauseSec: 120,
  extendSec: 60,
  graceSec: 15,
  reconnects: 3,
  heartbeatSec: 5,
  abandonSec: 300,
  leaveResult: 'nocontest',
  showdowns: Object.freeze([
    Object.freeze({ at: 60, kind: 'double', dur: 15 }),
    Object.freeze({ at: 150, kind: 'sudden', dur: 0 }),
  ]),
  gemChance: 0.16,
  powerSec: 6,
  shieldSec: 5,
  rushLevels: 4,
  bombRows: 3,
});
