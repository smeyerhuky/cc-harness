import { Navigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import { SearchingScreen } from '../quick-match';
import { MatchScreen } from './MatchScreen';

const IN_MATCH = new Set(['countdown', 'playing', 'paused', 'result', 'rematch']);

/**
 * `/play`: whatever part of a match the app is in. With no match under way it goes home, so a
 * reload or a shared link never shows a stale screen. Each match (a rematch included) gets a
 * fresh screen and session, keyed by the machine's match counter.
 */
export function MatchRoute() {
  const state = AppActorContext.useSelector((s) => s.value);
  const match = AppActorContext.useSelector((s) => s.context.match);
  if (IN_MATCH.has(state)) return <MatchScreen key={match} />;
  if (state === 'searching' || state === 'botOffer') return <SearchingScreen />;
  // The private lobby arrives with GD-STORY-010.
  return <Navigate to="/" replace />;
}
