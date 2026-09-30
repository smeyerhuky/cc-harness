import { Button } from '@garbage-day/ui';
import { useNavigate } from 'react-router';
import { SettingsPanel } from './SettingsPanel';
import styles from './Settings.module.css';

/** `/settings`: the settings panel on its own page. */
export function SettingsScreen() {
  const navigate = useNavigate();
  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <h1 className={styles.title}>Settings</h1>
        <Button onClick={() => void navigate('/')}>Done</Button>
      </div>
      <SettingsPanel />
    </main>
  );
}
