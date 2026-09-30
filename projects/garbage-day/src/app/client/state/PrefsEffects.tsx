import { setMotionPreference } from '@garbage-day/ui';
import { useEffect } from 'react';
import { usePrefs } from './prefs';

/**
 * Applies the preferences that reach beyond React: the motion setting for the ui widgets and,
 * as `data-motion` on the root, for CSS animations.
 */
export function PrefsEffects() {
  const motion = usePrefs((s) => s.motion);
  useEffect(() => {
    setMotionPreference(motion);
    const root = document.documentElement;
    if (motion === 'reduce') root.dataset.motion = 'reduce';
    else delete root.dataset.motion;
  }, [motion]);
  return null;
}
