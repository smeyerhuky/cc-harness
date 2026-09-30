import { Button, Kbd } from '@garbage-day/ui';
import { Suspense, use } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import type { ServerStatus } from '../../health';
import { usePrefs } from '../../state/prefs';
import type { HomeData } from './loader';
import styles from './Home.module.css';

function Status({ status }: { status: Promise<ServerStatus> }) {
  const s = use(status);
  return (
    <p className={styles.status} role="status">
      {s.ok ? `Server ready · ${s.environment} · protocol ${s.protocol}` : 'Server unreachable'}
    </p>
  );
}

/** The start screen: the name, the ways into a match, and whether the Worker answers. */
export function HomeScreen() {
  const { status } = useLoaderData<HomeData>();
  const navigate = useNavigate();
  const handle = usePrefs((s) => s.handle);
  const newHandle = usePrefs((s) => s.newHandle);
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Garbage Day</h1>
      <p className={styles.tagline}>
        Live versus falling blocks. Press <Kbd>Space</Kbd> to drop.
      </p>
      <p className={styles.handle}>
        Playing as <strong>{handle}</strong>
        <Button variant="ghost" onClick={newHandle}>
          New name
        </Button>
      </p>
      <div className={styles.actions}>
        <Button variant="primary" size="large" onClick={() => void navigate('/bot')}>
          Play a bot
        </Button>
        <Button size="large" disabled>
          Quick match
        </Button>
        <Button size="large" disabled>
          Create game
        </Button>
        <Button variant="ghost" size="large" onClick={() => void navigate('/settings')}>
          Settings
        </Button>
      </div>
      <p className={styles.note}>Quick match and private games arrive with online play.</p>
      <Suspense
        fallback={
          <p className={styles.status} role="status">
            Checking the server…
          </p>
        }
      >
        <Status status={status} />
      </Suspense>
    </main>
  );
}
