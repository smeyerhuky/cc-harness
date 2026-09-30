import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_BINDINGS } from '../../input/bindings';
import { usePrefs } from '../../state/prefs';
import { ControlsSection } from './ControlsSection';

const initial = usePrefs.getState();
afterEach(() => {
  usePrefs.setState(initial, true);
  localStorage.clear();
});

const keysOf = (action: string) =>
  within(screen.getByRole('group', { name: action }))
    .queryAllByText((_, el) => el?.tagName === 'KBD')
    .map((k) => k.textContent);
const press = (code: string, init: KeyboardEventInit = {}) =>
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, ...init }));
  });
/** The section's messages (each slider's `<output>` is a status too). */
const status = () => screen.getAllByRole('status').find((el) => el.tagName === 'P')?.textContent;

describe('ControlsSection', () => {
  it('lists every action with its keys', () => {
    render(<ControlsSection />);
    expect(keysOf('Move left')).toEqual(['←']);
    expect(keysOf('Rotate clockwise')).toEqual(['↑', 'X']);
    expect(keysOf('Rotate counter-clockwise')).toEqual(['Z', 'Left Ctrl', 'Right Ctrl']);
    expect(keysOf('Hard drop')).toEqual(['Space']);
  });

  it('adds the next key pressed, and keeps it', () => {
    render(<ControlsSection />);
    const add = screen.getByRole('button', { name: 'Add a key to Hard drop' });
    fireEvent.click(add);
    expect(add.getAttribute('aria-pressed')).toBe('true');
    expect(status()).toBe('Press a key for Hard drop, or Esc to stop.');
    press('KeyJ');
    expect(keysOf('Hard drop')).toEqual(['Space', 'J']);
    expect(add.getAttribute('aria-pressed')).toBe('false');
    expect(status()).toBe('J added to Hard drop.');
    expect(usePrefs.getState().bindings.hard).toEqual(['Space', 'KeyJ']);
  });

  it('refuses a key another action has, and waits for another', () => {
    render(<ControlsSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a key to Hard drop' }));
    press('KeyZ');
    expect(status()).toBe('Z is already Rotate counter-clockwise. Remove it there first.');
    expect(keysOf('Hard drop')).toEqual(['Space']);
    press('KeyK');
    expect(keysOf('Hard drop')).toEqual(['Space', 'K']);
  });

  it('stops on Esc, ignores held-key repeats, and stops the key reaching the page', () => {
    render(<ControlsSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a key to Hard drop' }));
    press('KeyJ', { repeat: true });
    expect(keysOf('Hard drop')).toEqual(['Space']);
    const reachedPage: string[] = [];
    const listen = (e: KeyboardEvent) => reachedPage.push(e.code);
    window.addEventListener('keydown', listen);
    press('Escape');
    window.removeEventListener('keydown', listen);
    expect(reachedPage).toEqual([]);
    expect(status()).toBe('');
    press('KeyJ');
    expect(keysOf('Hard drop')).toEqual(['Space']);
  });

  it('says so when an action already has three keys', () => {
    render(<ControlsSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Add a key to Hold' }));
    expect(status()).toBe('Hold has 3 keys already. Remove one first.');
    press('KeyV');
    expect(keysOf('Hold')).toEqual(['C', 'Left Shift', 'Right Shift']);
  });

  it('removes a key, keeps the last one, and puts focus back on Add', () => {
    render(<ControlsSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove ↑ from Rotate clockwise' }));
    expect(keysOf('Rotate clockwise')).toEqual(['X']);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Add a key to Rotate clockwise' }),
    );
    expect(screen.queryByRole('button', { name: 'Remove X from Rotate clockwise' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Remove Space from Hard drop' })).toBeNull();
  });

  it('sets the auto-repeat delay and rate in whole ticks', () => {
    render(<ControlsSection />);
    const delay = screen.getByRole('slider', { name: 'Auto-repeat delay' });
    expect(delay.getAttribute('aria-valuetext')).toBe('167 ms');
    fireEvent.change(delay, { target: { value: '6' } });
    expect(delay.getAttribute('aria-valuetext')).toBe('100 ms');
    fireEvent.change(screen.getByRole('slider', { name: 'Auto-repeat rate' }), {
      target: { value: '1' },
    });
    expect(usePrefs.getState()).toMatchObject({ dasMs: 100, arrMs: 17 });
  });

  it('resets keys and timings to the defaults', () => {
    usePrefs.setState({ bindings: { ...DEFAULT_BINDINGS, hard: ['KeyJ'] }, dasMs: 50 });
    render(<ControlsSection />);
    expect(keysOf('Hard drop')).toEqual(['J']);
    fireEvent.click(screen.getByRole('button', { name: 'Reset controls' }));
    expect(keysOf('Hard drop')).toEqual(['Space']);
    expect(usePrefs.getState()).toMatchObject({ bindings: DEFAULT_BINDINGS, dasMs: 167 });
    expect(status()).toBe('Controls are back to the defaults.');
  });
});
