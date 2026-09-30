import {
  EMPTY,
  GARBAGE,
  PIECE_TYPES,
  VIS,
  W,
  cellAt,
  cellsAt,
  fits,
  gemPower,
  type ActivePiece,
  type Board,
  type PowerKind,
} from '@garbage-day/engine';
import {
  MARK_INK,
  PIECE_COLOR,
  PIECE_MARK,
  POWER_COLOR,
  type BoardPalette,
  type Mark,
} from '../tokens/tokens';

// The board renderer, ported from the proof of concept's `BoardCanvas`
// (spikes/proof-of-concept/live/app.js): bevelled cells, hatched garbage, gem diamonds, the ghost,
// the line-clear flash, the garbage-rise offset and fog. It draws on any 2D context, so tests
// can record the calls; `BoardCanvas` owns the real canvas and calls it every frame.

/** What one board looks like this frame. */
export interface BoardView {
  readonly board: Board;
  /** The falling piece, if any. */
  readonly piece?: ActivePiece | null;
  /** Show where the falling piece would land. */
  readonly ghost?: boolean;
  /** Rows flashing before they clear (0 is the floor). */
  readonly clearing?: readonly number[] | null;
  /** How many rows the stack is still rising by as garbage lands; eased by the caller, 0 when still. */
  readonly rise?: number;
  /** The Fog power-up is on this board. */
  readonly fog?: boolean;
  /** The player topped out: every cell is greyed. */
  readonly dead?: boolean;
}

export interface DrawOptions {
  /** One cell's size in CSS pixels. */
  readonly cell: number;
  readonly palette: BoardPalette;
  /** Milliseconds, for the gem pulse, the clear flash and the fog drift. */
  readonly now: number;
  readonly reducedMotion: boolean;
  /** A pre-drawn garbage cell of this size, to save redrawing the hatch every frame. */
  readonly garbageSprite?: CanvasImageSource | null;
}

/** The part of the 2D context the renderer uses. */
export type Ctx = Pick<
  CanvasRenderingContext2D,
  | 'fillStyle'
  | 'strokeStyle'
  | 'lineWidth'
  | 'globalAlpha'
  | 'fillRect'
  | 'strokeRect'
  | 'beginPath'
  | 'moveTo'
  | 'lineTo'
  | 'closePath'
  | 'fill'
  | 'stroke'
  | 'arc'
  | 'rect'
  | 'clip'
  | 'save'
  | 'restore'
  | 'drawImage'
  | 'createLinearGradient'
>;

/** A square cell with the 1 px gap, a lighter top bevel and a darker bottom bevel. */
function drawCell(c: Ctx, px: number, py: number, s: number, color: string, alpha = 1): void {
  const bevel = Math.max(1, Math.round(s * 0.14));
  c.globalAlpha = alpha;
  c.fillStyle = color;
  c.fillRect(px + 1, py + 1, s - 2, s - 2);
  c.fillStyle = 'rgba(255,255,255,.2)';
  c.fillRect(px + 1, py + 1, s - 2, bevel);
  c.fillStyle = 'rgba(0,0,0,.24)';
  c.fillRect(px + 1, py + s - 1 - bevel, s - 2, bevel);
  c.globalAlpha = 1;
}

