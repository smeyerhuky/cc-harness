import { TPS, type RefereeResult } from '@garbage-day/engine';
import { describe, expect, it, vi } from 'vitest';
import { InputController } from '../input/InputController';
import { MatchSession } from './MatchSession';

const FRAME = 1000 / 60;

function setup() {
  const input = new InputController();
  const onGo = vi.fn();
  const onEnd = vi.fn<(r: RefereeResult) => void>();
  const session = new MatchSession({ seed: 1234, bot: { skill: 5, speed: 5 }, input, onGo, onEnd });
  let now = 1000;
  const frame = (ms = FRAME) => {
    now += ms;
    session.frame(now);
  };
  session.frame(now);
  return { session, input, onGo, onEnd, frame };
}

/** Runs frames until play starts. */
function toGo(s: ReturnType<typeof setup>) {
  for (let i = 0; i < 5 * 60 && s.session.getSnapshot().phase !== 'playing'; i++) s.frame();
  expect(s.session.getSnapshot().phase).toBe('playing');
}

describe('MatchSession', () => {
  it('counts down 3, 2, 1, then starts play once', () => {
    const s = setup();
    const seen: number[] = [];
    for (let i = 0; i < 5 * 60; i++) {
      const v = s.session.getSnapshot();
      if (v.phase === 'countdown' && seen.at(-1) !== v.countdown) seen.push(v.countdown);
      s.frame();
    }
    expect(seen).toEqual([3, 2, 1]);
    expect(s.session.getSnapshot()).toMatchObject({ phase: 'playing', countdown: 0 });
    expect(s.onGo).toHaveBeenCalledOnce();
  });

  it('ignores keys pressed during the countdown', () => {
    const s = setup();
    s.input.down('hard');
    toGo(s);
    expect(s.input.hasPending()).toBe(false);
  });

  it('draws a move in the first frame after the key, even with less than a tick elapsed', () => {
    const s = setup();
    toGo(s);
    s.frame();
    const before = s.session.board(0).piece?.x;
    expect(before).toBeDefined();
    s.input.down('left');
    s.frame(1);
    expect(s.session.board(0).piece?.x).toBe((before ?? 0) - 1);
  });

  it('steps nothing for a repeated or broken frame time', () => {
    const s = setup();
    toGo(s);
    s.frame();
    const t0 = s.session.match.t;
    s.frame(0);
    s.session.frame(Number.NaN);
    expect(s.session.match.t).toBe(t0);
    s.frame();
    expect(s.session.match.t).toBe(t0 + 1);
  });

  it('repeats a held move at the player’s delay and rate, in real time', () => {
    const s = setup();
    s.input.setTiming(250, 100);
    toGo(s);
    s.frame();
    const x0 = s.session.board(0).piece?.x ?? 0;
    s.input.down('left');
    let elapsed = 0;
    const movedBy = (ms: number) => {
      while (elapsed < ms) {
        s.frame();
        elapsed += FRAME;
      }
      return x0 - (s.session.board(0).piece?.x ?? 0);
    };
    // Once at once; again at 250 ms and 350 ms. A press may run a tick early (US-05), so each
    // check sits more than a tick from the moment it tests.
    expect(movedBy(1)).toBe(1);
    expect(movedBy(225)).toBe(1);
    expect(movedBy(275)).toBe(2);
    expect(movedBy(325)).toBe(2);
    expect(movedBy(375)).toBe(3);
  });

  it('catches up at most 250 ms after a long gap', () => {
    const s = setup();
    toGo(s);
    const t0 = s.session.match.t;
    s.frame(10_000);
    expect(s.session.match.t - t0).toBe(Math.floor(0.25 * TPS));
  });

  it('notifies subscribers only when the view changes', () => {
    const s = setup();
    const onChange = vi.fn();
    s.session.subscribe(onChange);
    for (let i = 0; i < 2 * 60; i++) s.frame();
    expect(onChange.mock.calls.length).toBeGreaterThan(0);
    expect(onChange.mock.calls.length).toBeLessThan(10);
    const snap = s.session.getSnapshot();
    expect(s.session.getSnapshot()).toBe(snap);
  });

  it('shows the ghost on my board only, and a hard drop lands the piece', () => {
    const s = setup();
    toGo(s);
    expect(s.session.board(0).ghost).toBe(true);
    expect(s.session.board(1).ghost).toBe(false);
    s.input.down('hard');
    s.frame();
    s.input.up('hard');
    expect(s.session.board(0).board.some((c) => c !== 0)).toBe(true);
  });

  it('plays to a result and reports it once', () => {
    const s = setup();
    toGo(s);
    for (let i = 0; i < 4000 && !s.session.getSnapshot().result; i++) {
      s.input.down('hard');
      s.frame();
      s.input.up('hard');
    }
    const view = s.session.getSnapshot();
    expect(view.phase).toBe('over');
    expect(view.result).toMatchObject({ winner: 1, reason: 'topout' });
    expect(view.players[0].alive).toBe(false);
    expect(s.session.board(0).dead).toBe(true);
    s.frame();
    expect(s.onEnd).toHaveBeenCalledOnce();
  });
});
