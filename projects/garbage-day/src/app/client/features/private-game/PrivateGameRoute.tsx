import type { RefereeResult } from '@garbage-day/engine';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import { InputController } from '../../input/InputController';
import { socketUrl, webSocketLink } from '../../net/link';
import { AppActorContext } from '../../state/appActor';
import { OnlineSession } from '../../state/OnlineSession';
import { usePrefs } from '../../state/prefs';
import { MatchStage } from '../match';
import { GameRefused } from './GameRefused';
import { LobbyScreen } from './LobbyScreen';
import type { GameSeat } from './routeData';
import { forgetSeat } from './seats';

const IN_MATCH = new Set(['countdown', 'playing', 'paused', 'result', 'rematch']);

/** `/g/:code` (PRD US-02): the game's lobby, then its match, or why there is no seat in it. */
export function PrivateGameRoute() {
  const seat = useLoaderData<GameSeat>();
  if ('refused' in seat) return <GameRefused code={seat.code} refusal={seat.refused} />;
  return <PrivateGame key={seat.code} code={seat.code} token={seat.token} />;
}

/**
 * One seat in a private game, on one session from the lobby to the result: the Match DO holds the
 * lobby on the match's own socket, and the referee starts on it once both are ready.
 */
function PrivateGame({ code, token }: { code: string; token: string }) {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const state = AppActorContext.useSelector((s) => s.value);
  const mode = AppActorContext.useSelector((s) => s.context.mode);
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
        // Both pressed Ready: the match starts against whoever the lobby last showed.
        onStart: (lobby) => {
          const rival = lobby?.handles[lobby.you === 0 ? 1 : 0];
          app.send({ type: 'BOTH_READY', opponent: rival ?? 'Rival' });
        },
        onRematch: () => app.send({ type: 'REMATCH_ACCEPTED' }),
      }),
  );
  useEffect(() => {
    app.send({ type: 'JOIN', code });
    const url = socketUrl(`/ws/match/${code}`, globalThis.location);
    session.start({ connect: webSocketLink(url), token });
    return () => session.close();
  }, [app, code, token, session]);
  const lobby = useSyncExternalStore(session.subscribe, session.getLobby);
  const refusal = useSyncExternalStore(session.subscribe, session.getRefusal);
  // A seat the Match DO turns away is gone for good: forget it, and leave the lobby.
  useEffect(() => {
    if (!refusal) return;
    forgetSeat(code);
    app.send({ type: 'LEAVE' });
  }, [app, code, refusal]);
  if (refusal)
    return <GameRefused code={code} refusal={refusal === 'expired' ? 'expired' : 'none'} />;
  if (mode === 'private' && IN_MATCH.has(state))
    return <MatchStage session={session} input={input} />;
  return (
    <LobbyScreen
      code={code}
      session={session}
      lobby={lobby}
      onLeave={() => {
        session.close();
        app.send({ type: 'LEAVE' });
        void navigate('/');
      }}
    />
  );
}
