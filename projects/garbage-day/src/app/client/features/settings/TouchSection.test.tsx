import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { usePrefs } from '../../state/prefs';
import { TouchSection } from './TouchSection';

const initial = usePrefs.getState();
afterEach(() => {
  usePrefs.setState(initial, true);
  localStorage.clear();
});

describe('TouchSection', () => {
  it('sets gesture sensitivity in steps', () => {
    render(<TouchSection />);
    const slider = screen.getByRole('slider', { name: 'Gesture sensitivity' });
    expect(slider.getAttribute('aria-valuetext')).toBe('100%');
    fireEvent.change(slider, { target: { value: '1.5' } });
    expect(usePrefs.getState().sensitivity).toBe(1.5);
    expect(slider.getAttribute('aria-valuetext')).toBe('150%');
  });

  it('turning gestures off turns the pad on and hides their sensitivity', async () => {
    render(<TouchSection />);
    fireEvent.click(screen.getByRole('switch', { name: 'Gestures on the board' }));
    expect(await screen.findByRole('switch', { name: 'Button pad', checked: true })).toBeDefined();
    expect(screen.queryByRole('slider', { name: 'Gesture sensitivity' })).toBeNull();
    expect(usePrefs.getState()).toMatchObject({ gestures: false, pad: true });
  });
});
