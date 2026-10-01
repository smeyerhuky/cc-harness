import { Button } from '@garbage-day/ui';
import { useNavigate, useRevalidator } from 'react-router';
import { AppActorContext } from '../../state/appActor';
import type { SeatRefusal } from './routeData';
import styles from './PrivateGame.module.css';

const COPY: Readonly<Record<SeatRefusal, { title: string; why: string }>> = {
  full: {
    title: 'This game is full',
    why: 'Two players are already in it. Start a quick match instead?',
  },
  expired: {
    title: 'This game has expired',
    why: 'Games close after 30 minutes if nobody plays them.',
  },
  none: { title: 'No game has that code', why: 'Check the code, or ask for the link again.' },
  unreachable: {
    title: 'The server can’t be reached',
    why: 'Check your connection and try again.',
  },
};

/** A game link with no seat behind it (PRD US-02): why, and the way on from here. */
export function GameRefused({ code, refusal }: { code: string; refusal: SeatRefusal }) {
  const app = AppActorContext.useActorRef();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { title, why } = COPY[refusal];
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <p>
        Game {code}. {why}
      </p>
      <div className={styles.actions}>
        {refusal === 'full' && (
          <Button
            variant="primary"
            onClick={() => {
              app.send({ type: 'QUICK_MATCH' });
              void navigate('/play');
            }}
          >
            Quick match
          </Button>
        )}
        {(refusal === 'expired' || refusal === 'none') && (
          <Button variant="primary" onClick={() => void navigate('/new')}>
            Create a game
          </Button>
        )}
        {refusal === 'unreachable' && (
          <Button variant="primary" onClick={() => void revalidator.revalidate()}>
            Try again
          </Button>
        )}
        <Button variant="ghost" onClick={() => void navigate('/')}>
          Home
        </Button>
      </div>
    </main>
  );
}
