import type { ReactNode } from 'react';
import styles from './Layout.module.css';

/** Which arrangement the stage takes (UI language, "Layouts"). */
export type StageArrangement = 'portrait' | 'landscape' | 'desktop';

/**
 * The match stage: the player's panel, the centre column and the rival's panel, plus the match
 * feed at 1600 px and wider (UI language, "Layouts"). It is marked `data-stage`, so what sits on
 * it takes the dark content colours in both themes. `layout` picks the arrangement: `portrait`
 * gives the rival's side about a third of the width and has no centre column; `landscape` and
 * `desktop` put the boards at equal size, and only `desktop` shows the feed. Without it, the
 * arrangement follows the window's shape.
 */
export function StageLayout({
  left,
  centre,
  right,
  feed,
  banner,
  layout,
  leftLabel = 'You',
  rightLabel = 'Rival',
}: {
  left: ReactNode;
  centre: ReactNode;
  right: ReactNode;
  feed?: ReactNode;
  /** An announcement across the top, such as a showdown. */
  banner?: ReactNode;
  layout?: StageArrangement;
  /** Names the two sides for screen readers: the players' handles. */
  leftLabel?: string;
  rightLabel?: string;
}) {
  return (
    <div className={styles.stage} data-stage="" data-layout={layout}>
      {banner && <div className={styles.banner}>{banner}</div>}
      <section className={styles.left} aria-label={leftLabel}>
        {left}
      </section>
      <div className={styles.centre}>{centre}</div>
      <section className={styles.right} aria-label={rightLabel}>
        {right}
      </section>
      {feed && (
        <aside className={styles.feed} aria-label="Match feed">
          {feed}
        </aside>
      )}
    </div>
  );
}
