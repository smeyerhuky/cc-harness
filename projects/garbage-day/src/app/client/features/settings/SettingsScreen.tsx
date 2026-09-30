import { Button } from '@garbage-day/ui';
import { useNavigate } from 'react-router';
import styles from '../screen.module.css';

/** `/settings`: the settings sheet arrives with the preferences store (GD-STORY-007). */
export function SettingsScreen() {
  const navigate = useNavigate();
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Settings</h1>
      <p>Controls, sound and motion settings arrive with the preferences store.</p>
      <Button onClick={() => void navigate('/')}>Home</Button>
    </main>
  );
}
