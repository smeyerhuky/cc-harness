import { act, render, screen } from '@testing-library/react';
import { Profiler } from 'react';
import { describe, expect, it } from 'vitest';
import { createStoreContext, type Store } from './storeContext';

interface Snap {
  readonly score: number;
  readonly clock: number;
}

class TestStore implements Store<Snap> {
  private snap: Snap = { score: 0, clock: 0 };
  private readonly listeners = new Set<() => void>();
  readonly subscribe = (l: () => void) => {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  };
  readonly getSnapshot = () => this.snap;
  set(next: Partial<Snap>) {
    this.snap = { ...this.snap, ...next };
    this.listeners.forEach((l) => l());
  }
}

const Match = createStoreContext<Snap>('TestMatchContext');

function Score() {
  const score = Match.useSelector((s) => s.score);
  return <p>score {score}</p>;
}

function Home() {
  return <p>home</p>;
}

describe('createStoreContext', () => {
  it('re-renders only the components whose selected value changed', () => {
    const store = new TestStore();
    const renders = { home: 0, score: 0 };
    render(
      <Match.Provider store={store}>
        <Profiler id="home" onRender={() => renders.home++}>
          <Home />
        </Profiler>
        <Profiler id="score" onRender={() => renders.score++}>
          <Score />
        </Profiler>
      </Match.Provider>,
    );
    expect(renders).toEqual({ home: 1, score: 1 });
    act(() => store.set({ score: 4 }));
    expect(screen.getByText('score 4')).toBeDefined();
    act(() => store.set({ clock: 60 }));
    act(() => store.set({ clock: 120 }));
    expect(renders).toEqual({ home: 1, score: 2 });
  });

  it('says which provider is missing', () => {
    expect(() => render(<Score />)).toThrow('TestMatchContext has no provider');
  });
});
