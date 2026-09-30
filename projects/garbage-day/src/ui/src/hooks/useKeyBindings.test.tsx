import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyBindings } from './useKeyBindings';

const map = new Map([
  ['ArrowLeft', 'left'],
  ['Space', 'hard'],
]);

function setup(active = true) {
  const handlers = { down: vi.fn(), up: vi.fn(), reset: vi.fn() };
  const hook = renderHook(({ on }) => useKeyBindings(map, handlers, on), {
    initialProps: { on: active },
  });
  return { handlers, hook };
}

describe('useKeyBindings', () => {
  it('turns bound keys into actions and stops them scrolling the page', () => {
    const { handlers } = setup();
    const down = new KeyboardEvent('keydown', { code: 'Space', cancelable: true });
    window.dispatchEvent(down);
    expect(handlers.down).toHaveBeenCalledWith('hard');
    expect(down.defaultPrevented).toBe(true);
    fireEvent.keyUp(window, { code: 'Space' });
    expect(handlers.up).toHaveBeenCalledWith('hard');
  });

  it('ignores unbound keys, key repeats, and typing in form fields', () => {
    const { handlers } = setup();
    const other = new KeyboardEvent('keydown', { code: 'KeyQ', cancelable: true });
    window.dispatchEvent(other);
    expect(other.defaultPrevented).toBe(false);
    fireEvent.keyDown(window, { code: 'ArrowLeft', repeat: true });
    const input = document.createElement('input');
    document.body.append(input);
    fireEvent.keyDown(input, { code: 'ArrowLeft' });
    input.remove();
    expect(handlers.down).not.toHaveBeenCalled();
  });

  it('releases everything on blur and when switched off', () => {
    const { handlers, hook } = setup();
    fireEvent.blur(window);
    expect(handlers.reset).toHaveBeenCalledTimes(1);
    hook.rerender({ on: false });
    expect(handlers.reset).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    expect(handlers.down).not.toHaveBeenCalled();
  });
});
