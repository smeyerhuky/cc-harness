import { describe, expect, it } from 'vitest';
import { snapshot } from './board';
import type { PieceType, PlayerIndex } from './constants';
import type { PlayerEvent, PlayerMessage } from './messages';
import type { ActivePiece, DealtPiece } from './pieces';
import { type Input, NO_INPUT, PlayerSim } from './player';
import { DEFAULT_RULES, type Rules } from './rules';
import { boardFrom, rowsOf } from './testing';

/** A running simulation with everything it sent and emitted, ticking from t = 1. */
function setup(o: { seed?: number; idx?: PlayerIndex; rules?: Partial<Rules> } = {}) {
  const sent: PlayerMessage[] = [];
  const events: PlayerEvent[] = [];
  const sim = new PlayerSim(
    o.idx ?? 0,
    o.seed ?? 1,
    { ...DEFAULT_RULES, ...o.rules },
    {
      send: (m) => sent.push(m),
      emit: (e) => events.push(e),
    },
  );
  let t = 0;
  const h = {
    sim,
    sent,
    events,
    get t() {
      return t;
    },
    deal(...types: PieceType[]) {
      sim.onMessage(
        { type: 'bag', pieces: types.map((p): DealtPiece => ({ t: p, gem: null })) },
        t,
      );
    },
    step(input: Input = NO_INPUT, n = 1, activeTicks = 0) {
      for (let i = 0; i < n; i++) sim.step(++t, input, activeTicks);
    },
    /** Replaces the falling piece (spawning one first if needed). */
    place(p: Omit<ActivePiece, 'gem'> & { gem?: ActivePiece['gem'] }) {
      if (!sim.cur) h.step();
      sim.cur = { gem: null, ...p };
    },
    sentOf<T extends PlayerMessage['type']>(type: T) {
      return sent.filter((m): m is Extract<PlayerMessage, { type: T }> => m.type === type);
    },
    locks() {
      return events.filter((e): e is Extract<PlayerEvent, { type: 'lock' }> => e.type === 'lock');
    },
  };
  return h;
}

const many = (t: PieceType, n = 14): PieceType[] => Array.from({ length: n }, () => t);

describe('PlayerSim: spawning and the queue', () => {
  it('spawns the next piece at its spawn position and asks for a bag at 7 left', () => {
    const h = setup();
    h.deal('T', 'I', 'O', 'S', 'Z', 'J', 'L');
    h.deal('T', 'I', 'O', 'S', 'Z', 'J', 'L');
    h.step();
    expect(h.sim.cur).toMatchObject({ t: 'T', r: 0, x: 3, y: 19 });
    expect(h.sim.queue).toHaveLength(13);
    expect(h.sentOf('bagReq')).toHaveLength(0);
    h.step({ hard: true });
    h.step(NO_INPUT, 5);
    expect(h.sim.queue.length).toBeLessThanOrEqual(12);
    for (let i = 0; i < 6; i++) h.step({ hard: true }, 5);
    expect(h.sentOf('bagReq')).toHaveLength(1);
  });

  it('waits the spawn delay of 4 ticks after a lock', () => {
    const h = setup();
    h.deal(...many('O'));
    h.step({ hard: true });
    expect(h.sim.cur).toBeNull();
    h.step(NO_INPUT, 4);
    expect(h.sim.cur).toBeNull();
    h.step();
    expect(h.sim.cur?.t).toBe('O');
  });
});

describe('PlayerSim: lock delay', () => {
  it('locks a grounded piece after 0.5 s', () => {
    const h = setup();
    h.deal(...many('O'));
    h.place({ t: 'O', r: 0, x: 4, y: 1 });
    h.step(NO_INPUT, 29);
    expect(h.sim.cur).not.toBeNull();
    h.step();
    expect(h.sim.cur).toBeNull();
    expect(h.locks()).toHaveLength(1);
  });

  it('restarts the delay on a move or rotation, at most 15 times', () => {
    const h = setup();
    h.deal(...many('T'));
    h.place({ t: 'T', r: 0, x: 3, y: 1 });
    h.step(NO_INPUT, 20);
    for (let i = 0; i < 15; i++) {
      h.step({ dx: i % 2 ? -1 : 1 });
      h.step(NO_INPUT, 20);
    }
    expect(h.sim.resets).toBe(15);
    expect(h.sim.cur).not.toBeNull();
    // The 16th move no longer restarts it: 30 grounded ticks since the last reset lock the piece.
    h.step({ dx: 1 });
    h.step(NO_INPUT, 8);
    expect(h.sim.cur).toBeNull();
  });

  it('gives the resets back when the piece reaches a new lowest row', () => {
    const h = setup();
    h.deal(...many('O'));
    h.sim.board = boardFrom(['....XXXXXX']);
    h.place({ t: 'O', r: 0, x: 4, y: 2 });
    h.step();
    for (let i = 0; i < 5; i++) {
      h.step(NO_INPUT, 2);
      h.step({ dx: i % 2 ? -1 : 1 });
    }
    expect(h.sim.resets).toBe(5);
    h.step({ dx: -1 }); // x = 3 or 4, still on the ledge
    h.sim.cur = { ...(h.sim.cur as ActivePiece), x: 2 };
    h.step({ soft: true }, 2);
    expect(h.sim.cur?.y).toBe(1);
    expect(h.sim.resets).toBe(0);
  });
});

