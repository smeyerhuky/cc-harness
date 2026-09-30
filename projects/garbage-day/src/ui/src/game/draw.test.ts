import {
  GARBAGE,
  VIS,
  emptyBoard,
  gemCell,
  pieceCell,
  setCell,
  spawnPos,
  type ActivePiece,
} from '@garbage-day/engine';
import { describe, expect, it } from 'vitest';
import { MARK_INK, PIECE_COLOR, POWER_COLOR, boardPalette } from '../tokens/tokens';
import { recordingContext, type Call } from '../../test/recording-context';
import { drawBoard, ghostY, type BoardView, type DrawOptions } from './draw';

const S = 20;
const opts = (over: Partial<DrawOptions> = {}): DrawOptions => ({
  cell: S,
  palette: boardPalette('dark'),
  now: 0,
  reducedMotion: false,
  ...over,
});
const draw = (view: BoardView, over: Partial<DrawOptions> = {}) => {
  const r = recordingContext();
  drawBoard(r.ctx, view, opts(over));
  return r.calls;
};
const fills = (calls: Call[], color: string) =>
  calls.filter((c) => c.name === 'fillRect' && c.fill === color);
/** The canvas y of a board row's top edge. */
const rowY = (y: number) => (VIS - 1 - y) * S;

describe('drawBoard', () => {
  it('fills the well and draws nothing else on an empty board', () => {
    const calls = draw({ board: emptyBoard() });
    expect(calls[0]).toMatchObject({ name: 'fillRect', args: [0, 0, 10 * S, VIS * S] });
    expect(calls[0]?.fill).toBe(boardPalette('dark').well);
    expect(calls.filter((c) => c.name === 'fillRect')).toHaveLength(1);
  });

  it('draws a locked piece in its stream colour, with its pattern mark', () => {
    const board = emptyBoard();
    setCell(board, 0, 0, pieceCell('T'));
    const calls = draw({ board });
    expect(fills(calls, PIECE_COLOR.T)).toEqual([
      expect.objectContaining({ args: [1, rowY(0) + 1, S - 2, S - 2] }),
    ]);
    expect(calls.some((c) => c.name === 'fill' && c.fill === MARK_INK)).toBe(true);
  });

  it('draws garbage from the sprite when given one, and hatches it otherwise', () => {
    const board = emptyBoard();
    setCell(board, 3, 0, GARBAGE);
    const sprite = {} as CanvasImageSource;
    const withSprite = draw({ board }, { garbageSprite: sprite });
    expect(withSprite.filter((c) => c.name === 'drawImage')).toEqual([
      expect.objectContaining({ args: [sprite, 3 * S, rowY(0), S, S] }),
    ]);
    const hatched = draw({ board });
    expect(fills(hatched, boardPalette('dark').garbage)).toHaveLength(1);
    expect(
      hatched.filter((c) => c.name === 'stroke' && c.stroke === boardPalette('dark').stripe).length,
    ).toBeGreaterThan(2);
  });

  it('draws a gem in its power-up colour with the white diamond', () => {
    const board = emptyBoard();
    setCell(board, 5, 1, gemCell('bomb'));
    const calls = draw({ board });
    expect(fills(calls, POWER_COLOR.bomb)).toHaveLength(1);
    expect(calls.some((c) => c.name === 'fill' && c.fill === 'rgba(255,255,255,.95)')).toBe(true);
  });

  it('outlines the ghost where the falling piece would land', () => {
    const board = emptyBoard();
    const piece: ActivePiece = { t: 'O', r: 0, ...spawnPos('O'), gem: null };
    expect(ghostY(board, piece)).toBeLessThan(piece.y);
    const ghost = draw({ board, piece, ghost: true }).filter(
      (c) => c.name === 'strokeRect' && c.alpha === 0.6,
    );
    expect(ghost).toHaveLength(4);
    const ys = ghost.map((c) => c.args[1]);
    expect(Math.max(...(ys as number[]))).toBe(rowY(0) + 2);
  });

  it("draws a falling piece's gem on the cell with its index", () => {
    const board = emptyBoard();
    const piece: ActivePiece = { t: 'I', r: 0, x: 3, y: 10, gem: { i: 2, type: 'shield' } };
    const calls = draw({ board, piece });
    expect(fills(calls, POWER_COLOR.shield)).toHaveLength(1);
    expect(fills(calls, PIECE_COLOR.I)).toHaveLength(3);
  });

  it('flashes clearing rows across the full width', () => {
    const board = emptyBoard();
    for (let x = 0; x < 10; x++) setCell(board, x, 0, pieceCell('L'));
    const flash = draw({ board, clearing: [0] }).filter(
      (c) =>
        c.name === 'fillRect' &&
        String(c.fill).startsWith('rgba(255,255,255,') &&
        c.args[2] === 10 * S,
    );
    expect(flash).toEqual([expect.objectContaining({ args: [0, rowY(0), 10 * S, S] })]);
  });

  it('greys every cell of a topped-out board', () => {
    const board = emptyBoard();
    setCell(board, 0, 0, pieceCell('S'));
    setCell(board, 1, 0, GARBAGE);
    const calls = draw({ board, dead: true });
    expect(fills(calls, boardPalette('dark').dead)).toHaveLength(2);
    expect(fills(calls, PIECE_COLOR.S)).toHaveLength(0);
  });

  it('covers the top of the board in fog, drifting only with motion on', () => {
    const board = emptyBoard();
    const moving = draw({ board, fog: true });
    expect(moving.some((c) => c.name === 'createLinearGradient')).toBe(true);
    expect(moving.filter((c) => c.name === 'arc').length).toBe(7);
    const still = draw({ board, fog: true }, { reducedMotion: true });
    expect(still.filter((c) => c.name === 'arc')).toHaveLength(0);
  });

  describe('with reduced motion', () => {
    it('ignores the garbage rise and keeps the flash and gems still', () => {
      const board = emptyBoard();
      setCell(board, 0, 0, pieceCell('J'));
      setCell(board, 1, 0, gemCell('fog'));
      const view: BoardView = { board, clearing: [0], rise: 2 };
      const a = draw(view, { reducedMotion: true, now: 100 });
      const b = draw(view, { reducedMotion: true, now: 900 });
      expect(a).toEqual(b);
      expect(fills(a, PIECE_COLOR.J)[0]?.args[1]).toBe(rowY(0) + 1);
    });

    it('raises the stack by the rise offset with motion on', () => {
      const board = emptyBoard();
      setCell(board, 0, 0, pieceCell('J'));
      const calls = draw({ board, rise: 1 });
      expect(fills(calls, PIECE_COLOR.J)[0]?.args[1]).toBe(rowY(0) + S + 1);
    });
  });
});
