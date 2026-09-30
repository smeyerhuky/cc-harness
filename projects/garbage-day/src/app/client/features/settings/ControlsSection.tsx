import { Button, IconButton, Kbd, Slider } from '@garbage-day/ui';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import {
  ACTION_LABEL,
  ACTIONS,
  bindKey,
  keyLabel,
  MAX_KEYS,
  unbindKey,
} from '../../input/bindings';
import { TIMING_TICKS, toMs, toTicks, type Action } from '../../input/InputController';
import { usePrefs } from '../../state/prefs';
import styles from './Settings.module.css';

const ms = (ticks: number) => `${toMs(ticks)} ms`;

/**
 * The keyboard, the player's way (GD-STORY-003, US-16): every action's keys, which can be added
 * and removed, and the auto-repeat delay and rate. A key already used elsewhere is refused.
 */
export function ControlsSection() {
  const bindings = usePrefs((s) => s.bindings);
  const setBindings = usePrefs((s) => s.setBindings);
  const dasMs = usePrefs((s) => s.dasMs);
  const arrMs = usePrefs((s) => s.arrMs);
  const setDas = usePrefs((s) => s.setDas);
  const setArr = usePrefs((s) => s.setArr);
  const resetControls = usePrefs((s) => s.resetControls);
  const [capturing, setCapturing] = useState<Action | null>(null);
  const [message, setMessage] = useState('');
  const addButtons = useRef(new Map<Action, HTMLButtonElement>());

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (!capturing) return;
    if (e.code === 'Tab') {
      setCapturing(null);
      setMessage('');
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (e.repeat) return;
    const action = ACTION_LABEL[capturing];
    if (e.code === 'Escape') {
      setCapturing(null);
      setMessage('');
      return;
    }
    const key = keyLabel(e.code);
    const result = bindKey(bindings, capturing, e.code);
    if (result.ok) {
      setCapturing(null);
      if (result.bindings === bindings) setMessage(`${key} is already ${action}.`);
      else {
        setBindings(result.bindings);
        setMessage(`${key} added to ${action}.`);
      }
    } else if (result.reason === 'taken') {
      setMessage(`${key} is already ${ACTION_LABEL[result.by]}. Remove it there first.`);
    } else if (result.reason === 'full') {
      setCapturing(null);
      setMessage(`${action} has ${MAX_KEYS} keys already. Remove one first.`);
    } else {
      setMessage('That key can’t be used. Try another, or Esc to stop.');
    }
  });

  useEffect(() => {
    if (!capturing) return;
    const listen = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', listen, { capture: true });
    return () => window.removeEventListener('keydown', listen, { capture: true });
  }, [capturing]);

  const add = (a: Action) => {
    if (bindings[a].length >= MAX_KEYS) {
      setMessage(`${ACTION_LABEL[a]} has ${MAX_KEYS} keys already. Remove one first.`);
      return;
    }
    setCapturing(a);
    setMessage(`Press a key for ${ACTION_LABEL[a]}, or Esc to stop.`);
  };

  const remove = (a: Action, code: string) => {
    setBindings(unbindKey(bindings, a, code));
    setMessage(`${keyLabel(code)} removed from ${ACTION_LABEL[a]}.`);
    addButtons.current.get(a)?.focus();
  };

  const reset = () => {
    resetControls();
    setCapturing(null);
    setMessage('Controls are back to the defaults.');
  };

  return (
    <section className={styles.section} aria-labelledby="settings-controls">
      <h2 id="settings-controls" className={styles.heading}>
        Controls
      </h2>
      <p className={styles.note}>
        Keys go by their place on the keyboard and are named as on a US layout. Each action takes up
        to {MAX_KEYS}.
      </p>
      <ul className={styles.actions}>
        {ACTIONS.map((a) => {
          const label = ACTION_LABEL[a];
          const keys = bindings[a];
          return (
            <li key={a} className={styles.action}>
              <span id={`action-${a}`} className={styles.actionName}>
                {label}
              </span>
              <div className={styles.keys} role="group" aria-labelledby={`action-${a}`}>
                {keys.map((code) => (
                  <span key={code} className={styles.chip}>
                    <Kbd>{keyLabel(code)}</Kbd>
                    {keys.length > 1 && (
                      <IconButton
                        variant="ghost"
                        className={styles.remove}
                        label={`Remove ${keyLabel(code)} from ${label}`}
                        onClick={() => remove(a, code)}
                      >
                        ×
                      </IconButton>
                    )}
                  </span>
                ))}
                <Button
                  variant="ghost"
                  ref={(el) => {
                    if (el) addButtons.current.set(a, el);
                    else addButtons.current.delete(a);
                  }}
                  aria-label={`Add a key to ${label}`}
                  aria-pressed={capturing === a}
                  onClick={() => (capturing === a ? setCapturing(null) : add(a))}
                  onBlur={() => {
                    if (capturing === a) setCapturing(null);
                  }}
                >
                  {capturing === a ? 'Press a key…' : 'Add key'}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className={styles.message} role="status">
        {message}
      </p>
      <Slider
        label="Auto-repeat delay"
        value={toTicks(dasMs)}
        min={TIMING_TICKS.das.min}
        max={TIMING_TICKS.das.max}
        onChange={(t) => setDas(toMs(t))}
        format={ms}
      />
      <Slider
        label="Auto-repeat rate"
        value={toTicks(arrMs)}
        min={TIMING_TICKS.arr.min}
        max={TIMING_TICKS.arr.max}
        onChange={(t) => setArr(toMs(t))}
        format={ms}
      />
      <p className={styles.note}>
        Hold a move key and the piece moves once, waits the delay, then moves again every rate.
        Lower is faster.
      </p>
      <div>
        <Button onClick={reset}>Reset controls</Button>
      </div>
    </section>
  );
}
