import { createContext } from 'react';
import type { InputController } from '../input/InputController';
import type { MatchView } from './MatchSession';
import { createStoreContext } from './storeContext';

/**
 * The current match, stable for its whole life (client architecture, "Contexts"): components
 * read slices with `MatchSessionContext.useSelector`, and re-render only when their slice changes.
 */
export const MatchSessionContext = createStoreContext<MatchView>('MatchSessionContext');

/** The input controller the keyboard, gestures and button pad all feed. */
export const InputContext = createContext<InputController | null>(null);
