import type { RefereeResult } from '@garbage-day/engine';
import { useEffect, useState } from 'react';
import { playBot } from '../../bot/botMatch';
import { InputController } from '../../input/InputController';
import { socketUrl, webSocketLink } from '../../net/link';
import { AppActorContext } from '../../state/appActor';
import { OnlineSession } from '../../state/OnlineSession';
import { usePrefs } from '../../state/prefs';
import { MatchStage } from './MatchStage';

/**
 * A quick or bot match (GD-STORY-001): its session and the player's input, seated, then the
 * stage. Every match plays through the Match DO (GD-STORY-011): against a person found by quick
 * match, or against a bot playing from its own Web Worker on a match made for the two
 * (GD-STORY-015). One screen per match; a rematch mounts a new one, on a new match.
 */
export function MatchScreen() {
  const app = AppActorContext.useActorRef();
  const bot = AppActorContext.useSelector((s) => s.context.bot);
  const mode = AppActorContext.useSelector((s) => s.context.mode);
  const matchId = AppActorContext.useSelector((s) => s.context.matchId);
  const token = AppActorContext.useSelector((s) => s.context.token);
  const handle = usePrefs((s) => s.handle);
  const botSettings = usePrefs((s) => s.botSettings);
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
    if (mode === 'bot') return playBot(s, bot ?? { skill: 5, speed: 5 }, botSettings);
    if (matchId && token) {
      const url = socketUrl(`/ws/match/${matchId}`, globalThis.location);
      s.start({ connect: webSocketLink(url), token });
    } else s.fail();
    return () => s.close();
  });
  useEffect(() => join(session), [join, session]);
  return <MatchStage session={session} input={input} />;
}
