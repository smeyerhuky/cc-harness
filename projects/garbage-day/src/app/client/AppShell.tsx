import { VisuallyHidden } from '@garbage-day/ui';
import { lazy, Suspense, useEffect } from 'react';
import { Outlet, useMatches, type UIMatch } from 'react-router';
import { AppActorContext } from './state/appActor';
import { useDev, useDevKey } from './state/dev';

// The developer overlay loads only once switched on (GD-TICKET-024), and the lobby socket only
// once the player queues for a quick match (GD-STORY-009).
const DevOverlay = lazy(async () => ({ default: (await import('./features/dev')).DevOverlay }));
const QuickMatchLink = lazy(async () => ({
  default: (await import('./features/quick-match')).QuickMatchLink,
}));

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

/**
 * The root route's screen: the current screen, its name for the tab and screen readers, and the
 * developer overlay when it is switched on.
 */
export function AppShell() {
  const title = screenTitle(useMatches());
  const dev = useDev((s) => s.open);
  const queued = AppActorContext.useSelector((s) => s.context.queued);
  useDevKey();
  useEffect(() => {
    document.title = title ? `${title} · Garbage Day` : 'Garbage Day';
  }, [title]);
  return (
    <>
      <Outlet />
      <div aria-live="polite" aria-atomic="true">
        <VisuallyHidden>{title ?? 'Garbage Day'}</VisuallyHidden>
      </div>
      {dev && (
        <Suspense fallback={null}>
          <DevOverlay />
        </Suspense>
      )}
      {queued && (
        <Suspense fallback={null}>
          <QuickMatchLink />
        </Suspense>
      )}
    </>
  );
}
