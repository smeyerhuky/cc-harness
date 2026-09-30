import type { Clear } from './attack';
import type { PieceType, PlayerIndex, PowerKind } from './constants';
import type { DealtPiece, Rotation } from './pieces';

/** Why a player lost: a piece couldn't spawn, locked above the board, or garbage overflowed. */
export type TopOutReason = 'block out' | 'lock out' | 'buried';

export interface PlayerStats {
  pieces: number;
  lines: number;
  sent: number;
  received: number;
  cancelled: number;
  fourLineClears: number;
  tspins: number;
  perfectClears: number;
  powersUsed: number;
  powersGot: number;
  maxCombo: number;
  garbageRows: number;
}

/** Where the falling piece is, for the opponent's view. */
export interface PiecePosition {
  readonly t: PieceType;
  readonly r: Rotation;
  readonly x: number;
  readonly y: number;
}

/**
 * What a player's simulation sends to the referee (the Match DO, or the local referee). The wire
 * format and its validation are the protocol package's; these are the engine's in-memory shapes.
 */
export type PlayerMessage =
  | { readonly type: 'bagReq' }
  | { readonly type: 'attack'; readonly rows: number; readonly clear: Clear }
  | {
      readonly type: 'lock';
      /** The board after any clear, as a snapshot string. */
      readonly board: string;
      readonly lines: number;
      readonly attack: number;
      readonly clear: Clear | null;
      readonly meter: number;
      /** The highest garbage id received: acknowledges it and every earlier one. */
      readonly gack: number;
      readonly hold: PieceType | null;
      readonly power: PowerKind | null;
      readonly stats: PlayerStats;
    }
  | { readonly type: 'topout'; readonly why: TopOutReason }
  | { readonly type: 'use'; readonly power: PowerKind }
  | {
      readonly type: 'pos';
      readonly cur: PiecePosition | null;
      readonly meter: number;
      readonly gack: number;
      readonly power: PowerKind | null;
      readonly hold: PieceType | null;
    };

/** A power-up activation, stamped by the referee with the tick both clients apply it at. */
export interface PowerMessage {
  readonly type: 'power';
  readonly kind: PowerKind;
  readonly by: PlayerIndex;
  readonly at: number;
}

export interface ShowdownMessage {
  readonly type: 'showdown';
  readonly kind: 'double' | 'sudden';
  readonly phase: 'soon' | 'start' | 'end';
}

export interface ResultMessage {
  readonly type: 'result';
  /** The winner, or null for no contest. */
  readonly winner: PlayerIndex | null;
  readonly reason: string;
}

/** The referee's messages that a player's simulation acts on. */
export type RefereeMessage =
  | { readonly type: 'start'; readonly goAt: number }
  | { readonly type: 'bag'; readonly pieces: readonly DealtPiece[] }
  | { readonly type: 'garbage'; readonly rows: number; readonly id: number }
  | PowerMessage
  | { readonly type: 'paused' }
  | { readonly type: 'resume'; readonly at: number }
  | ShowdownMessage
  | ResultMessage;

/** What happened inside a player's simulation, for the UI, sound and tests. */
export type PlayerEvent =
  | {
      readonly type: 'lock';
      readonly p: PlayerIndex;
      readonly piece: PieceType;
      readonly cells: readonly (readonly [number, number])[];
      /** Full rows, bottom first, before they are cleared. */
      readonly rows: readonly number[];
      readonly tspin: boolean;
      readonly clear: Clear | null;
      readonly sent: number;
      readonly cancelled: number;
      /** Garbage rows that landed with this lock. */
      readonly rise: number;
      /** A power-up banked by this clear. */
      readonly power: PowerKind | null;
    }
  | { readonly type: 'hold'; readonly p: PlayerIndex }
  | { readonly type: 'powerUse'; readonly p: PlayerIndex; readonly kind: PowerKind }
  | {
      readonly type: 'powerApply';
      readonly p: PlayerIndex;
      readonly kind: PowerKind;
      readonly by: PlayerIndex;
    }
  | { readonly type: 'topout'; readonly p: PlayerIndex; readonly why: TopOutReason }
  | { readonly type: 'incoming'; readonly p: PlayerIndex; readonly rows: number };
