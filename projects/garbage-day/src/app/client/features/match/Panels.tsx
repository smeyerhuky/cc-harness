import {
  HoldSlot,
  Meter,
  NextQueue,
  PowerSlot,
  BoardCanvas,
  SpeedChip,
  Countdown,
} from '@garbage-day/ui';
import type { PlayerIndex } from '@garbage-day/engine';
import { keyLabel } from '../../input/bindings';
import type { MatchSession } from '../../state/MatchSession';
import { MatchSessionContext } from '../../state/matchContexts';
import { usePrefs } from '../../state/prefs';
import { mmss } from './format';
import styles from './Match.module.css';

const useMatch = MatchSessionContext.useSelector;

function Board({
  session,
  seat,
  label,
}: {
  session: MatchSession;
  seat: PlayerIndex;
  label: string;
}) {
  return (
    <div className={styles.board}>
      <BoardCanvas
        label={label}
        source={(now) => {
          session.frame(now);
          return session.board(seat);
        }}
      />
    </div>
  );
}

function PlayerMeter({ seat }: { seat: PlayerIndex }) {
  const total = useMatch((v) => v.players[seat].meterTotal);
  const ready = useMatch((v) => v.players[seat].meterReady);
  const shielded = useMatch((v) => v.players[seat].shielded);
  return <Meter total={total} ready={ready} shielded={shielded} />;
}

/** My side: hold, power-up and next pieces, my board with its ghost, and my meter. */
export function PlayerPanel({ session }: { session: MatchSession }) {
  const hold = useMatch((v) => v.players[0].hold);
  const holdUsed = useMatch((v) => v.players[0].holdUsed);
  const power = useMatch((v) => v.players[0].power);
  const next = useMatch((v) => v.players[0].next);
  const powerKey = usePrefs((s) => keyLabel(s.bindings.power[0] ?? ''));
  return (
    <div className={styles.panel}>
      <div className={styles.side}>
        <HoldSlot piece={hold} used={holdUsed} />
        <PowerSlot kind={power} hint={powerKey} />
        <NextQueue pieces={next} />
      </div>
      <Board session={session} seat={0} label="Your board" />
      <PlayerMeter seat={0} />
    </div>
  );
}

/** The rival's side, mirrored: their meter, their board, their hold and power-up; next hidden. */
export function OpponentPanel({ session, name }: { session: MatchSession; name: string }) {
  const hold = useMatch((v) => v.players[1].hold);
  const power = useMatch((v) => v.players[1].power);
  return (
    <div className={styles.panel}>
      <PlayerMeter seat={1} />
      <Board session={session} seat={1} label={`${name}'s board`} />
      <div className={styles.side}>
        <HoldSlot piece={hold} />
        <PowerSlot kind={power} />
        <NextQueue pieces="hidden" />
      </div>
    </div>
  );
}

/** The centre column: the countdown, the clock, the speed, and the lines each side has sent. */
export function CentreColumn() {
  const phase = useMatch((v) => v.phase);
  const countdown = useMatch((v) => v.countdown);
  const clock = useMatch((v) => v.clock);
  const level = useMatch((v) => v.level);
  const progress = useMatch((v) => v.progress);
  const hot = useMatch((v) => v.hot);
  const mine = useMatch((v) => v.players[0].lines);
  const sent = useMatch((v) => v.players[0].sent);
  return (
    <div className={styles.lane}>
      {(phase === 'countdown' || (phase === 'playing' && clock === 0)) && (
        <Countdown value={phase === 'countdown' ? countdown : 0} />
      )}
      <span className={styles.clock} aria-label={`Match clock ${mmss(clock)}`}>
        {mmss(clock)}
      </span>
      <SpeedChip level={level} progress={progress} hot={hot} />
      <span className={styles.stats}>
        Lines {mine}
        <br />
        Sent {sent}
      </span>
    </div>
  );
}
