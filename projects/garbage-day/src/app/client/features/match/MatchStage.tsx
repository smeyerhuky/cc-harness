import { Button, ScreenFrame, StageLayout, useKeyBindings, useWakeLock } from '@garbage-day/ui';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { keyMap } from '../../input/bindings';
import type { InputController } from '../../input/InputController';
import { AppActorContext } from '../../state/appActor';
import { useDev } from '../../state/dev';
import type { OnlineSession } from '../../state/OnlineSession';
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

/**
 * A match on screen (GD-STORY-001): the stage, the player's keys, and the result, for a session
 * someone else made and seated. The match screen hands it a quick or bot match's session; a
 * private game hands it the session its lobby ran on (GD-STORY-010).
 */
export function MatchStage({ session, input }: { session: OnlineSession; input: InputController }) {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const opponent = AppActorContext.useSelector((s) => s.context.opponent) ?? 'Rival';
  const state = AppActorContext.useSelector((s) => s.value);
  const over = state === 'result' || state === 'rematch';
  // The developer overlay, if it opens, reads this match (GD-TICKET-024).
  useEffect(() => useDev.getState().attach(session), [session]);
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
    session.leave();
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
            {over && (
              <ResultCard
                opponent={opponent}
                stage={stage}
                onSound={sound}
                onRematch={() => session.rematch?.()}
              />
            )}
          </div>
        </ScreenFrame>
      </InputContext>
    </MatchSessionContext.Provider>
  );
}
