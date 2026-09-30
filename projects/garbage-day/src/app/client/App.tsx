import { Kbd } from '@garbage-day/ui';
import { Suspense, use } from 'react';
import styles from './App.module.css';
import type { ServerStatus } from './health';

function Status({ status }: { status: Promise<ServerStatus> }) {
  const s = use(status);
  return (
    <p className={styles.status} role="status">
      {s.ok ? `Server ready · ${s.environment} · protocol ${s.protocol}` : 'Server unreachable'}
    </p>
  );
}

/** The app shell: the name, what is coming, and whether the Worker answers. */
export function App({ status }: { status: Promise<ServerStatus> }) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Garbage Day</h1>
      <p className={styles.tagline}>
        Live versus falling blocks. Coming soon: press <Kbd>Space</Kbd> to drop.
      </p>
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
