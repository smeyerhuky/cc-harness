import { useEffect, useState, type RefObject } from 'react';

export interface Size {
  readonly width: number;
  readonly height: number;
}

/** The content-box size of an element, kept current with a ResizeObserver. */
export function useResizeObserver(ref: RefObject<Element | null>): Size {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((s) => (s.width === width && s.height === height ? s : { width, height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
