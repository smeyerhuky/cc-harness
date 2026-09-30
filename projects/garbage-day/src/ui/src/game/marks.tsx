import type { ReactNode } from 'react';
import { MARK_INK, type Mark } from '../tokens/tokens';

/** A pattern mark as SVG, centred in a cell at (x, y) of size s: the canvas marks' twin. */
export function MarkSvg({
  mark,
  x,
  y,
  s,
}: {
  mark: Mark;
  x: number;
  y: number;
  s: number;
}): ReactNode {
  const cx = x + s / 2;
  const cy = y + s / 2;
  const r = s * 0.2;
  const w = Math.max(1, s * 0.09);
  const line = { stroke: MARK_INK, strokeWidth: w, fill: 'none' };
  switch (mark) {
    case 'lines':
      return (
        <path
          d={`M${cx - r} ${cy - r / 2}H${cx + r}M${cx - r} ${cy + r / 2}H${cx + r}`}
          {...line}
        />
      );
    case 'ring':
      return <circle cx={cx} cy={cy} r={r} {...line} />;
    case 'triangle':
      return (
        <path
          d={`M${cx} ${cy - r}L${cx + r} ${cy + r * 0.8}L${cx - r} ${cy + r * 0.8}Z`}
          fill={MARK_INK}
        />
      );
    case 'slash':
      return <path d={`M${cx - r} ${cy + r}L${cx + r} ${cy - r}`} {...line} />;
    case 'dots': {
      const d = r * 0.55;
      return (
        <g fill={MARK_INK}>
          {[
            [-d, -d],
            [d, -d],
            [-d, d],
            [d, d],
          ].map(([dx = 0, dy = 0]) => (
            <circle key={`${dx},${dy}`} cx={cx + dx} cy={cy + dy} r={s * 0.06} />
          ))}
        </g>
      );
    }
    case 'plus':
      return <path d={`M${cx - r} ${cy}H${cx + r}M${cx} ${cy - r}V${cy + r}`} {...line} />;
    case 'square':
      return <rect x={cx - r * 0.8} y={cy - r * 0.8} width={r * 1.6} height={r * 1.6} {...line} />;
  }
}
