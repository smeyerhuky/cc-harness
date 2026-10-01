import { Slider, Toggle } from '@garbage-day/ui';
import { SENSITIVITY, usePrefs } from '../../state/prefs';
import styles from './Settings.module.css';

const percent = (s: number) => `${Math.round(s * 100)}%`;

/**
 * Touch play (GD-STORY-004, US-17): gestures on the board, how far a finger travels per column
 * and how fast a flick must be, and the on-screen button pad.
 */
export function TouchSection() {
  const gestures = usePrefs((s) => s.gestures);
  const setGestures = usePrefs((s) => s.setGestures);
  const sensitivity = usePrefs((s) => s.sensitivity);
  const setSensitivity = usePrefs((s) => s.setSensitivity);
  const pad = usePrefs((s) => s.pad);
  const setPad = usePrefs((s) => s.setPad);
  return (
    <section className={styles.section} aria-labelledby="settings-touch">
      <h2 id="settings-touch" className={styles.heading}>
        Touch
      </h2>
      <Toggle label="Gestures on the board" checked={gestures} onChange={setGestures} />
      <p className={styles.note}>
        Drag sideways to move, tap to rotate (the left third turns the other way), drag down to
        soft-drop, flick down to drop, swipe up to hold.
      </p>
      {gestures && (
        <Slider
          label="Gesture sensitivity"
          value={sensitivity}
          min={SENSITIVITY.min}
          max={SENSITIVITY.max}
          step={SENSITIVITY.step}
          onChange={setSensitivity}
          format={percent}
        />
      )}
      <Toggle label="Button pad" checked={pad} onChange={setPad} />
      <p className={styles.note}>Big buttons under the boards. Turning gestures off turns it on.</p>
    </section>
  );
}
