import { TPS, type PlayerIndex } from '@garbage-day/engine';
import { Button, Confetti, QUAD, VisuallyHidden, type Point } from '@garbage-day/ui';
import { useEffect, useEffectEvent, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import type { PlayerTotals } from '../../state/MatchSession';
import { MatchSessionContext } from '../../state/matchContexts';
import { resultCopy } from './resultCopy';
import styles from './Match.module.css';

const useMatch = MatchSessionContext.useSelector;

/** Pieces per second over the active play, to one decimal. */
export const pps = (pieces: number, seconds: number) =>
  seconds > 0 ? (Math.round((pieces / seconds) * 10) / 10).toFixed(1) : '0.0';

const ROWS: readonly [string, (t: PlayerTotals, seconds: number) => string | number][] = [
  ['Lines', (t) => t.lines],
  ['Garbage sent', (t) => t.sent],
  [QUAD.many, (t) => t.quads],
  ['T-spins', (t) => t.tspins],
  ['Power-ups used', (t) => t.powersUsed],
  ['Pieces per second', (t, s) => pps(t.pieces, s)],
];

/** The result's stats for both players (US-15). */
function StatsTable({ opponent, seconds }: { opponent: string; seconds: number }) {
  const mine = useMatch((v) => v.players[0].totals);
  const theirs = useMatch((v) => v.players[1].totals);
  return (
    <table className={styles.statsTable}>
      <caption>
        <VisuallyHidden>Match stats</VisuallyHidden>
      </caption>
      <thead>
        <tr>
          <td />
          <th scope="col">You</th>
          <th scope="col">{opponent}</th>
        </tr>
      </thead>
      <tbody>
        {ROWS.map(([name, value]) => (
          <tr key={name}>
            <th scope="row">{name}</th>
            <td>{value(mine, seconds)}</td>
            <td>{value(theirs, seconds)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Where confetti starts: the top of the winner's board. */
function boardTop(stage: HTMLElement | null, seat: PlayerIndex): Point | null {
  const r = stage?.querySelector(`[data-board="${seat}"]`)?.getBoundingClientRect();
  return r ? { x: r.left + r.width / 2, y: r.top + r.height / 3 } : null;
}

/**
 * The result over the stage (US-15): who won and why, both players' stats, then Rematch or Home.
 * A win plays the fanfare and throws confetti from the player's board. Focus goes to the card, not
 * to Rematch: a player still pressing Space to drop when the match ends must see the result, not
 * start the next match. Rematch is the first Tab stop.
 */
export function ResultCard({
  opponent,
  stage,
  onSound,
  onRematch,
}: {
  opponent: string;
  stage: RefObject<HTMLElement | null>;
  onSound: (name: 'win' | 'lose') => void;
  onRematch?: () => void;
}) {
  const app = AppActorContext.useActorRef();
  // Online, a rematch needs both to agree; the Match DO tells both when the 30 s lapse (US-15).
  const rematch = useMatch((v) => v.rematch);
  const myRematch = rematch?.mine;
  const theirRematch = rematch?.theirs;
  const navigate = useNavigate();
  const result = useMatch((v) => v.result);
  const [confettiDone, setConfettiDone] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const announce = useEffectEvent((won: boolean) => onSound(won ? 'win' : 'lose'));
  const winner = result?.winner;
  useEffect(() => {
    if (winner !== undefined) announce(winner === 0);
    card.current?.focus();
  }, [winner]);
  if (!result) return null;
  const { title, why } = resultCopy(result, opponent);
  return (
    <div className={styles.overlay}>
      <div className={styles.result} role="dialog" aria-label={title} tabIndex={-1} ref={card}>
        <h2>{title}</h2>
        <p>{why}</p>
        <StatsTable opponent={opponent} seconds={result.activeTicks / TPS} />
        <div className={styles.actions}>
          <Button
            variant="primary"
            disabled={myRematch}
            onClick={() => {
              app.send({ type: 'REMATCH' });
              if (onRematch) onRematch();
              else app.send({ type: 'REMATCH_ACCEPTED' });
            }}
          >
            {myRematch ? 'Waiting for RIVAL…' : theirRematch ? 'Rival wants a rematch' : 'Rematch'}
          </Button>
          <Button
            onClick={() => {
              app.send({ type: 'HOME' });
              void navigate('/');
            }}
          >
            Home
          </Button>
        </div>
      </div>
      {winner === 0 && !confettiDone && (
        <Confetti origin={() => boardTop(stage.current, 0)} onDone={() => setConfettiDone(true)} />
      )}
    </div>
  );
}
