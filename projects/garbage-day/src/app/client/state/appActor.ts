import { createActorContext } from '@xstate/react';
import { appMachine } from './appMachine';

/**
 * The app actor for the whole tree: `useSelector` for values, `useActorRef().send` for events
 * (client architecture, "Contexts"). `App` provides it.
 */
export const AppActorContext = createActorContext(appMachine);
