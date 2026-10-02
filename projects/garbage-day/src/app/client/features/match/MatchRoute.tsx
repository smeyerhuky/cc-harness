import { Navigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import { SearchingScreen } from '../quick-match';
import { MatchScreen } from './MatchScreen';

const IN_MATCH = new Set(['countdown', 'playing', 'paused', 'result', 'rematch']);

/**
 * `/play`: whatever part of a match the app is in. With no match under way it goes home, so a
 * reload or a shared link never shows a stale screen. A rematch stays on the same screen and
 * session: the Match DO deals the next match on the same seats, and the session renews in place
 * (GD-STORY-014). Leaving the screen would close the seat the new match has just started on.
 */
export function MatchRoute() {
  const state = AppActorContext.useSelector((s) => s.value);
  if (IN_MATCH.has(state)) return <MatchScreen />;
  if (state === 'searching' || state === 'botOffer') return <SearchingScreen />;
  // The private lobby arrives with GD-STORY-010.
  return <Navigate to="/" replace />;
}
