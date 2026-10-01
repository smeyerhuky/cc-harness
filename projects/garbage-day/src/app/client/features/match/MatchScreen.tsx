import { Button, ScreenFrame, StageLayout, useKeyBindings, useWakeLock } from '@garbage-day/ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { keyMap } from '../../input/bindings';
import { InputController } from '../../input/InputController';
import { AppActorContext } from '../../state/appActor';
import { MatchSession } from '../../state/MatchSession';
import { InputContext, MatchSessionContext } from '../../state/matchContexts';
import { usePrefs } from '../../state/prefs';
import { AttackLayer } from './AttackLayer';
import { MatchFeed } from './MatchFeed';
import { CentreColumn, HeaderClock, MatchBanner, OpponentPanel, PlayerPanel } from './Panels';
import { ResultCard } from './ResultCard';
import { TouchControls } from './TouchControls';
import { useMatchLayout } from './useMatchLayout';
import { useMatchSound } from './useMatchSound';
import styles from './Match.module.css';

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;
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
  const keys = keyMap(usePrefs((s) => s.bindings));
  const dasMs = usePrefs((s) => s.dasMs);
  const arrMs = usePrefs((s) => s.arrMs);
  useEffect(() => input.setTiming(dasMs, arrMs), [input, dasMs, arrMs]);
  useKeyBindings(keys, input, !over);
  const stage = useRef<HTMLDivElement>(null);
  const sound = useMatchSound(session);
  const layout = useMatchLayout();
  // The screen stays awake while a match runs (US-19).
  useWakeLock(!over);

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
          footer={<TouchControls />}
          header={
            <div className={styles.header} data-layout={layout}>
              <span className={styles.names}>
                <span className={styles.you}>You</span>
                <span className={styles.vs}>vs</span>
                <span className={styles.rival}>{opponent}</span>
              </span>
              {layout === 'portrait' && <HeaderClock />}
              <Button variant="ghost" onClick={leave}>
                Leave
              </Button>
            </div>
          }
        >
          <div className={styles.stageBox} ref={stage}>
            <StageLayout
              layout={layout}
              leftLabel="You"
              rightLabel={opponent}
              banner={<MatchBanner />}
              left={<PlayerPanel session={session} layout={layout} />}
              centre={layout === 'portrait' ? null : <CentreColumn />}
              right={<OpponentPanel session={session} name={opponent} layout={layout} />}
              {...(layout === 'desktop'
                ? { feed: <MatchFeed session={session} opponent={opponent} /> }
                : {})}
            />
            <AttackLayer session={session} stage={stage} />
            {over && <ResultCard opponent={opponent} stage={stage} onSound={sound} />}
          </div>
        </ScreenFrame>
      </InputContext>
    </MatchSessionContext.Provider>
  );
}
