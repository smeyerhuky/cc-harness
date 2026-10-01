import { VIS, W, emptyBoard } from '@garbage-day/engine';
import { useEffect, useRef } from 'react';
import { useAnimationFrame } from '../hooks/useAnimationFrame';
import { useColorScheme } from '../hooks/useColorScheme';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { boardPalette, type BoardPalette } from '../tokens/tokens';
import { drawBoard, drawGarbageCell, type BoardView } from './draw';
import styles from './BoardCanvas.module.css';

export interface BoardCanvasProps {
  /**
   * Called every frame, with the frame's time, for the board to draw; `null` draws an empty
   * well. A match session steps its simulation here, so the board shows this frame's state.
   */
  readonly source: (now: number) => BoardView | null;
  /** Names the board for screen readers ("Your board", "RIVAL's board"). */
  readonly label: string;
  /** A fixed cell size in CSS pixels; without it the board fills its container. */
  readonly cell?: number;
  /** Smallest cell when filling the container. */
  readonly minCell?: number;
  /** Largest cell when filling the container (desktop: 36 px). */
  readonly maxCell?: number;
  readonly reducedMotion?: boolean;
}

const EMPTY_VIEW: BoardView = { board: emptyBoard() };

function garbageSprite(cell: number, dpr: number, palette: BoardPalette): HTMLCanvasElement | null {
  const sprite = document.createElement('canvas');
  sprite.width = cell * dpr;
  sprite.height = cell * dpr;
  const c = sprite.getContext('2d');
  if (!c) return null;
  c.scale(dpr, dpr);
  drawGarbageCell(c, 0, 0, cell, palette);
  return sprite;
}

/**
 * One board, drawn on canvas every animation frame from `source`, outside React's render cycle
 * (client architecture, "Rendering"). The canvas is sized in whole cells and backed at the
 * device pixel ratio (at most 2), and follows the theme and the reduced-motion setting.
 */
export function BoardCanvas({
  source,
  label,
  cell: fixedCell,
  minCell = 6,
  maxCell = Infinity,
  reducedMotion: forced,
}: BoardCanvasProps) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const sprite = useRef<{ key: string; image: HTMLCanvasElement | null } | null>(null);
  const size = useResizeObserver(frame);
  const theme = useColorScheme();
  const systemReduced = useReducedMotion();
  const reducedMotion = forced ?? systemReduced;
  const cell =
    fixedCell ??
    Math.min(
      maxCell,
      Math.max(minCell, Math.floor(Math.min(size.width / W, size.height / VIS)) || minCell),
    );

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = cell * W * dpr;
    el.height = cell * VIS * dpr;
    el.style.width = `${cell * W}px`;
    el.style.height = `${cell * VIS}px`;
    el.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [cell]);

  useAnimationFrame((now) => {
    const c = canvas.current?.getContext('2d');
    if (!c) return;
    const palette = boardPalette(theme);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const key = `${cell}/${dpr}/${theme}`;
    if (sprite.current?.key !== key)
      sprite.current = { key, image: garbageSprite(cell, dpr, palette) };
    drawBoard(c, source(now) ?? EMPTY_VIEW, {
      cell,
      palette,
      now,
      reducedMotion,
      garbageSprite: sprite.current.image,
    });
  });

  return (
    <div ref={frame} className={styles.frame}>
      <canvas ref={canvas} className={styles.canvas} role="img" aria-label={label} />
    </div>
  );
}
