import { Button } from '@garbage-day/ui';
import { useState } from 'react';
import { useFetcher, useNavigate } from 'react-router';
import { usePrefs } from '../../state/prefs';
import { MatchSettingsForm } from '../match-settings';
import styles from './PrivateGame.module.css';

/**
 * `/new` (PRD US-02): the match settings, starting from the last game's, then the game itself.
 * Making it takes the host to its lobby, where the link and code are.
 */
export function CreateGameScreen() {
  const fetcher = useFetcher<{ failed: true }>();
  const navigate = useNavigate();
  const last = usePrefs((s) => s.settings);
  const remember = usePrefs((s) => s.setSettings);
  const [settings, setSettings] = useState(last);
  const busy = fetcher.state !== 'idle';
  const create = () => {
    remember(settings);
    void fetcher.submit({ settings }, { method: 'post', encType: 'application/json' });
  };
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Create a game</h1>
      <section className={styles.section}>
        <MatchSettingsForm value={settings} onChange={setSettings} />
        <p className={styles.note}>
          You can still change them in the lobby, until you both press Ready.
        </p>
      </section>
      {fetcher.data?.failed && (
        <p role="alert">The game couldn’t be made. Check your connection and try again.</p>
      )}
      <div className={styles.actions}>
        <Button variant="primary" size="large" disabled={busy} onClick={create}>
          {busy ? 'Creating…' : 'Create game'}
        </Button>
        <Button variant="ghost" onClick={() => void navigate('/')}>
          Back
        </Button>
      </div>
    </main>
  );
}
