import { Select, Toggle } from '@garbage-day/ui';
import { usePrefs, type MotionSetting } from '../../state/prefs';
import styles from './Settings.module.css';

const MOTION_OPTIONS = [
  { value: 'system', label: 'Follow my device' },
  { value: 'reduce', label: 'Reduce motion' },
] as const satisfies readonly { value: MotionSetting; label: string }[];

/**
 * The settings (GD-STORY-007): sound and motion now; controls and gestures join with their
 * stories. The same panel serves the settings page and, later, the in-match sheet.
 */
export function SettingsPanel() {
  const sound = usePrefs((s) => s.sound);
  const setSound = usePrefs((s) => s.setSound);
  const motion = usePrefs((s) => s.motion);
  const setMotion = usePrefs((s) => s.setMotion);
  return (
    <div className={styles.panel}>
      <section className={styles.section} aria-labelledby="settings-sound">
        <h2 id="settings-sound" className={styles.heading}>
          Sound
        </h2>
        <Toggle label="Sound effects" checked={sound} onChange={setSound} />
      </section>
      <section className={styles.section} aria-labelledby="settings-motion">
        <h2 id="settings-motion" className={styles.heading}>
          Motion
        </h2>
        <Select label="Animations" value={motion} options={MOTION_OPTIONS} onChange={setMotion} />
        <p className={styles.note}>
          Reduced motion turns off shaking, flying attacks and confetti. Nothing you need to see is
          lost.
        </p>
      </section>
    </div>
  );
}
