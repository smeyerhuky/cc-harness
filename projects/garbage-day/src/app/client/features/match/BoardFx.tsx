import type { PlayerIndex } from '@garbage-day/engine';
import { POWER_NAME, Popup, useShake, type PopupTone } from '@garbage-day/ui';
import { useRef, useState, type RefObject } from 'react';
import type { MatchEffect, MatchSession } from '../../state/MatchSession';
import { useMatchEffect } from './useMatchEffect';
import styles from './Match.module.css';

interface Label {
  readonly id: number;
  readonly text: string;
  readonly tone: PopupTone;
  readonly small: boolean;
}

/** Labels at most on a board at once; older ones make way. */
const MAX_LABELS = 4;

/** What an effect says over board `seat`, if anything (UI language, "Motion"). */
export function labelFor(
  e: MatchEffect,
  seat: PlayerIndex,
  rules: { readonly powerSec: number; readonly rushLevels: number; readonly bombRows: number },
): Omit<Label, 'id'> | null {
  const note = (text: string, tone: PopupTone = 'plain') => ({ text, tone, small: true });
  switch (e.kind) {
    case 'clear':
      if (e.p !== seat) return null;
      return { text: e.label.text, tone: e.label.strong ? 'strong' : 'plain', small: seat !== 0 };
    case 'cancel':
      return e.p === seat ? note(`−${e.rows} cancelled`, 'strong') : null;
    case 'gem':
      return e.p === seat ? note(`+ ${POWER_NAME[e.power]}`, 'power') : null;
    case 'blocked':
      return e.p === seat ? note('Blocked by shield', 'power') : null;
    case 'powerApply':
      if (e.p !== seat) return null;
      if (e.by !== seat && e.power === 'fog') return note(`Fogged for ${rules.powerSec} s`, 'bad');
      if (e.by !== seat && e.power === 'rush')
        return note(`Rush: speed +${rules.rushLevels}`, 'bad');
      if (e.by === seat && e.power === 'bomb') return note(`Bottom ${rules.bombRows} rows gone`);
      if (e.by === seat && e.power === 'shield') return note('Shield up', 'power');
      return null;
    case 'topout':
      return e.p === seat ? { text: 'Topped out', tone: 'bad', small: false } : null;
    default:
      return null;
  }
}

/**
 * The moments over one board: clear labels and notes rising from its middle, and a shake when
 * garbage lands or a Bomb goes off (US-08, US-10). The rival's labels are smaller and not read
 * aloud, so a screen reader hears the player's own.
 */
export function BoardFx({
  session,
  seat,
  board,
}: {
  session: MatchSession;
  seat: PlayerIndex;
  board: RefObject<HTMLElement | null>;
}) {
  const [labels, setLabels] = useState<readonly Label[]>([]);
  const nextId = useRef(0);
  const shake = useShake();
  useMatchEffect(session, (e) => {
    if (
      (e.kind === 'land' && e.p === seat) ||
      (e.kind === 'powerApply' && e.p === seat && e.by === seat && e.power === 'bomb')
    ) {
      shake(board.current);
    }
    const label = labelFor(e, seat, session.match.rules);
    if (!label) return;
    const id = nextId.current++;
    setLabels((all) => [...all.slice(1 - MAX_LABELS), { id, ...label }]);
  });
  return (
    <div className={styles.fx}>
      {labels.map((l) => (
        <Popup
          key={l.id}
          text={l.text}
          tone={l.tone}
          small={l.small}
          quiet={seat !== 0}
          onDone={() => setLabels((all) => all.filter((x) => x.id !== l.id))}
        />
      ))}
    </div>
  );
}
