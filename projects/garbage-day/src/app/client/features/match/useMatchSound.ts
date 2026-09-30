import { HAPTICS, Sfx, useHaptics } from '@garbage-day/ui';
import { useEffect, useState } from 'react';
import type { MatchEffect, MatchSession } from '../../state/MatchSession';
import { usePrefs } from '../../state/prefs';
import { useMatchEffect } from './useMatchEffect';

/** The sound an effect makes, from the player's side (UI language, "Sound"). */
function play(sfx: Sfx, e: MatchEffect): void {
  switch (e.kind) {
    case 'move':
      sfx.play('move');
      break;
    case 'lock':
      if (e.p === 0) sfx.play('lock');
      break;
    case 'clear':
      if (e.p === 0) sfx.play('clear', e.lines);
      break;
    case 'attack':
      if (e.from === 0) sfx.play('attack');
      break;
    case 'cancel':
      if (e.p === 0) sfx.play('cancel');
      break;
    case 'land':
      if (e.p === 0) sfx.play('land');
      break;
    case 'showdown':
      if (e.phase !== 'end') sfx.play('showdown');
      break;
    case 'powerUse':
      sfx.play('power');
      break;
    default:
      break;
  }
}

/**
 * The match's sounds, while sound is on (off until the player turns it on, US-20), and short
 * vibrations where the device supports them: a lock, and garbage landing on the player's board
 * (US-08, US-17; a hard drop's is the touch controls').
 * Returns the synth, for the result's fanfare.
 */
export function useMatchSound(session: MatchSession): (name: 'win' | 'lose') => void {
  const sound = usePrefs((s) => s.sound);
  const [sfx] = useState(() => new Sfx());
  const vibrate = useHaptics(true);
  useEffect(() => () => sfx.close(), [sfx]);
  useMatchEffect(session, (e) => {
    if (e.kind === 'lock' && e.p === 0) vibrate(HAPTICS.lock);
    if (e.kind === 'land' && e.p === 0) vibrate(HAPTICS.garbage);
    if (sound) play(sfx, e);
  });
  return (name) => {
    if (sound) sfx.play(name);
  };
}