/** A piece's pattern mark, inset in 30% ink, so pieces differ by shape as well as colour. */
function drawMark(c: Ctx, px: number, py: number, s: number, mark: Mark): void {
  if (s < 8) return;
  const cx = px + s / 2;
  const cy = py + s / 2;
  const r = s * 0.2;
  c.fillStyle = MARK_INK;
  c.strokeStyle = MARK_INK;
  c.lineWidth = Math.max(1, s * 0.09);
  c.beginPath();
  switch (mark) {
    case 'lines':
      c.moveTo(cx - r, cy - r * 0.5);
      c.lineTo(cx + r, cy - r * 0.5);
      c.moveTo(cx - r, cy + r * 0.5);
      c.lineTo(cx + r, cy + r * 0.5);
      c.stroke();
      break;
    case 'ring':
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();
      break;
    case 'triangle':
      c.moveTo(cx, cy - r);
      c.lineTo(cx + r, cy + r * 0.8);
      c.lineTo(cx - r, cy + r * 0.8);
      c.closePath();
      c.fill();
      break;
    case 'slash':
      c.moveTo(cx - r, cy + r);
      c.lineTo(cx + r, cy - r);
      c.stroke();
      break;
    case 'dots': {
      const d = r * 0.55;
      c.arc(cx - d, cy - d, s * 0.06, 0, Math.PI * 2);
      c.arc(cx + d, cy - d, s * 0.06, 0, Math.PI * 2);
      c.arc(cx - d, cy + d, s * 0.06, 0, Math.PI * 2);
      c.arc(cx + d, cy + d, s * 0.06, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'plus':
      c.moveTo(cx - r, cy);
      c.lineTo(cx + r, cy);
      c.moveTo(cx, cy - r);
      c.lineTo(cx, cy + r);
      c.stroke();
      break;
    case 'square':
      c.strokeRect(cx - r * 0.8, cy - r * 0.8, r * 1.6, r * 1.6);
      break;
  }
}

/** A landed garbage cell: grey with the diagonal hatch. */
export function drawGarbageCell(c: Ctx, px: number, py: number, s: number, p: BoardPalette): void {
  c.fillStyle = p.garbage;
  c.fillRect(px + 1, py + 1, s - 2, s - 2);
  c.save();
  c.beginPath();
  c.rect(px + 1, py + 1, s - 2, s - 2);
  c.clip();
  c.strokeStyle = p.stripe;
  c.lineWidth = Math.max(2, s * 0.17);
  for (let i = -s; i < s * 2; i += s * 0.46) {
    c.beginPath();
    c.moveTo(px + i, py + s);
    c.lineTo(px + i + s, py);
    c.stroke();
  }
  c.restore();
  c.fillStyle = 'rgba(255,255,255,.12)';
  c.fillRect(px + 1, py + 1, s - 2, Math.max(2, s * 0.12));
}

/** A gem: a cell in its power-up's colour with a white diamond that pulses gently. */
function drawGem(
  c: Ctx,
  px: number,
  py: number,
  s: number,
  kind: PowerKind,
  now: number,
  reducedMotion: boolean,
): void {
  drawCell(c, px, py, s, POWER_COLOR[kind]);
  const pulse = reducedMotion ? 1 : 1 + 0.14 * Math.sin(now / 170);
  const r = s * 0.27 * pulse;
  const cx = px + s / 2;
  const cy = py + s / 2;
  c.fillStyle = 'rgba(255,255,255,.95)';
  c.beginPath();
  c.moveTo(cx, cy - r);
  c.lineTo(cx + r, cy);
  c.lineTo(cx, cy + r);
  c.lineTo(cx - r, cy);
  c.closePath();
  c.fill();
}

/** Where the falling piece would land. */
export function ghostY(b: Board, p: ActivePiece): number {
  let y = p.y;
  while (fits(b, p.t, p.r, p.x, y - 1)) y--;
  return y;
}

/** Draws one board: the well, the grid, the stack, the falling piece and its ghost, and fog. */
export function drawBoard(c: Ctx, view: BoardView, o: DrawOptions): void {
  const s = o.cell;
  const width = s * W;
  const height = s * VIS;
  const rowY = (y: number, off = 0) => (VIS - 1 - y + off) * s;

  c.fillStyle = o.palette.well;
  c.fillRect(0, 0, width, height);
  c.strokeStyle = o.palette.grid;
  c.lineWidth = 1;
  c.beginPath();
  for (let x = 1; x < W; x++) {
    c.moveTo(x * s + 0.5, 0);
    c.lineTo(x * s + 0.5, height);
  }
  for (let y = 1; y < VIS; y++) {
    c.moveTo(0, y * s + 0.5);
    c.lineTo(width, y * s + 0.5);
  }
  c.stroke();

  const off = o.reducedMotion ? 0 : (view.rise ?? 0);
  const flashAlpha = o.reducedMotion ? 0.6 : 0.35 + 0.45 * Math.abs(Math.sin(o.now / 45));
  for (let y = 0; y < VIS + 2; y++) {
    const py = rowY(y, off);
    if (py < -s || py > height) continue;
    for (let x = 0; x < W; x++) {
      const v = cellAt(view.board, x, y);
      if (v === EMPTY) continue;
      const px = x * s;
      const gem = gemPower(v);
      if (view.dead) drawCell(c, px, py, s, o.palette.dead);
      else if (v === GARBAGE) {
        if (o.garbageSprite) c.drawImage(o.garbageSprite, px, py, s, s);
        else drawGarbageCell(c, px, py, s, o.palette);
      } else if (gem) drawGem(c, px, py, s, gem, o.now, o.reducedMotion);
      else {
        const t = PIECE_TYPES[v - 1];
        if (!t) continue;
        drawCell(c, px, py, s, PIECE_COLOR[t]);
        drawMark(c, px, py, s, PIECE_MARK[t]);
      }
    }
    if (view.clearing?.includes(y)) {
      c.fillStyle = `rgba(255,255,255,${flashAlpha})`;
      c.fillRect(0, py, width, s);
    }
  }

  const p = view.piece;
  if (p && !view.dead) {
    if (view.ghost) {
      c.strokeStyle = PIECE_COLOR[p.t];
      c.lineWidth = 2;
      c.globalAlpha = 0.6;
      for (const [x, y] of cellsAt(p.t, p.r, p.x, ghostY(view.board, p))) {
        if (y < VIS) c.strokeRect(x * s + 2, rowY(y) + 2, s - 4, s - 4);
      }
      c.globalAlpha = 1;
    }
    cellsAt(p.t, p.r, p.x, p.y).forEach(([x, y], k) => {
      if (y >= VIS || y < 0) return;
      if (p.gem?.i === k) drawGem(c, x * s, rowY(y), s, p.gem.type, o.now, o.reducedMotion);
      else {
        drawCell(c, x * s, rowY(y), s, PIECE_COLOR[p.t]);
        drawMark(c, x * s, rowY(y), s, PIECE_MARK[p.t]);
      }
    });
  }

  if (view.fog) {
    const g = c.createLinearGradient(0, 0, 0, height * 0.78);
    g.addColorStop(0, 'rgba(168,174,196,0.98)');
    g.addColorStop(0.82, 'rgba(150,156,180,0.93)');
    g.addColorStop(1, 'rgba(150,156,180,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, width, height * 0.78);
    if (!o.reducedMotion) {
      for (let i = 0; i < 7; i++) {
        const bx = ((o.now / 38 + i * 57) % (width + 80)) - 40;
        const by = (i * 41) % (height * 0.62);
        c.beginPath();
        c.fillStyle = 'rgba(220,224,238,.35)';
        c.arc(bx, by, s * 2.3, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}
