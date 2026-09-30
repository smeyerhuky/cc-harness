import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button, IconButton } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Dialog, Sheet } from './Dialog';
import { Popover } from './Popover';
import { Select } from './Select';
import { Slider } from './Slider';
import { Stepper } from './Stepper';
import { Toast } from './Toast';
import { Toggle } from './Toggle';
import { VisuallyHidden } from './VisuallyHidden';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('Button', () => {
  it('is a button that clicks, and does nothing when disabled', () => {
    const click = vi.fn();
    const { rerender } = render(
      <Button variant="primary" onClick={click}>
        Play a bot
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Play a bot' });
    expect(button.getAttribute('type')).toBe('button');
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
    rerender(
      <Button disabled onClick={click}>
        Play a bot
      </Button>,
    );
    fireEvent.click(screen.getByRole('button'));
    expect(click).toHaveBeenCalledOnce();
  });

  it('IconButton is named by its label', () => {
    render(<IconButton label="Settings">⚙</IconButton>);
    expect(screen.getByRole('button', { name: 'Settings' }).getAttribute('title')).toBe('Settings');
  });
});

describe('Chip and Card', () => {
  it('Chip carries its meaning in words', () => {
    render(<Chip tone="ok">online</Chip>);
    expect(screen.getByText('online')).toBeDefined();
  });

  it('Card titles its content with a heading', () => {
    render(<Card title="Bot">content</Card>);
    expect(screen.getByRole('heading', { name: 'Bot' })).toBeDefined();
  });
});

describe('Dialog', () => {
  it('opens as a modal and closes when open turns false', () => {
    const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
    const close = vi.spyOn(HTMLDialogElement.prototype, 'close');
    const { rerender } = render(
      <Dialog open title="RIVAL left the game tab" onClose={() => undefined} band>
        Waiting
      </Dialog>,
    );
    expect(showModal).toHaveBeenCalledOnce();
    expect(screen.getByRole('dialog', { name: 'RIVAL left the game tab' })).toBeDefined();
    rerender(
      <Dialog open={false} title="RIVAL left the game tab" onClose={() => undefined}>
        Waiting
      </Dialog>,
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it('asks to close on Escape instead of closing itself', () => {
    const onClose = vi.fn();
    render(
      <Sheet open title="Settings" onClose={onClose}>
        Controls
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Settings' });
    const cancel = new Event('cancel', { cancelable: true });
    fireEvent(dialog, cancel);
    expect(onClose).toHaveBeenCalledOnce();
    expect(cancel.defaultPrevented).toBe(true);
  });
});

describe('Popover', () => {
  it('uses the Popover API, opened by a button that targets it', () => {
    render(
      <>
        <button type="button" popoverTarget="help">
          Help
        </button>
        <Popover id="help" label="How to play">
          Swipe to move
        </Popover>
      </>,
    );
    const popover = document.getElementById('help');
    expect(popover?.getAttribute('popover')).toBe('auto');
    expect(popover?.getAttribute('aria-label')).toBe('How to play');
    expect(screen.getByText('Help').getAttribute('popovertarget')).toBe('help');
  });
});

describe('Toggle', () => {
  it('is a switch that flips', () => {
    const change = vi.fn();
    render(<Toggle label="Sound" checked={false} onChange={change} />);
    const toggle = screen.getByRole('switch', { name: 'Sound' });
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(toggle);
    expect(change).toHaveBeenCalledWith(true);
  });
});

describe('Select, Slider and Stepper', () => {
  it('Select reports the chosen option', () => {
    const change = vi.fn();
    render(
      <Select
        label="Mode"
        value="standard"
        options={[
          { value: 'standard', label: 'Standard' },
          { value: 'classic', label: 'Classic' },
        ]}
        onChange={change}
      />,
    );
    fireEvent.change(screen.getByLabelText('Mode'), { target: { value: 'classic' } });
    expect(change).toHaveBeenCalledWith('classic');
  });

  it('Slider reports numbers and shows its value', () => {
    const change = vi.fn();
    render(
      <Slider
        label="Skill"
        value={4}
        min={1}
        max={10}
        onChange={change}
        format={(v) => `${v}/10`}
      />,
    );
    const slider = screen.getByLabelText('Skill');
    expect(slider.getAttribute('aria-valuetext')).toBe('4/10');
    fireEvent.change(slider, { target: { value: '7' } });
    expect(change).toHaveBeenCalledWith(7);
  });

  it('Stepper steps within its range and disables at the ends', () => {
    const change = vi.fn();
    const { rerender } = render(
      <Stepper label="Pauses" value={3} min={0} max={3} onChange={change} />,
    );
    expect(screen.getByRole('button', { name: 'More Pauses' }).hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Less Pauses' }));
    expect(change).toHaveBeenCalledWith(2);
    rerender(<Stepper label="Pauses" value={0} min={0} max={3} onChange={change} />);
    expect(screen.getByRole('button', { name: 'Less Pauses' }).hasAttribute('disabled')).toBe(true);
  });
});

describe('Toast and VisuallyHidden', () => {
  it('Toast is a polite status that dismisses itself', () => {
    vi.useFakeTimers();
    const dismiss = vi.fn();
    render(<Toast message="Link copied" onDismiss={dismiss} duration={2000} />);
    expect(screen.getByRole('status').textContent).toBe('Link copied');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('VisuallyHidden keeps text for screen readers', () => {
    render(<VisuallyHidden>3 rows incoming</VisuallyHidden>);
    expect(screen.getByText('3 rows incoming')).toBeDefined();
  });
});
