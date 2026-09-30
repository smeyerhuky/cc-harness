import { createContext, use, useSyncExternalStore, type ReactNode } from 'react';

/**
 * An external store: the shape `MatchSession` and the input controller take (client architecture,
 * "Where state lives"). `subscribe` must be a stable function, such as a class field arrow.
 */
export interface Store<S> {
  readonly subscribe: (onChange: () => void) => () => void;
  readonly getSnapshot: () => S;
}

/**
 * A narrow context holding a stable store, with a selector hook on `useSyncExternalStore`. The
 * context value never changes during a match, so only components whose selected value changes
 * re-render; a selector must return a primitive or an object the store keeps stable.
 */
export function createStoreContext<S>(name: string) {
  const Context = createContext<Store<S> | null>(null);
  Context.displayName = name;

  function Provider({ store, children }: { store: Store<S>; children: ReactNode }) {
    return <Context value={store}>{children}</Context>;
  }

  function useStore(): Store<S> {
    const store = use(Context);
    if (!store) throw new Error(`${name} has no provider above this component`);
    return store;
  }

  function useStoreSelector<T>(selector: (snapshot: S) => T): T {
    const store = useStore();
    return useSyncExternalStore(store.subscribe, () => selector(store.getSnapshot()));
  }

  return { Provider, useStore, useSelector: useStoreSelector };
}
