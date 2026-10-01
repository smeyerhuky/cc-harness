import { VisuallyHidden } from '@garbage-day/ui';
import { useEffect } from 'react';
import { Outlet, useMatches, type UIMatch } from 'react-router';

// Screens are routes in one page, so a screen change is not a page load: nothing renames the tab
// and a screen reader hears nothing (GD-STORY-008). Each route names its screen in its `handle`;
// the shell puts that name in the tab's title and in a polite live region, which reads it when
// the screen changes but not on the first load.

/** A route's `handle`: the screen's name, as the tab and a screen reader give it. */
export interface ScreenHandle {
  readonly title: string;
}

const isScreen = (handle: unknown): handle is ScreenHandle =>
  typeof (handle as ScreenHandle | undefined)?.title === 'string';

/** The deepest route's screen name, or null where none names one (home). */
function screenTitle(matches: readonly UIMatch[]): string | null {
  const handle = matches.findLast((m) => isScreen(m.handle))?.handle;
  return isScreen(handle) ? handle.title : null;
}

/** The root route's screen: the current screen, plus its name for the tab and screen readers. */
export function AppShell() {
  const title = screenTitle(useMatches());
  useEffect(() => {
    document.title = title ? `${title} · Garbage Day` : 'Garbage Day';
  }, [title]);
  return (
    <>
      <Outlet />
      <div aria-live="polite" aria-atomic="true">
        <VisuallyHidden>{title ?? 'Garbage Day'}</VisuallyHidden>
      </div>
    </>
  );
}
