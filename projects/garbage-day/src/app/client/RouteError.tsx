import { Button } from '@garbage-day/ui';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import styles from './features/screen.module.css';

function Explain({ retry }: { retry: string }) {
  const error = useRouteError();
  const navigate = useNavigate();
  const missing = isRouteErrorResponse(error) && error.status === 404;
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{missing ? 'Nothing here' : 'Something went wrong'}</h1>
      <p>
        {missing
          ? isRouteErrorResponse(error) && error.statusText
            ? `${error.statusText}.`
            : 'That page does not exist.'
          : 'This screen stopped working. Trying again usually fixes it.'}
      </p>
      <div className={styles.row}>
        {!missing && (
          <Button variant="primary" onClick={() => void navigate(0)}>
            {retry}
          </Button>
        )}
        <Button onClick={() => void navigate('/')}>Home</Button>
      </div>
    </main>
  );
}

/** Every route's error boundary: says what happened and offers the next sensible step. */
export function RouteError() {
  return <Explain retry="Try again" />;
}

/** The match route's: getting back into the match comes before going home. */
export function MatchRouteError() {
  return <Explain retry="Back to the match" />;
}
