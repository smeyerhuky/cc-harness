import { AttackFlight, useReducedMotion, type Point } from '@garbage-day/ui';
import { useRef, useState, type RefObject } from 'react';
import type { Session } from '../../state/MatchSession';
import { useMatchEffect } from './useMatchEffect';

interface Flight {
  readonly id: number;
  readonly from: Point;
  readonly to: Point;
}

/** Half the flying token's size: flights aim its centre. */
const HALF_TOKEN = 7;

const centreOf = (el: Element | null): Point | null => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2 - HALF_TOKEN, y: r.top + r.height / 2 - HALF_TOKEN };
};

const PULSE: Keyframe[] = [
  { boxShadow: '0 0 0 0 rgb(242 193 46 / 0.8)' },
  { boxShadow: '0 0 0 14px rgb(242 193 46 / 0)' },
];

/**
 * Every attack, from the board that sent it through the referee to the other player's meter
 * (US-08). Boards and meters are found by `data-board` and `data-meter` inside `stage`, and the
 * referee badge by `data-referee`, which pulses as the attack passes. Under reduced motion the
 * flight finishes at once and the meter's count is the feedback.
 */
export function AttackLayer({
  session,
  stage,
}: {
  session: Session;
  stage: RefObject<HTMLElement | null>;
}) {
  const [flights, setFlights] = useState<readonly Flight[]>([]);
  const nextId = useRef(0);
  const reduced = useReducedMotion();
  useMatchEffect(session, (e) => {
    const root = stage.current;
    if (e.kind !== 'attack' || !root) return;
    const referee = root.querySelector('[data-referee]');
    if (!reduced && referee && typeof referee.animate === 'function') {
      referee.animate(PULSE, { duration: 600, easing: 'ease-out' });
    }
    const from = centreOf(root.querySelector(`[data-board="${e.from}"]`));
    const to = centreOf(root.querySelector(`[data-meter="${e.to}"]`));
    if (!from || !to || reduced) return;
    const id = nextId.current++;
    setFlights((all) => [...all, { id, from, to }]);
  });
  return (
    <>
      {flights.map((f) => (
        <AttackFlight
          key={f.id}
          from={f.from}
          to={f.to}
          onDone={() => setFlights((all) => all.filter((x) => x.id !== f.id))}
        />
      ))}
    </>
  );
}
