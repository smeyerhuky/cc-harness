import { Button, Kbd } from '@garbage-day/ui';
import { Suspense, use, useId, useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router';
import type { ServerStatus } from '../../health';
import { keyLabel } from '../../input/bindings';
import { AppActorContext } from '../../state/appActor';
import { GAME_CODE } from '../../state/appMachine';
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

/** A code as typed: any case, with or without its `GD-` (PRD US-02). */
const asCode = (text: string): string => {
  const t = text.trim().toUpperCase();
  return /^[A-Z0-9]{4}$/.test(t) ? `GD-${t}` : t;
};

/** A friend's game by its code, for whoever was sent the code rather than the link. */
function JoinByCode() {
  const navigate = useNavigate();
  const id = useId();
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState(false);
  return (
    <form
      className={styles.join}
      onSubmit={(e) => {
        e.preventDefault();
        const code = asCode(text);
        if (GAME_CODE.test(code)) void navigate(`/g/${code}`);
        else setWrong(true);
      }}
    >
      <label htmlFor={id}>Have a game code?</label>
      <input
        id={id}
        className={styles.code}
        value={text}
        placeholder="GD-7KQ4"
        maxLength={7}
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={wrong}
        aria-describedby={wrong ? `${id}-wrong` : undefined}
        onChange={(e) => {
          setText(e.target.value);
          setWrong(false);
        }}
      />
      <Button type="submit">Join</Button>
      {wrong && (
        <p id={`${id}-wrong`} className={styles.note} role="alert">
          A game code is GD- and four letters or digits.
        </p>
      )}
    </form>
  );
}

/** The start screen: the name, the ways into a match, and whether the Worker answers. */
export function HomeScreen() {
  const { status } = useLoaderData<HomeData>();
  const navigate = useNavigate();
  const app = AppActorContext.useActorRef();
  const handle = usePrefs((s) => s.handle);
  const newHandle = usePrefs((s) => s.newHandle);
  const dropKey = usePrefs((s) => keyLabel(s.bindings.hard[0] ?? ''));
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Garbage Day</h1>
      <p className={styles.tagline}>
        Live versus falling blocks.
        {dropKey && (
          <>
            {' '}
            Press <Kbd>{dropKey}</Kbd> to drop.
          </>
        )}
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
        <Button
          size="large"
          onClick={() => {
            app.send({ type: 'QUICK_MATCH' });
            void navigate('/play');
          }}
        >
          Quick match
        </Button>
        <Button size="large" onClick={() => void navigate('/new')}>
          Create game
        </Button>
        <Button variant="ghost" size="large" onClick={() => void navigate('/settings')}>
          Settings
        </Button>
      </div>
      <JoinByCode />
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
