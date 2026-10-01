import { PIECE_TYPES, POWER_KINDS, SALT, type PieceType } from './constants';
import type { DealtPiece, Gem } from './pieces';
import { seeded, type Rng, type Seed } from './rng';

/**
 * Deals the match's pieces: 7-bags from the seed's piece stream, and a gem decision per piece
 * from a separate stream, so both players get the same bags with the same gems. It runs on the
 * server; clients only ever see the bags dealt to them.
 */
export class Dealer {
  private readonly pieces: Rng;
  private readonly gemRng: Rng;
  private readonly bags: DealtPiece[][] = [];
  private readonly gems: (Gem | null)[] = [];

  constructor(
    seed: Seed,
    private readonly gemChance: number,
  ) {
    this.pieces = seeded(seed);
    this.gemRng = seeded(seed, SALT.gems);
  }

  /** Bag `k` (0-based), as a fresh copy. */
  bag(k: number): DealtPiece[] {
    while (this.bags.length <= k) {
      const order: PieceType[] = [...PIECE_TYPES];
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(this.pieces() * (i + 1));
        const a = order[i];
        const b = order[j];
        if (a === undefined || b === undefined) throw new Error('bag index out of range');
        order[i] = b;
        order[j] = a;
      }
      const base = this.bags.length * PIECE_TYPES.length;
      this.bags.push(order.map((t, j) => ({ t, gem: this.gem(base + j) })));
    }
    return (this.bags[k] ?? []).map((p) => ({ ...p }));
  }

  /** The gem for piece number `n`: three draws per piece, whether or not it gets one. */
  private gem(n: number): Gem | null {
    while (this.gems.length <= n) {
      const a = this.gemRng();
      const b = this.gemRng();
      const c = this.gemRng();
      const type = POWER_KINDS[Math.floor(c * POWER_KINDS.length)];
      this.gems.push(a < this.gemChance && type ? { i: Math.floor(b * 4), type } : null);
    }
    return this.gems[n] ?? null;
  }
}
