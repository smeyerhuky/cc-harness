import { Button, ScreenFrame, StageLayout, useKeyBindings } from '@garbage-day/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DEFAULT_BINDINGS, keyMap } from '../../input/bindings';
import { InputController } from '../../input/InputController';
import { AppActorContext } from '../../state/appActor';
import { MatchSession } from '../../state/MatchSession';
import { InputContext, MatchSessionContext } from '../../state/matchContexts';
import { mmss } from './format';
import { CentreColumn, OpponentPanel, PlayerPanel } from './Panels';
import styles from './Match.module.css';

const KEYS = keyMap(DEFAULT_BINDINGS);

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
}

/** The result over the stage: who won and why, then Rematch or Home. GD-STORY-002 adds stats. */
function ResultCard({ opponent }: { opponent: string }) {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const result = AppActorContext.useSelector((s) => s.context.result);
  const clock = MatchSessionContext.useSelector((v) => v.clock);
  if (!result) return null;
  const title =
    result.winner === 0 ? 'You win' : result.winner === 1 ? `${opponent} wins` : 'No contest';
  const who = result.winner === 0 ? opponent : 'You';
  const why =
    result.reason === 'topout'
      ? `${who} topped out at ${mmss(clock)}.`
      : result.reason === 'left'
        ? 'You left the match.'
        : '';
  return (
    <div className={styles.overlay}>
      <div className={styles.result} role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {why && <p>{why}</p>}
        <div className={styles.actions}>
          <Button
            variant="primary"
            autoFocus
            onClick={() => {
              app.send({ type: 'REMATCH' });
              // A bot always accepts at once; between people this waits for both (M3).
              app.send({ type: 'REMATCH_ACCEPTED' });
            }}
          >
            Rematch
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
    </div>
  );
}

/**
 * A match against a local bot (GD-STORY-001): the session, the player's input, the stage, and the
 * result. One screen per match; a rematch mounts a new one with a new seed.
 */
export function MatchScreen() {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const bot = AppActorContext.useSelector((s) => s.context.bot);
  const opponent = AppActorContext.useSelector((s) => s.context.opponent) ?? 'Rival';
  const state = AppActorContext.useSelector((s) => s.value);
  const [input] = useState(() => new InputController());
  const [session] = useState(
    () =>
      new MatchSession({
        seed: randomSeed(),
        bot: bot ?? { skill: 5, speed: 5 },
        input,
        onGo: () => app.send({ type: 'GO' }),
        onEnd: (r) => app.send({ type: 'ENDED', result: { winner: r.winner, reason: r.reason } }),
      }),
  );
  const over = state === 'result' || state === 'rematch';
  useKeyBindings(KEYS, input, !over);

  const leave = () => {
    if (!over) app.send({ type: 'ENDED', result: { winner: 1, reason: 'left' } });
    app.send({ type: 'HOME' });
    void navigate('/');
  };

  return (
    <MatchSessionContext.Provider store={session}>
      <InputContext value={input}>
        <ScreenFrame
          locked
          header={
            <div className={styles.header}>
              <span className={styles.names}>
                <span className={styles.you}>You</span>
                <span className={styles.vs}>vs</span>
                <span className={styles.rival}>{opponent}</span>
              </span>
              <Button variant="ghost" onClick={leave}>
                Leave
              </Button>
            </div>
          }
        >
          <div className={styles.stageBox}>
            <StageLayout
              leftLabel="You"
              rightLabel={opponent}
              left={<PlayerPanel session={session} />}
              centre={<CentreColumn />}
              right={<OpponentPanel session={session} name={opponent} />}
            />
            {over && <ResultCard opponent={opponent} />}
          </div>
        </ScreenFrame>
      </InputContext>
    </MatchSessionContext.Provider>
  );
}
