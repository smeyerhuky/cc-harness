import { Button } from '@garbage-day/ui';
import { useNavigate } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import { usePrefs } from '../../state/prefs';
import styles from '../screen.module.css';

/**
 * Looking for an opponent (PRD US-01): how many are waiting, Cancel, and after 20 s the offer of
 * a bot to play while waiting. Either choice keeps the player in the pool.
 */
export function SearchingScreen() {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const offered = AppActorContext.useSelector((s) => s.value === 'botOffer');
  const waiting = AppActorContext.useSelector((s) => s.context.waiting);
  const bot = usePrefs((s) => s.bot);
  const others = Math.max(0, waiting - 1);
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Looking for an opponent</h1>
      <p role="status">
        {waiting === 0
          ? 'Joining the queue…'
          : others === 0
            ? 'You are the only one waiting.'
            : `${waiting} players waiting.`}
      </p>
      {offered && (
        <section aria-label="Nobody yet" className={styles.row}>
          <p>Nobody has turned up yet.</p>
          <Button variant="primary" onClick={() => app.send({ type: 'PLAY_BOT', bot })}>
            Play a bot while you wait
          </Button>
          <Button onClick={() => app.send({ type: 'KEEP_WAITING' })}>Keep waiting</Button>
        </section>
      )}
      <div className={styles.row}>
        <Button
          variant="ghost"
          onClick={() => {
            app.send({ type: 'CANCEL' });
            void navigate('/');
          }}
        >
          Cancel
        </Button>
      </div>
    </main>
  );
}
