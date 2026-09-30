import { Button } from '@garbage-day/ui';
import { useNavigate, useParams, type LoaderFunctionArgs } from 'react-router';
import { GAME_CODE } from '../../state/appMachine';
import styles from '../screen.module.css';

/** `/g/:code` answers 404 for anything that is not a game code, so the error screen explains. */
export function gameCodeLoader({ params }: LoaderFunctionArgs): null {
  if (params.code !== undefined && !GAME_CODE.test(params.code)) {
    throw new Response('Not a game code', { status: 404, statusText: 'That link is not a game' });
  }
  return null;
}

/** `/new` and `/g/:code`: private games need the Lobby Durable Object, which arrives in M3. */
export function PrivateGameScreen() {
  const { code } = useParams();
  const navigate = useNavigate();
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{code ? `Game ${code}` : 'Create a game'}</h1>
      <p>Private games arrive with online play. Until then, play a bot.</p>
      <div className={styles.row}>
        <Button variant="primary" onClick={() => void navigate('/bot')}>
          Play a bot
        </Button>
        <Button onClick={() => void navigate('/')}>Home</Button>
      </div>
    </main>
  );
}
