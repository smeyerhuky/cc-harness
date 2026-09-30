import { cellsAt, type Gem, type PieceType } from '@garbage-day/engine';
import { PIECE_COLOR, PIECE_MARK, POWER_COLOR } from '../tokens/tokens';
import { MarkSvg } from './marks';

/** A piece in its spawn orientation, as SVG: for the hold slot and the next queue. */
export function PieceGlyph({
  type,
  cell = 10,
  gem = null,
  dim = false,
}: {
  type: PieceType;
  /** One cell's size in px. */
  cell?: number;
  /** A gem on one of its cells, shown as a white diamond on the power-up's colour. */
  gem?: Gem | null;
  /** Greyed, as when hold was already used this turn. */
  dim?: boolean;
}) {
  const cells = cellsAt(type, 0, 0, 0);
  const xs = cells.map(([x]) => x);
  const ys = cells.map(([, y]) => -y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = (Math.max(...xs) - minX + 1) * cell;
  const height = (Math.max(...ys) - minY + 1) * cell;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      opacity={dim ? 0.35 : 1}
      data-piece={type}
    >
      {cells.map(([x, y], i) => {
        const px = (x - minX) * cell;
        const py = (-y - minY) * cell;
        const isGem = gem?.i === i;
        const r = cell * 0.27;
        return (
          <g key={i}>
            <rect
              x={px + 0.5}
              y={py + 0.5}
              width={cell - 1}
              height={cell - 1}
              rx={1}
              fill={isGem ? POWER_COLOR[gem.type] : PIECE_COLOR[type]}
            />
            {isGem ? (
              <path
                d={`M${px + cell / 2} ${py + cell / 2 - r}l${r} ${r}l${-r} ${r}l${-r} ${-r}Z`}
                fill="rgba(255,255,255,.95)"
              />
            ) : (
              <MarkSvg mark={PIECE_MARK[type]} x={px} y={py} s={cell} />
            )}
          </g>
        );
      })}
    </svg>
  );
}
