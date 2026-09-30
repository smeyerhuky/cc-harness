import { Button } from '@garbage-day/ui';
import { Navigate, useNavigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import styles from '../screen.module.css';

/**
 * `/play`: whatever part of a match the app is in. With no match under way it goes home, so a
 * reload or a shared link never shows a stale screen. The match screen itself is GD-STORY-001.
 */
export function MatchRoute() {
  const state = AppActorContext.useSelector((s) => s.value);
  const opponent = AppActorContext.useSelector((s) => s.context.opponent);
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  if (state === 'home') return <Navigate to="/" replace />;
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{opponent ?? 'Finding a match'}</h1>
      <p role="status">{state}</p>
      <Button
        onClick={() => {
          app.send({ type: 'HOME' });
          void navigate('/');
        }}
      >
        Home
      </Button>
    </main>
  );
}