describe('PlayerSim: hold', () => {
  it('holds once per piece and swaps with the held piece', () => {
    const h = setup();
    h.deal('T', 'I', 'O', 'S', 'Z', 'J', 'L', 'T');
    h.step();
    h.step({ hold: true });
    expect(h.sim.hold?.t).toBe('T');
    expect(h.sim.cur?.t).toBe('I');
    h.step({ hold: true });
    expect(h.sim.cur?.t).toBe('I');
    h.step({ hard: true });
    h.step(NO_INPUT, 5);
    expect(h.sim.cur?.t).toBe('O');
    h.step({ hold: true });
    expect(h.sim.cur).toMatchObject({ t: 'T', x: 3, y: 19 });
    expect(h.sim.hold?.t).toBe('O');
    expect(h.events.filter((e) => e.type === 'hold')).toHaveLength(2);
  });
});

describe('PlayerSim: clears and attacks', () => {
  const tSlot = ['X.........', 'XXX...XXXX', 'XXXX.XXXXX'];

  it('scores a T-spin double when the last move was a rotation into a three-corner slot', () => {
    const h = setup();
    h.deal(...many('T'));
    h.sim.board = boardFrom(['...X......', 'XXX...XXXX', 'XXXX.XXXXX']);
    h.place({ t: 'T', r: 3, x: 3, y: 2 });
    h.step({ ccw: true });
    expect(h.sim.cur).toMatchObject({ r: 2, x: 3, y: 2 });
    h.step({ hard: true });
    const lock = h.locks()[0];
    expect(lock?.tspin).toBe(true);
    expect(lock?.clear).toMatchObject({ lines: 2, tspin: true, attack: 4 });
    expect(h.sentOf('attack')).toEqual([{ type: 'attack', rows: 4, clear: lock?.clear }]);
  });

  it('does not count a T-spin without the rotation', () => {
    const h = setup();
    h.deal(...many('T'));
    h.sim.board = boardFrom(['...X......', 'XXX...XXXX', 'XXXX.XXXXX']);
    h.place({ t: 'T', r: 2, x: 3, y: 2 });
    h.step({ hard: true });
    expect(h.locks()[0]?.clear).toMatchObject({ lines: 2, tspin: false, attack: 1 });
  });

  it('does not count a T-spin with only two corners filled', () => {
    const h = setup();
    h.deal(...many('T'));
    h.sim.board = boardFrom(tSlot);
    h.place({ t: 'T', r: 3, x: 3, y: 2 });
    h.step({ ccw: true });
    h.step({ hard: true });
    expect(h.locks()[0]?.tspin).toBe(false);
  });

  it('keeps cleared rows for the 0.2 s clear delay, then drops the rows above', () => {
    const h = setup();
    h.deal(...many('I'));
    h.sim.board = boardFrom(['.....J....', 'XXXXXX....']);
    h.place({ t: 'I', r: 0, x: 6, y: 1 });
    h.step({ hard: true });
    expect(h.sim.clearing).toEqual({ rows: [0], until: h.t + 12 });
    const lockMsg = h.sentOf('lock')[0];
    expect(lockMsg?.board.slice(0, 10)).toBe('.....J....');
    h.step(NO_INPUT, 11);
    expect(rowsOf(h.sim.board, 1)).toEqual(['.....J....', 'XXXXXXIIII']);
    h.step();
    expect(rowsOf(h.sim.board, 1)).toEqual(['..........', '.....J....']);
  });

  it('sends at least 10 rows for a perfect clear', () => {
    const h = setup();
    h.deal(...many('I'));
    h.sim.board = boardFrom(['XXXXXX....']);
    h.place({ t: 'I', r: 0, x: 6, y: 1 });
    h.step({ hard: true });
    expect(h.locks()[0]?.clear).toMatchObject({ perfectClear: true, attack: 10 });
    expect(h.sim.stats.perfectClears).toBe(1);
  });

  it('counts combos across consecutive clearing pieces and resets on a piece that clears nothing', () => {
    const h = setup();
    h.deal(...many('I'));
    const clearRowWith = (row: number) => {
      h.sim.board = boardFrom([...Array.from({ length: row }, () => 'X.........'), 'XXXXXX....']);
      h.place({ t: 'I', r: 0, x: 6, y: row + 1 });
      h.step({ hard: true });
      h.step(NO_INPUT, 16);
    };
    clearRowWith(0);
    clearRowWith(0);
    clearRowWith(0);
    expect(h.sim.combo).toBe(2);
    expect(h.locks().map((l) => l.clear?.combo)).toEqual([0, 1, 2]);
    expect(h.locks().map((l) => l.clear?.attack)).toEqual([10, 10, 10]);
    h.place({ t: 'I', r: 1, x: 0, y: 5 });
    h.step({ hard: true });
    expect(h.sim.combo).toBe(-1);
  });

  it('cancels waiting garbage before sending', () => {
    const h = setup();
    h.deal(...many('I'));
    h.sim.onMessage({ type: 'garbage', rows: 3, id: 1 }, 0);
    h.sim.board = boardFrom(['X.........', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.']);
    h.place({ t: 'I', r: 1, x: 7, y: 6 });
    h.step({ hard: true });
    expect(h.locks()[0]).toMatchObject({ sent: 1, cancelled: 3 });
    expect(h.sentOf('attack')[0]?.rows).toBe(1);
    expect(h.sim.meter).toEqual([]);
    expect(h.sim.stats).toMatchObject({ fourLineClears: 1, sent: 1, cancelled: 3, received: 3 });
  });
});

describe('PlayerSim: receiving garbage', () => {
  it('ignores a garbage id it already has', () => {
    const h = setup();
    h.sim.onMessage({ type: 'garbage', rows: 2, id: 1 }, 0);
    h.sim.onMessage({ type: 'garbage', rows: 2, id: 1 }, 5);
    expect(h.sim.meterTotal()).toBe(2);
    expect(h.sim.gotGarbage).toBe(1);
  });

  it('lands garbage after 0.5 s, on a lock that clears nothing, with holes from its own stream', () => {
    // From spikes/proof-of-concept/live/live-engine.js: seed 0xCDD72's hole streams start at
    // column 2 for player 0 and column 7 for player 1.
    for (const [idx, hole] of [
      [0, 2],
      [1, 7],
    ] as const) {
      const h = setup({ seed: 0xcdd72, idx });
      h.deal(...many('O'));
      h.step();
      h.sim.onMessage({ type: 'garbage', rows: 2, id: 1 }, h.t);
      h.step({ hard: true }); // locks at 1 tick, not ready
      expect(h.locks()[0]?.rise).toBe(0);
      h.step(NO_INPUT, 30);
      h.step({ hard: true });
      expect(h.locks()[1]?.rise).toBe(2);
      const row = '.'.repeat(hole) + 'X' + '.'.repeat(9 - hole);
      expect(
        rowsOf(h.sim.board, 1).map((r) =>
          r.replace(/X/g, '#').replace(/\./g, 'X').replace(/#/g, '.'),
        ),
      ).toEqual([row, row]);
    }
  });

  it('lands at most 8 rows per lock', () => {
    const h = setup();
    h.deal(...many('O'));
    h.step();
    h.sim.onMessage({ type: 'garbage', rows: 10, id: 1 }, 0);
    h.step(NO_INPUT, 30);
    h.step({ hard: true });
    expect(h.locks()[0]?.rise).toBe(8);
    expect(h.sim.meterTotal()).toBe(2);
    h.step(NO_INPUT, 5);
    h.step({ hard: true });
    expect(h.locks()[1]?.rise).toBe(2);
  });
});

describe('PlayerSim: power-ups', () => {
  it('banks the gem of a cleared row, and loses one when the slot is full', () => {
    const h = setup();
    h.deal(...many('I'));
    h.sim.board = boardFrom(['X.........', 'XXXXX4....']);
    h.place({ t: 'I', r: 0, x: 6, y: 1 });
    h.step({ hard: true });
    expect(h.sim.power).toBe('rush');
    expect(h.locks()[0]?.power).toBe('rush');
    h.step(NO_INPUT, 20);
    h.sim.board = boardFrom(['XXXXX1....']);
    h.place({ t: 'I', r: 0, x: 6, y: 1 });
    h.step({ hard: true });
    expect(h.sim.power).toBe('rush');
    expect(h.sim.stats.powersGot).toBe(1);
  });

  it('writes a dealt gem into the board on its cell', () => {
    const h = setup();
    h.deal('O', 'O');
    h.place({ t: 'O', r: 0, x: 0, y: 1, gem: { i: 2, type: 'bomb' } });
    h.step({ hard: true });
    expect(rowsOf(h.sim.board, 1)).toEqual(['OO........', '2O........']);
  });

  it('fires the banked power-up by sending it to the referee', () => {
    const h = setup();
    h.deal(...many('O'));
    h.sim.power = 'fog';
    h.step({ power: true });
    expect(h.sim.power).toBeNull();
    expect(h.sentOf('use')).toEqual([{ type: 'use', power: 'fog' }]);
    expect(h.sim.stats.powersUsed).toBe(1);
  });

  it('applies each power-up at its stamped tick, to the side it affects', () => {
    const h = setup();
    h.deal(...many('O'));
    h.step();
    h.sim.onMessage({ type: 'garbage', rows: 4, id: 1 }, h.t);
    h.sim.onMessage({ type: 'power', kind: 'shield', by: 0, at: h.t + 12 }, h.t);
    h.step(NO_INPUT, 11);
    expect(h.sim.meterTotal()).toBe(4);
    h.step();
    expect(h.sim.meterTotal()).toBe(0);
    expect(h.sim.fx.shieldUntil).toBe(h.t + 5 * 60);

    h.sim.onMessage({ type: 'power', kind: 'fog', by: 0, at: h.t }, h.t);
    h.sim.onMessage({ type: 'power', kind: 'rush', by: 0, at: h.t }, h.t);
    h.step();
    expect(h.sim.fx).toMatchObject({ fogUntil: -1, rushUntil: -1 });

    h.sim.onMessage({ type: 'power', kind: 'fog', by: 1, at: h.t + 1 }, h.t);
    h.sim.onMessage({ type: 'power', kind: 'rush', by: 1, at: h.t + 1 }, h.t);
    h.step();
    expect(h.sim.fx).toMatchObject({ fogUntil: h.t + 6 * 60, rushUntil: h.t + 6 * 60 });
    expect(h.sim.level(h.t, 0)).toBe(5);
    expect(h.sim.level(h.t + 6 * 60, 0)).toBe(1);
  });

  it('bombs away the bottom 3 rows, garbage included', () => {
    const h = setup();
    h.deal(...many('O'));
    h.step();
    h.sim.board = boardFrom(['...J......', 'XXXX.XXXXX', 'XXXX.XXXXX', 'LLL.......']);
    h.sim.onMessage({ type: 'power', kind: 'bomb', by: 0, at: h.t + 1 }, h.t);
    h.step();
    expect(rowsOf(h.sim.board, 1)).toEqual(['..........', '...J......']);
  });

  it('keeps rows waiting to clear lined up when a bomb lands during the clear delay', () => {
    const h = setup();
    h.deal(...many('I'));
    h.sim.board = boardFrom(['...J......', 'XXXXXX....', 'XX.XXXXXXX', 'XX.XXXXXXX', 'XX.XXXXXXX']);
    h.place({ t: 'I', r: 0, x: 6, y: 4 });
    h.step({ hard: true });
    expect(h.sim.clearing?.rows).toEqual([3]);
    h.sim.onMessage({ type: 'power', kind: 'bomb', by: 0, at: h.t + 1 }, h.t);
    h.step(NO_INPUT, 12);
    expect(rowsOf(h.sim.board, 1)).toEqual(['..........', '...J......']);
  });
});

describe('PlayerSim: speed', () => {
  it('follows the active-play clock and Sudden death', () => {
    const h = setup();
    expect(h.sim.level(0, 900)).toBe(2);
    h.sim.onMessage({ type: 'showdown', kind: 'sudden', phase: 'start' }, 0);
    expect(h.sim.level(0, 150 * 60)).toBe(15);
    h.sim.onMessage({ type: 'showdown', kind: 'double', phase: 'start' }, 0);
    expect(h.sim.level(0, 900)).toBe(2);
  });

  it('drops a piece one row per second at level 1', () => {
    const h = setup();
    h.deal(...many('O'));
    h.step(); // spawns, and counts as the piece's first tick of gravity
    const y = h.sim.cur?.y ?? 0;
    h.step(NO_INPUT, 58);
    expect(h.sim.cur?.y).toBe(y);
    h.step();
    expect(h.sim.cur?.y).toBe(y - 1);
  });
});

describe('PlayerSim: topping out', () => {
  it('blocks out when the next piece cannot spawn', () => {
    const h = setup();
    h.deal(...many('T'));
    h.sim.board = boardFrom(['....X.....', ...Array.from({ length: 18 }, () => 'X.........')]);
    h.step();
    expect(h.sim.alive).toBe(false);
    expect(h.sentOf('topout')).toEqual([{ type: 'topout', why: 'block out' }]);
  });

  it('locks out when a piece locks entirely above the visible board', () => {
    const h = setup();
    h.deal(...many('I'));
    h.step();
    h.sim.board = boardFrom(Array.from({ length: 20 }, () => '.XXXXXXXXX'));
    h.sim.cur = { t: 'I', r: 0, x: 3, y: 21, gem: null };
    h.step({ hard: true });
    expect(h.sentOf('topout')).toEqual([{ type: 'topout', why: 'lock out' }]);
  });

  it('is buried when landing garbage pushes blocks beyond the hidden rows', () => {
    const h = setup();
    h.deal(...many('O'));
    h.step();
    h.sim.board = boardFrom(Array.from({ length: 24 }, () => 'X.........'));
    h.sim.onMessage({ type: 'garbage', rows: 1, id: 1 }, 0);
    h.step(NO_INPUT, 30);
    h.place({ t: 'O', r: 0, x: 4, y: 1 });
    h.step({ hard: true });
    expect(h.sentOf('lock')).toHaveLength(1);
    expect(h.sentOf('topout')).toEqual([{ type: 'topout', why: 'buried' }]);
    expect(h.events.map((e) => e.type)).toEqual(['incoming', 'lock', 'topout']);
  });
});

describe('PlayerSim: the referee’s flow messages', () => {
  it('stays frozen until the start or resume tick, and freezes for a pause or a result', () => {
    const h = setup();
    expect(h.sim.frozen).toBe(true);
    h.sim.onMessage({ type: 'start', goAt: 180 }, 0);
    h.sim.checkResume(179);
    expect(h.sim.frozen).toBe(true);
    h.sim.checkResume(180);
    expect(h.sim.frozen).toBe(false);
    h.sim.onMessage(
      { type: 'paused', by: 1, reason: 'tab', deadline: 7400, pausesLeft: 1, budgeted: true },
      200,
    );
    expect(h.sim).toMatchObject({ frozen: true, resumeAt: -1 });
    h.sim.onMessage({ type: 'resume', at: 400, by: 1, away: 20, pausesLeft: 1, free: false }, 220);
    h.sim.checkResume(400);
    expect(h.sim.frozen).toBe(false);
    h.sim.onMessage({ type: 'result', winner: 1, reason: 'topout', by: 0 }, 500);
    expect(h.sim.frozen).toBe(true);
    expect(h.sim.result?.winner).toBe(1);
  });

  it('reports its position for the opponent only when it changes', () => {
    const h = setup();
    h.deal(...many('O'));
    h.step();
    expect(h.sim.posMessage()).toMatchObject({ type: 'pos', cur: { t: 'O', x: 4, y: 19 } });
    expect(h.sim.posMessage()).toBeNull();
    h.step({ dx: -1 });
    expect(h.sim.posMessage()).toMatchObject({ cur: { x: 3 } });
  });

  it('sends the board after the clear in its lock message', () => {
    const h = setup();
    h.deal(...many('O'));
    h.place({ t: 'O', r: 0, x: 0, y: 1 });
    h.step({ hard: true });
    expect(h.sentOf('lock')[0]).toMatchObject({
      lines: 0,
      attack: 0,
      clear: null,
      board: snapshot(boardFrom(['OO........', 'OO........'])),
    });
  });
});
