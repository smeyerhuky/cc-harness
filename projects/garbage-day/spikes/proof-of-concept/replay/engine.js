/* ---- Engine: pure, deterministic, shared by both "browsers" (and testable in Node) ---- */
const GD = (() => {
  const W = 10, VIS = 20, H = 24;
  const SEED = 0xCDD72;
  const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const SALT = { you: 0x9E3779B9, rival: 0x85EBCA6B };

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  // 7-bag: shuffle all seven pieces, deal them, repeat.
  function makeSequence(seed, n) {
    const rng = mulberry32(seed), out = [];
    while (out.length < n) {
      const bag = PIECES.slice();
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      out.push(...bag);
    }
    return out.slice(0, n);
  }
  // Garbage holes: a separate stream per receiving player, so garbage never shifts the piece sequence.
  function makeHoles(seed, player, n) {
    const rng = mulberry32((seed ^ SALT[player]) >>> 0);
    return Array.from({ length: n }, () => Math.floor(rng() * W));
  }
  const SEQ = makeSequence(SEED, 98);
  const HOLES = { you: makeHoles(SEED, 'you', 8), rival: makeHoles(SEED, 'rival', 8) };

  // Cell offsets [dx, dy], dy grows upward. Spawn orientations, plus a vertical I.
  const SHAPES = {
    I: [[0, 0], [1, 0], [2, 0], [3, 0]], IV: [[0, 0], [0, 1], [0, 2], [0, 3]],
    O: [[0, 0], [1, 0], [0, 1], [1, 1]], T: [[0, 0], [1, 0], [2, 0], [1, 1]],
    S: [[0, 0], [1, 0], [1, 1], [2, 1]], Z: [[1, 0], [2, 0], [0, 1], [1, 1]],
    J: [[0, 0], [1, 0], [2, 0], [0, 1]], L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  };

  const emptyRow = () => Array(W).fill('.');
  // rows are written top-down (as you'd draw them); the board is stored bottom-up (index 0 = row 1).
  function board(rowsTopDown = []) {
    const b = Array.from({ length: H }, emptyRow);
    const n = rowsTopDown.length;
    rowsTopDown.forEach((s, i) => { b[n - 1 - i] = s.split(''); });
    return b;
  }
  const clone = (b) => b.map((r) => r.slice());
  const settle = (b) => b.map((r) => r.map((c) => (c === '.' || c === 'X' ? c : '#')));
  const cellsOf = (shape, x, y) => SHAPES[shape].map(([dx, dy]) => [x + dx, y + dy]);
  function fits(b, shape, x, y) {
    return cellsOf(shape, x, y).every(([cx, cy]) => cx >= 0 && cx < W && cy >= 0 && (cy >= H || b[cy][cx] === '.'));
  }
  function dropY(b, shape, x) {
    let y = VIS;
    if (!fits(b, shape, x, y)) return null;
    while (fits(b, shape, x, y - 1)) y--;
    return y;
  }
  const fullRows = (b) => b.map((r, y) => (r.every((c) => c !== '.') ? y : -1)).filter((y) => y >= 0);
  function clearRows(b, rows) {
    const keep = b.filter((_, y) => !rows.includes(y));
    while (keep.length < H) keep.push(emptyRow());
    return keep;
  }
  function garbageRow(hole) { const r = Array(W).fill('X'); r[hole] = '.'; return r; }
  function insertGarbage(b, n, hole) {
    const rows = Array.from({ length: n }, () => garbageRow(hole));
    return rows.concat(b.slice(0, H - n));
  }
  const overflow = (b) => b.slice(VIS).some((r) => r.some((c) => c !== '.'));
  const height = (b) => { for (let y = H - 1; y >= 0; y--) if (b[y].some((c) => c !== '.')) return y + 1; return 0; };

  const BASE = [0, 0, 1, 2, 4];
  const COMBO = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
  const LABEL = ['', 'Single', 'Double', 'Triple', 'Tetris'];

  // One piece lock, start to finish. Returns new player states plus the events the animator plays.
  function resolveLock(player, me0, opp0, move) {
    const me = { ...me0, b: clone(me0.b) }, opp = { ...opp0 };
    const events = [];
    const y = dropY(me.b, move.shape, move.x);
    if (y === null) return { me, opp, events: [{ type: 'topout', cause: 'spawn' }] };
    events.push({ type: 'drop', shape: move.shape, letter: move.letter, x: move.x, y });
    cellsOf(move.shape, move.x, y).forEach(([cx, cy]) => { me.b[cy][cx] = move.letter; });
    me.idx += 1;
    const rows = fullRows(me.b);
    if (rows.length) {
      const lines = rows.length;
      events.push({ type: 'clear', rows, lines });
      me.b = clearRows(me.b, rows);
      const difficult = lines === 4;
      const b2bBonus = difficult && me.b2b ? 1 : 0;
      me.b2b = difficult;
      me.combo += 1;
      const comboBonus = COMBO[Math.min(me.combo, 10)];
      const attack = BASE[lines] + b2bBonus + comboBonus;
      const cancel = Math.min(attack, me.meter);
      me.meter -= cancel;
      const sent = attack - cancel;
      opp.meter += sent;
      events.push({ type: 'attack', lines, base: BASE[lines], b2bBonus, comboBonus, attack, cancel, sent,
        label: (b2bBonus ? 'B2B ' : '') + LABEL[lines] });
    } else {
      me.combo = -1;
      if (me.meter > 0) {
        const hole = HOLES[player][me.draws];
        const n = me.meter;
        me.draws += 1;
        me.b = insertGarbage(me.b, n, hole);
        me.meter = 0;
        events.push({ type: 'rise', n, hole });
        if (overflow(me.b)) events.push({ type: 'topout', cause: 'garbage' });
      }
    }
    return { me, opp, events };
  }

  const player = (rows, idx, meter = 0, extra = {}) => ({ b: board(rows), idx, meter, b2b: false, combo: -1, draws: 0, ...extra });

  /* ---- The match. Each moment's `set` overrides the carried-over state (silent stacking between moments). ---- */
  const MOMENTS = [
    { t: '0:00', clock: 0, title: 'Same seed, same pieces', type: 'start',
      set: { you: { rows: [], idx: 0 }, rival: { rows: [], idx: 0 } },
      before: 'The Match DO picks one seed and sends it to both browsers. Each browser runs the same shuffle, so both players get the same pieces in the same order.',
      after: 'Both queues show the same pieces. From here each player moves through the sequence at their own speed. There are no turns.',
      quiz: { q: 'Who picks the seed?', options: ["YOU's browser", 'The Match DO', 'Each browser, separately'], answer: 1,
        explain: 'One authority picks it, so the two sequences cannot drift apart. Each browser then generates the pieces locally from that one number.' } },
    { t: '0:30', clock: 30, title: 'RIVAL clears a Double', type: 'action', actor: 'rival',
      move: { shape: 'O', letter: 'O', x: 4 },
      set: {
        you: { rows: ['######....', '######....', '#########.', '#########.', '#########.', '#########.'], idx: 12 },
        rival: { rows: ['####......', '####..####', '####..####'], idx: 5 },
      },
      before: 'Thirty seconds in. YOU stacks flat and keeps column 10 empty for a Tetris. RIVAL plays safe and clears lines as they go. RIVAL is on piece 6 and YOU on piece 13: same sequence, different pace.',
      after: "The row lands in YOU's meter, the hazard bar beside the board. It waits there until YOU locks a piece without clearing a line.",
      quiz: { q: "RIVAL's O completes two lines. How many garbage rows does a Double send?", options: ['0', '1', '2'], answer: 1,
        explain: "A Double sends 1. A Single sends nothing, which is why playing safe doesn't hurt your opponent much." } },
    { t: '0:33', clock: 33, title: 'Garbage lands on YOU', type: 'action', actor: 'you',
      move: { shape: 'O', letter: 'O', x: 6 }, yourMove: { prompt: 'Your move: place the O in columns 7–8, next to your stack. Keep column 10 open. That is your well.',
        hints: { 8: 'That fills your well. Try columns 7–8.', default: 'Try columns 7–8, right next to your stack.' } },
      set: { rival: { rows: ['####......', '########..'], idx: 8 } },
      before: 'YOU has one row waiting in the meter.',
      after: "No line was cleared, so the waiting row rose from the bottom and pushed YOU's stack up by one. Its hole is in column 3, buried under YOU's blocks. YOU can't clear it without digging." },
    { t: '0:36', clock: 36, title: 'YOU fires a Tetris', type: 'action', actor: 'you',
      move: { shape: 'IV', letter: 'I', x: 9 }, yourMove: { prompt: 'Your move: drop the I into the well in column 10.',
        hints: { default: 'The well is column 10, the empty column on the right.' } },
      set: { rival: { rows: ['####......', '#######...', '#########.'], idx: 10 } },
      before: 'Four rows are full except column 10.',
      after: "Four rows cleared: a Tetris sends 4. YOU's meter was empty, so nothing was cancelled. All 4 went through the Match DO into RIVAL's meter." },
    { t: '0:41', clock: 41, title: 'RIVAL cancels half', type: 'action', actor: 'rival',
      move: { shape: 'IV', letter: 'I', x: 9 },
      set: {
        you: { rows: ['##........', '##........', '########..', '########..', 'XX.XXXXXXX'], idx: 15 },
        rival: { rows: ['#####.....', '#########.', '#########.', '#########.'], idx: 13 },
      },
      before: 'RIVAL has 4 rows waiting and an I in hand. The drop will clear a Triple, which is worth 2.',
      after: "RIVAL's meter drops from 4 to 2. A clear either blocks incoming rows or attacks. The same lines never do both.",
      quiz: { q: 'RIVAL clears a Triple (worth 2) with 4 rows incoming. How many rows reach YOU?', options: ['0', '2', '4'], answer: 0,
        explain: 'Your own clears cancel your meter first. The 2 cancel 2 of the 4 incoming, and nothing is left over to send.' } },
    { t: '0:43', clock: 43, title: 'The rest lands on RIVAL', type: 'action', actor: 'rival',
      move: { shape: 'O', letter: 'O', x: 5 },
      before: 'RIVAL places an O. It clears nothing, so the 2 remaining rows are about to land.',
      after: "Two rows rose under RIVAL's stack. One attack means one hole column: both holes are in column 8, and this time nothing covers them." },
    { t: '0:45', clock: 45, title: 'RIVAL digs and hits back', type: 'action', actor: 'rival',
      move: { shape: 'IV', letter: 'I', x: 7 },
      before: 'RIVAL drops an I straight down column 8, through both garbage holes.',
      after: "RIVAL's Double sends 1 row. It is waiting in YOU's meter.",
      quiz: { q: 'Clearing garbage rows counts as clearing lines. What does this Double do?', options: ["Nothing, it's cleanup", 'Sends 1 row to YOU', "Refills RIVAL's meter"], answer: 1,
        explain: "Digging is also attack. If YOU's Tetris had arrived as 4 rows with one open hole, RIVAL could have sent a Tetris straight back. That's why games move the hole between attacks." } },
    { t: '0:52', clock: 52, title: 'RIVAL leaves the tab', type: 'pause',
      before: 'RIVAL switches to another tab. Your rule kicks in: both games freeze and YOU gets a popover. Decide what YOU does. You can also act as RIVAL on the right-hand screen.',
      after: 'RIVAL came back and both boards resumed after a 3-second countdown. Both games were frozen the whole time, so nobody lost time.' },
    { t: '1:50', clock: 110, title: 'Ninety seconds later', type: 'skip',
      set: {
        you: { rows: ['##........', '####......', '#########.', '#########.', '#########.', '#########.', 'XX.XXXXXXX', 'XXXXX.XXXX'], idx: 57, meter: 0, b2b: true, draws: 2 },
        rival: { rows: ['...##.....', '..###..#..', '.####.##..', '###.####..', '##.######.', '########.#',
          'XXXX.XXXXX', 'XXXX.XXXXX', 'XXXX.XXXXX', 'XXXX.XXXXX', 'XXXX.XXXXX',
          'XXXXXXXX.X', 'XXXXXXXX.X', 'XXXXXXXX.X', 'XXXXXXXX.X', 'XXXXXXXX.X'], idx: 44, meter: 0, draws: 3 },
      },
      before: "Time skip. YOU landed two more Tetrises, both back-to-back, 5 rows each. RIVAL couldn't cancel them. Ten garbage rows now sit under RIVAL's stack, which reaches row 16 of 20. YOU's well is ready again.",
      after: "Time skip. YOU landed two more Tetrises, both back-to-back, 5 rows each. RIVAL couldn't cancel them. Ten garbage rows now sit under RIVAL's stack, which reaches row 16 of 20. YOU's well is ready again." },
    { t: '1:51', clock: 111, title: 'Back-to-back Tetris', type: 'action', actor: 'you',
      move: { shape: 'IV', letter: 'I', x: 9 }, yourMove: { prompt: 'Your move: drop the I into column 10 for the back-to-back Tetris.',
        hints: { default: 'Column 10 is the well again.' } },
      before: 'YOU has an I and a four-row well.',
      after: "5 rows fly to RIVAL, whose stack already reaches row 16.",
      quiz: { q: "YOU's last clear was a Tetris. How many rows does another Tetris send now?", options: ['4', '5', '8'], answer: 1,
        explain: 'Back-to-back: a Tetris or T-spin right after another one earns +1. Any Single, Double or Triple in between breaks the chain.' } },
    { t: '1:53', clock: 113, title: 'Top out', type: 'action', actor: 'rival',
      move: { shape: 'T', letter: 'T', x: 3 },
      before: 'RIVAL locks their next piece without clearing a line. Five rows are waiting.',
      after: "The garbage pushed RIVAL's stack past the top of the board. RIVAL tops out and YOU win." },
  ];

  function applySet(st, set) {
    if (!set) return st;
    const next = { ...st, b: board(set.rows) };
    for (const k of ['idx', 'meter', 'b2b', 'draws']) if (k in set) next[k] = set[k];
    next.combo = -1;
    return next;
  }
  // Pre-compute every moment's "before" and "after" state by replaying the match from the start.
  function timeline() {
    let you = player([], 0), rival = player([], 0);
    return MOMENTS.map((m) => {
      you = { ...you, b: settle(you.b) }; rival = { ...rival, b: settle(rival.b) };
      if (m.set) { you = applySet(you, m.set.you); rival = applySet(rival, m.set.rival); }
      const pre = { you, rival };
      let events = [];
      if (m.type === 'action') {
        const me = m.actor, opp = me === 'you' ? 'rival' : 'you';
        const r = resolveLock(me, pre[me], pre[opp], m.move);
        events = r.events;
        if (me === 'you') { you = r.me; rival = r.opp; } else { rival = r.me; you = r.opp; }
      }
      return { pre, post: { you, rival }, events };
    });
  }

  return { W, VIS, H, SEED, SEQ, HOLES, SHAPES, PIECES, BASE, COMBO, MOMENTS,
    board, clone, settle, cellsOf, dropY, fits, fullRows, overflow, height, timeline, resolveLock };
})();
if (typeof module !== 'undefined') module.exports = GD;
