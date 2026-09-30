import type { DealtPiece, PieceType, PowerKind } from '@garbage-day/engine';
import type { ReactNode } from 'react';
import { PieceGlyph } from './PieceGlyph';
import { POWER_NAME, PowerIcon } from './PowerIcon';
import styles from './Slot.module.css';

function Slot({
  caption,
  label,
  children,
}: {
  caption: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.slot} role="group" aria-label={label}>
      <span className={styles.caption} aria-hidden="true">
        {caption}
      </span>
      {children}
    </div>
  );
}

/** The held piece; dimmed once hold has been used this turn. */
export function HoldSlot({
  piece,
  used = false,
  cell = 10,
}: {
  piece: PieceType | null;
  used?: boolean;
  cell?: number;
}) {
  const label = piece ? `Hold: ${piece}${used ? ', used this turn' : ''}` : 'Hold: empty';
  return (
    <Slot caption="Hold" label={label}>
      {piece ? (
        <PieceGlyph type={piece} cell={cell} dim={used} />
      ) : (
        <span className={styles.empty} />
      )}
    </Slot>
  );
}

/** The next pieces, or a padlock and "hidden" for the opponent's (US-06). */
export function NextQueue({
  pieces,
  count = 5,
  cell = 10,
}: {
  pieces: readonly DealtPiece[] | 'hidden';
  count?: number;
  cell?: number;
}) {
  if (pieces === 'hidden') {
    return (
      <Slot caption="Next" label="Next pieces: hidden">
        <span className={styles.hidden}>
          <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true">
            <path
              d="M3 7V5a4 4 0 0 1 8 0v2M2 7h10v8H2z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
          hidden
        </span>
      </Slot>
    );
  }
  const shown = pieces.slice(0, count);
  return (
    <Slot caption="Next" label={`Next pieces: ${shown.map((p) => p.t).join(', ') || 'none'}`}>
      <div className={styles.queue}>
        {shown.map((p, i) => (
          <PieceGlyph
            key={i}
            type={p.t}
            gem={p.gem}
            cell={i === 0 ? cell : Math.round(cell * 0.8)}
          />
        ))}
      </div>
    </Slot>
  );
}

/** The one power-up slot, with the key or gesture that fires it. */
export function PowerSlot({ kind, hint }: { kind: PowerKind | null; hint?: string }) {
  const label = kind
    ? `Power-up: ${POWER_NAME[kind]}${hint ? `, ${hint} to fire` : ''}`
    : 'Power-up: empty';
  return (
    <Slot caption="Power" label={label}>
      {kind ? <PowerIcon kind={kind} decorative /> : <span className={styles.empty} />}
      {kind && hint && (
        <span className={styles.key} aria-hidden="true">
          {hint}
        </span>
      )}
    </Slot>
  );
}
