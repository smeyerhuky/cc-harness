import { useEffect, useEffectEvent, useRef } from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { PIECE_COLOR } from '../tokens/tokens';
import type { Point } from './Overlays';
import styles from './Overlay.module.css';

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  readonly size: number;
  readonly color: string;
}

const COLORS = Object.values(PIECE_COLOR);

/** The particles of one burst, from `origin`, in the piece colours. `random` is for tests. */
export function burst(origin: Point, count: number, random: () => number = Math.random): Bit[] {
  return Array.from({ length: count }, (_, k) => {
    const a = random() * Math.PI * 2;
    const v = 2 + random() * 6;
    return {
      x: origin.x,
      y: origin.y - 40,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 4,
      r: random() * 6,
      life: 90 + random() * 50,
      size: 4 + random() * 5,
      color: COLORS[k % COLORS.length] ?? '#fff',
    };
  });
}

/**
 * Confetti from the winner's board (UI language, "Motion"), ported from the proof of concept:
 * one burst when it mounts, on a canvas over the page for about two seconds. Under reduced motion
 * there is none, and `onDone` fires at once.
 */
export function Confetti({
  origin,
  count = 120,
  onDone,
}: {
  /**
   * Where the burst starts, in page (client) coordinates, or a function that measures it when the
   * burst starts (after layout, so it can read the page).
   */
  origin: Point | (() => Point | null);
  count?: number;
  onDone?: () => void;
}) {
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const done = useEffectEvent(() => onDone?.());
  const start = useEffectEvent(() => (typeof origin === 'function' ? origin() : origin));
  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext('2d');
    const from = start();
    if (reduced || !cv || !ctx || !from) {
      done();
      return;
    }
    let bits = burst(from, count);
    let frame = 0;
    const step = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== Math.round(w * dpr)) cv.width = Math.round(w * dpr);
      if (cv.height !== Math.round(h * dpr)) cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      bits = bits.filter((b) => b.life > 0);
      for (const b of bits) {
        b.vy += 0.18;
        b.vx *= 0.99;
        b.x += b.vx;
        b.y += b.vy;
        b.r += 0.1;
        b.life--;
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.globalAlpha = Math.min(1, b.life / 30);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size * 0.6);
        ctx.restore();
      }
      if (bits.length) frame = requestAnimationFrame(step);
      else done();
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [count, reduced]);
  return reduced ? null : <canvas ref={canvas} className={styles.confetti} aria-hidden="true" />;
}
