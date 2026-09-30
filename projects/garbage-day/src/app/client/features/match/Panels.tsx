import {
  HoldSlot,
  Meter,
  NextQueue,
  PowerSlot,
  BoardCanvas,
  SpeedChip,
  Countdown,
  QUAD,
  ShowdownBanner,
} from '@garbage-day/ui';
import type { PlayerIndex } from '@garbage-day/engine';
import { useRef } from 'react';
import { keyLabel } from '../../input/bindings';
import type { MatchSession } from '../../state/MatchSession';
import { MatchSessionContext } from '../../state/matchContexts';
import { usePrefs } from '../../state/prefs';
import { BoardFx } from './BoardFx';
import { mmss } from './format';
import { pps } from './ResultCard';
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
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.board} ref={box} data-board={seat}>
      <BoardCanvas
        label={label}
        source={(now) => {
          session.frame(now);
          return session.board(seat);
        }}
      />
      <BoardFx session={session} seat={seat} board={box} />
    </div>
  );
}

function PlayerMeter({ seat }: { seat: PlayerIndex }) {
  const total = useMatch((v) => v.players[seat].meterTotal);
  const ready = useMatch((v) => v.players[seat].meterReady);
  const shielded = useMatch((v) => v.players[seat].shielded);
  return (
    <div className={styles.meter} data-meter={seat}>
      <Meter total={total} ready={ready} shielded={shielded} />
    </div>
  );
}

/** A side's running stats under its board (controls and layout, "Match screen"). */
function LiveStats({ seat }: { seat: PlayerIndex }) {
  const t = useMatch((v) => v.players[seat].totals);
  const clock = useMatch((v) => v.clock);
  return (
    <p className={styles.live}>
      Lines {t.lines} · Sent {t.sent} · {pps(t.pieces, clock)} pieces/s · {QUAD.many} {t.quads} ·
      T-spins {t.tspins}
    </p>
  );
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
      <LiveStats seat={0} />
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
      <LiveStats seat={1} />
    </div>
  );
}

/** The showdown across the top of the stage: announced 5 s ahead, then under way (US-11). */
export function MatchBanner() {
  const showdown = useMatch((v) => v.showdown);
  if (!showdown) return null;
  return showdown.startsIn === null ? (
    <ShowdownBanner kind={showdown.kind} />
  ) : (
    <ShowdownBanner kind={showdown.kind} startsIn={showdown.startsIn} />
  );
}

/** The centre column: the countdown, the clock, the speed, and the referee attacks pass through. */
export function CentreColumn() {
  const phase = useMatch((v) => v.phase);
  const countdown = useMatch((v) => v.countdown);
  const clock = useMatch((v) => v.clock);
  const level = useMatch((v) => v.level);
  const progress = useMatch((v) => v.progress);
  const hot = useMatch((v) => v.hot);
  return (
    <div className={styles.lane}>
      {(phase === 'countdown' || (phase === 'playing' && clock === 0)) && (
        <Countdown value={phase === 'countdown' ? countdown : 0} />
      )}
      <span className={styles.clock} aria-label={`Match clock ${mmss(clock)}`}>
        {mmss(clock)}
      </span>
      <SpeedChip level={level} progress={progress} hot={hot} />
      <span className={styles.referee} data-referee="">
        Referee
      </span>
    </div>
  );
}
