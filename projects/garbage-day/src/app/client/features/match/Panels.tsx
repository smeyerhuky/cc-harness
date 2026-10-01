import {
  HoldSlot,
  Meter,
  NextQueue,
  PowerSlot,
  BoardCanvas,
  ConnectionNotice,
  SpeedChip,
  Countdown,
  QUAD,
  ShowdownBanner,
  type StageArrangement,
} from '@garbage-day/ui';
import type { PlayerIndex } from '@garbage-day/engine';
import { useRef } from 'react';
import { keyLabel } from '../../input/bindings';
import type { Session } from '../../state/MatchSession';
import { MatchSessionContext } from '../../state/matchContexts';
import { usePrefs } from '../../state/prefs';
import { BoardFx } from './BoardFx';
import { TouchSurface } from './TouchSurface';
import { mmss } from './format';
import { pps } from './ResultCard';
import styles from './Match.module.css';

const useMatch = MatchSessionContext.useSelector;

/** Cells stop growing at 36 px on a big screen (controls and layout, "Desktop"). */
const DESKTOP_MAX_CELL = 36;

function Board({
  session,
  seat,
  label,
  layout,
}: {
  session: Session;
  seat: PlayerIndex;
  label: string;
  layout: StageArrangement;
}) {
  const box = useRef<HTMLDivElement>(null);
  return (
    <div className={styles.board} ref={box} data-board={seat}>
      <BoardCanvas
        label={label}
        {...(layout === 'desktop' ? { maxCell: DESKTOP_MAX_CELL } : {})}
        source={(now) => {
          session.frame(now);
          return session.board(seat);
        }}
      />
      <BoardFx session={session} seat={seat} board={box} />
      {seat === 0 && layout === 'portrait' && <BoardCountdown />}
      {seat === 0 && <TouchSurface />}
    </div>
  );
}

/** The countdown over my board, where there is no centre column to hold it (phone portrait). */
function BoardCountdown() {
  const phase = useMatch((v) => v.phase);
  const countdown = useMatch((v) => v.countdown);
  const clock = useMatch((v) => v.clock);
  if (!(phase === 'countdown' || (phase === 'playing' && clock === 0))) return null;
  return (
    <div className={styles.boardCountdown}>
      <Countdown value={phase === 'countdown' ? countdown : 0} />
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

/**
 * My side: hold, power-up and next pieces, my board with its ghost, and my meter; the live stats
 * under it on a big screen.
 */
export function PlayerPanel({ session, layout }: { session: Session; layout: StageArrangement }) {
  const hold = useMatch((v) => v.players[0].hold);
  const holdUsed = useMatch((v) => v.players[0].holdUsed);
  const power = useMatch((v) => v.players[0].power);
  const powerUps = useMatch((v) => v.powerUps);
  const next = useMatch((v) => v.players[0].next);
  const powerKey = usePrefs((s) => keyLabel(s.bindings.power[0] ?? ''));
  return (
    <div className={styles.panel} data-layout={layout}>
      <div className={styles.row}>
        <div className={styles.side}>
          <HoldSlot piece={hold} used={holdUsed} />
          {powerUps && <PowerSlot kind={power} hint={powerKey} />}
          <NextQueue pieces={next} />
        </div>
        <Board session={session} seat={0} label="Your board" layout={layout} />
        <PlayerMeter seat={0} />
      </div>
      {layout === 'desktop' && <LiveStats seat={0} />}
    </div>
  );
}

/**
 * The rival's side, mirrored: their meter, their board, their hold and power-up, next hidden,
 * and their stats on a big screen. Upright on a phone it is just the board and its meter.
 */
export function OpponentPanel({
  session,
  name,
  layout,
}: {
  session: Session;
  name: string;
  layout: StageArrangement;
}) {
  const hold = useMatch((v) => v.players[1].hold);
  const power = useMatch((v) => v.players[1].power);
  const powerUps = useMatch((v) => v.powerUps);
  const compact = layout === 'portrait';
  return (
    <div
      className={[styles.panel, compact && styles.compact].filter(Boolean).join(' ')}
      data-layout={layout}
    >
      <div className={styles.row}>
        <PlayerMeter seat={1} />
        <Board session={session} seat={1} label={`${name}'s board`} layout={layout} />
        {!compact && (
          <div className={styles.side}>
            <HoldSlot piece={hold} />
            {powerUps && <PowerSlot kind={power} />}
            <NextQueue pieces="hidden" />
          </div>
        )}
      </div>
      {layout === 'desktop' && <LiveStats seat={1} />}
    </div>
  );
}

/**
 * The clock and speed in the header, where there is no centre column (phone portrait), on a
 * small piece of the stage, so they keep the stage's colours on a light page.
 */
export function HeaderClock() {
  const clock = useMatch((v) => v.clock);
  const level = useMatch((v) => v.level);
  const progress = useMatch((v) => v.progress);
  const hot = useMatch((v) => v.hot);
  return (
    <span className={styles.headerClock} data-stage="">
      <SpeedChip level={level} progress={progress} hot={hot} />
      <span className={styles.clock} aria-label={`Match clock ${mmss(clock)}`}>
        {mmss(clock)}
      </span>
    </span>
  );
}

/** The showdown across the top of the stage: announced 5 s ahead, then under way (US-11). */
export function MatchBanner() {
  const showdown = useMatch((v) => v.showdown);
  const connection = useMatch((v) => v.connection);
  // The player's own connection comes first: while it is down, nothing else on the stage moves.
  if (connection === 'reconnecting' || connection === 'lost') {
    return <ConnectionNotice state={connection} />;
  }
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
