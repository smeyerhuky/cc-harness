import type { RefereeResult } from '@garbage-day/engine';
import { Button, ScreenFrame, StageLayout, useKeyBindings, useWakeLock } from '@garbage-day/ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { keyMap } from '../../input/bindings';
import { InputController } from '../../input/InputController';
import { AppActorContext } from '../../state/appActor';
import { useDev } from '../../state/dev';
import { playBot } from '../../bot/botMatch';
import { socketUrl, webSocketLink } from '../../net/link';
import { OnlineSession } from '../../state/OnlineSession';
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
 * A match (GD-STORY-001): the session, the player's input, the stage, and the result. Every match
 * plays through the Match DO (GD-STORY-011): against a person found by quick match, or against a
 * bot playing from its own Web Worker on a match made for the two (GD-STORY-015). One screen per
 * match; a rematch mounts a new one, on a new match.
 */
export function MatchScreen() {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const bot = AppActorContext.useSelector((s) => s.context.bot);
  const opponent = AppActorContext.useSelector((s) => s.context.opponent) ?? 'Rival';
  const state = AppActorContext.useSelector((s) => s.value);
  const mode = AppActorContext.useSelector((s) => s.context.mode);
  const matchId = AppActorContext.useSelector((s) => s.context.matchId);
  const token = AppActorContext.useSelector((s) => s.context.token);
  const handle = usePrefs((s) => s.handle);
  const [input] = useState(() => new InputController());
  const [session] = useState(
    () =>
      new OnlineSession({
        handle,
        input,
        onGo: () => app.send({ type: 'GO' }),
        onEnd: (r: RefereeResult) =>
          app.send({ type: 'ENDED', result: { winner: r.winner, reason: r.reason } }),
        onRivalBot: (rival) => app.send({ type: 'RIVAL_BOT', bot: rival }),
      }),
  );
  // How this screen's session takes its seat, and lets go of it when the screen goes: a bot
  // match is made for it, and a quick match's seat is the one the lobby gave.
  const [join] = useState(() => (s: OnlineSession): (() => void) => {
    if (mode === 'bot') return playBot(s, bot ?? { skill: 5, speed: 5 });
    if (matchId && token) {
      const url = socketUrl(`/ws/match/${matchId}`, globalThis.location);
      s.start({ connect: webSocketLink(url), token });
    } else s.fail();
    return () => s.close();
  });
  useEffect(() => join(session), [join, session]);
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
            {over && <ResultCard opponent={opponent} stage={stage} onSound={sound} />}
          </div>
        </ScreenFrame>
      </InputContext>
    </MatchSessionContext.Provider>
  );
}
