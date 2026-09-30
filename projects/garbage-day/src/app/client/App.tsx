import type { DataRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import { AppActorContext } from './state/appActor';
import { PrefsEffects } from './state/PrefsEffects';

/** The app: the screen-flow actor around the router (client architecture, "Contexts"). */
export function App({ router }: { router: DataRouter }) {
  return (
    <AppActorContext.Provider>
      <PrefsEffects />
      <RouterProvider router={router} />
    </AppActorContext.Provider>
  );
}
