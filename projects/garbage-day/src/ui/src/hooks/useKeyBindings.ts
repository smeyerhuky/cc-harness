import { useEffect, useEffectEvent } from 'react';

export interface KeyHandlers<A extends string> {
  down(action: A): void;
  up(action: A): void;
  /** Called when the window loses focus, so no key stays held. */
  reset(): void;
}

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(target.tagName));

/**
 * Maps physical keys (`KeyboardEvent.code`, so the layout doesn't matter) to actions while
 * `active`. Bound keys never scroll the page; key repeats are ignored, since auto-repeat is the
 * input controller's; typing in a form field is left alone; and losing focus releases everything.
 */
export function useKeyBindings<A extends string>(
  bindings: ReadonlyMap<string, A>,
  handlers: KeyHandlers<A>,
  active = true,
): void {
  const onKey = useEffectEvent((e: KeyboardEvent, isDown: boolean) => {
    const action = bindings.get(e.code);
    if (!action || typing(e.target)) return;
    e.preventDefault();
    if (isDown) {
      if (!e.repeat) handlers.down(action);
    } else handlers.up(action);
  });
  const onBlur = useEffectEvent(() => handlers.reset());
  useEffect(() => {
    if (!active) return;
    const down = (e: KeyboardEvent) => onKey(e, true);
    const up = (e: KeyboardEvent) => onKey(e, false);
    const blur = () => onBlur();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      onBlur();
    };
  }, [active]);
}
