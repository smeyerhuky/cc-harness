import { Button } from '@garbage-day/ui';
import { Navigate, useNavigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import styles from '../screen.module.css';
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
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  if (state === 'home') return <Navigate to="/" replace />;
  if (IN_MATCH.has(state)) return <MatchScreen key={match} />;
  // Searching, the bot offer and the private lobby arrive with online play (M3).
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Finding a match</h1>
      <p role="status">{state}</p>
      <Button
        onClick={() => {
          app.send({ type: 'CANCEL' });
          void navigate('/');
        }}
      >
        Cancel
      </Button>
    </main>
  );
}
