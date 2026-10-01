import { encodeClientToLobby, parseLobbyToClient } from '@garbage-day/protocol';
import { useEffect, useEffectEvent } from 'react';
import { socketUrl, webSocketLink, type Connect } from '../../net/link';
import { AppActorContext } from '../../state/appActor';
import { usePrefs } from '../../state/prefs';

// The player's place in the quick-match pool (GD-STORY-009): a socket to the Lobby DO, open while
// the app machine says they are queued, through a bot game played while waiting too. It hears
// how many are waiting and, once paired, where the match is; leaving the queue says so.

const lobbyConnect = (): Connect => webSocketLink(socketUrl('/ws/lobby', globalThis.location));

/** Holds the lobby socket while mounted; the app shell mounts it while the player is queued. */
export function QuickMatchLink({ connect = lobbyConnect }: { connect?: () => Connect }) {
  const app = AppActorContext.useActorRef();
  const handle = usePrefs((s) => s.handle);
  const queue = useEffectEvent(() => encodeClientToLobby({ type: 'queue', handle }));
  const heard = useEffectEvent((text: string): boolean => {
    const r = parseLobbyToClient(text);
    if (!r.ok) return false;
    const m = r.msg;
    if (m.type === 'waiting') app.send({ type: 'WAITING', count: m.count });
    if (m.type === 'matched') {
      app.send({ type: 'MATCHED', opponent: m.opponent, matchId: m.matchId, token: m.token });
      return true;
    }
    return false;
  });
  useEffect(() => {
    let paired = false;
    const link = connect()({
      open: () => link.send(queue()),
      message: (text) => {
        if (heard(text)) paired = true;
      },
      close: () => undefined,
    });
    return () => {
      if (!paired) link.send(encodeClientToLobby({ type: 'cancel' }));
      link.close();
    };
  }, [connect]);
  return null;
}
