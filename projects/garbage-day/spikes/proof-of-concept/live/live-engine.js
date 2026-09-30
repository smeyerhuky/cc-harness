/* ---- Live engine: real-time, tick-based (60 Hz), deterministic. One Match = two client engines + a simulated Match DO + a latency-modelled network. ---- */
const LV = (() => {
  'use strict';
  const W = 10, VIS = 20, H = 24, TPS = 60;
  const PIECES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
  const POWERS = ['shield', 'bomb', 'fog', 'rush'];
  const GEM = { shield: '1', bomb: '2', fog: '3', rush: '4' };
  const GEM_POWER = { 1: 'shield', 2: 'bomb', 3: 'fog', 4: 'rush' };
  const SALT = [0x9E3779B9, 0x85EBCA6B];
  const GEM_SALT = 0xC2B2AE35, NET_SALT = 0x27D4EB2F, BOT_SALT = 0x165667B1;
  const DEFAULTS = {
    lockDelay: 30, maxResets: 15, garbageDelay: 30, garbageCap: 8, spawnDelay: 4, clearDelay: 12,
    rampSec: 15, maxLevel: 15, softFactor: 20,
    pauseBudget: 2, pauseSec: 120, extendSec: 60, graceSec: 15, reconnects: 3, heartbeatSec: 5, abandonSec: 300,
    leaveResult: 'nocontest',
    showdowns: [{ at: 60, kind: 'double', dur: 15 }, { at: 150, kind: 'sudden', dur: 0 }],
    gemChance: 0.16, powerSec: 6, shieldSec: 5, rushLevels: 4, bombRows: 3,
  };

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* SRS pieces. Cells are [col, row] inside the piece's box, rows counted top-down; index k is the same mino in every rotation. */
  const BOX = { I: ['....', 'IIII', '....', '....'], O: ['OO', 'OO'], T: ['.T.', 'TTT', '...'], S: ['.SS', 'SS.', '...'],
    Z: ['ZZ.', '.ZZ', '...'], J: ['J..', 'JJJ', '...'], L: ['..L', 'LLL', '...'] };
  const CELLS = {};
  for (const t of PIECES) {
    const n = BOX[t].length, base = [];
    BOX[t].forEach((row, r) => [...row].forEach((ch, c) => { if (ch !== '.') base.push([c, r]); }));
    CELLS[t] = [base];
    for (let s = 1; s < 4; s++) CELLS[t].push(CELLS[t][s - 1].map(([c, r]) => [n - 1 - r, c]));
  }
  const KJ = { '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]] };
  const KI = { '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]] };

  const emptyRow = () => Array(W).fill('.');
  const emptyBoard = () => Array.from({ length: H }, emptyRow);
  const snapshot = (b) => b.map((r) => r.join('')).join('');
  const parse = (s) => Array.from({ length: H }, (_, y) => s.slice(y * W, y * W + W).split(''));
  // Piece position (x, y) is the box's top-left; y grows upward, row 0 is the floor.
  function fits(b, t, r, x, y) {
    for (const [c, rr] of CELLS[t][r]) {
      const cx = x + c, cy = y - rr;
      if (cx < 0 || cx >= W || cy < 0) return false;
      if (cy < H && b[cy][cx] !== '.') return false;
    }
    return true;
  }
  const cellsAt = (t, r, x, y) => CELLS[t][r].map(([c, rr]) => [x + c, y - rr]);
  const spawnPos = (t) => (t === 'O' ? { x: 4, y: 19 } : t === 'I' ? { x: 3, y: 20 } : { x: 3, y: 19 });
  const fullRows = (b) => { const o = []; for (let y = 0; y < H; y++) if (b[y].every((c) => c !== '.')) o.push(y); return o; };
  function clearRows(b, rows) { const keep = b.filter((_, y) => !rows.includes(y)); while (keep.length < H) keep.push(emptyRow()); return keep; }
  const framesPerRow = (l) => TPS * Math.pow(Math.max(0.05, 0.8 - (l - 1) * 0.007), l - 1);
  const BASE = [0, 0, 1, 2, 4], TSPIN = [0, 2, 4, 6], COMBO = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
  const LINE_NAME = ['', 'Single', 'Double', 'Triple', 'Tetris'];
  const NONE = Object.freeze({});

  function tryRotate(b, p, dir) {
    if (p.t === 'O') return false;
    const to = (p.r + dir + 4) % 4, table = p.t === 'I' ? KI : KJ;
    for (const [dx, dy] of table[p.r + '>' + to]) {
      if (fits(b, p.t, to, p.x + dx, p.y + dy)) { p.r = to; p.x += dx; p.y += dy; return true; }
    }
    return false;
  }

  /* ---------------- one player's client engine ---------------- */
  class Player {
    constructor(idx, name, m) {
      this.idx = idx; this.name = name; this.m = m; this.R = m.rules;
      this.b = emptyBoard(); this.queue = []; this.hold = null; this.holdUsed = false; this.cur = null;
      this.g = 0; this.lockT = 0; this.resets = 0; this.lowY = 99; this.spawnWait = 0; this.clearing = null;
      this.meter = []; this.gotGarbage = 0; this.b2b = false; this.combo = -1; this.power = null;
      this.fx = { fogUntil: -1, rushUntil: -1, shieldUntil: -1 }; this.pendingFx = [];
      this.alive = true; this.frozen = true; this.resumeAt = -1; this.away = false; this.offline = false; this.closed = false;
      this.outbox = []; this.lastRot = false; this.bagPending = false; this.sd = null; this.result = null;
      this.holes = mulberry32((m.seed ^ SALT[idx]) >>> 0);
      this.lastPos = ''; this.rise = null;
      this.stats = { pieces: 0, lines: 0, sent: 0, received: 0, cancelled: 0, tetrises: 0, tspins: 0, pcs: 0, powersUsed: 0, powersGot: 0, maxCombo: 0, garbageRows: 0 };
      this.opp = { b: emptyBoard(), cur: null, meter: 0, stats: {}, power: null, hold: null };
      this.info = {};
      this.used = new Set();
    }
    meterTotal() { return this.meter.reduce((a, e) => a + e.rows, 0); }
    meterReady(t) { return this.meter.reduce((a, e) => a + (e.ready <= t ? e.rows : 0), 0); }
    level(t) {
      const D = this.m.do, sec = D.activeTicks / TPS;
      let l = Math.min(this.R.maxLevel, 1 + Math.floor(sec / this.R.rampSec));
      if (this.sd && this.sd.kind === 'sudden' && this.sd.phase === 'start') l = Math.min(this.R.maxLevel, l + 4);
      if (t < this.fx.rushUntil) l = Math.min(20, l + this.R.rushLevels);
      return l;
    }
    grounded() { const p = this.cur; return p && !fits(this.b, p.t, p.r, p.x, p.y - 1); }
    step(t, inp) {
      this.applyFx(t);
      if (this.clearing) {
        if (t < this.clearing.until) return;
        this.b = clearRows(this.b, this.clearing.rows); this.clearing = null;
      }
      if (!this.cur) {
        if (this.spawnWait > 0) { this.spawnWait--; return; }
        if (!this.spawn(t)) return;
      }
      if (inp.power && this.power) this.usePower(t);
      if (inp.hold && !this.holdUsed) { this.doHold(t); if (!this.cur || !this.alive) return; }
      const p = this.cur, b = this.b;
      if (inp.cw && tryRotate(b, p, 1)) this.moved(true);
      if (inp.ccw && tryRotate(b, p, -1)) this.moved(true);
      if (inp.dx && fits(b, p.t, p.r, p.x + inp.dx, p.y)) { p.x += inp.dx; this.moved(false); }
      if (inp.hard) {
        let d = 0; while (fits(b, p.t, p.r, p.x, p.y - 1)) { p.y--; d++; }
        if (d) this.lastRot = false;
        this.lock(t); return;
      }
      let g = 1 / framesPerRow(this.level(t));
      if (inp.soft) g = Math.max(g * this.R.softFactor, 0.5);
      this.g += g;
      while (this.g >= 1) {
        this.g -= 1;
        if (fits(b, p.t, p.r, p.x, p.y - 1)) { p.y--; this.lastRot = false; if (p.y < this.lowY) { this.lowY = p.y; this.resets = 0; } }
        else { this.g = 0; break; }
      }
      if (this.grounded()) { this.lockT++; if (this.lockT >= this.R.lockDelay) this.lock(t); } else this.lockT = 0;
    }
    moved(rot) {
      this.lastRot = rot;
      if (this.lockT > 0 && this.resets < this.R.maxResets) { this.lockT = 0; this.resets++; }
    }
    spawn(t) {
      if (!this.queue.length) return false;
      const nx = this.queue.shift();
      if (this.queue.length <= 7 && !this.bagPending) { this.bagPending = true; this.m.clientSend(this.idx, { type: 'bagReq' }); }
      return this.place(nx, t);
    }
    place(piece, t) {
      const sp = spawnPos(piece.t);
      const p = { t: piece.t, r: 0, x: sp.x, y: sp.y, gem: piece.gem || null };
      this.cur = p; this.g = 0; this.lockT = 0; this.resets = 0; this.lowY = p.y; this.lastRot = false;
      if (!fits(this.b, p.t, 0, p.x, p.y)) { this.topOut(t, 'block out'); return false; }
      return true;
    }
    doHold(t) {
      const cur = { t: this.cur.t, gem: this.cur.gem };
      this.holdUsed = true;
      if (this.hold) { const h = this.hold; this.hold = cur; this.place(h, t); }
      else { this.hold = cur; this.cur = null; this.spawn(t); }
      this.m.emit({ type: 'hold', p: this.idx });
    }
    usePower(t) {
      const kind = this.power; this.power = null;
      this.stats.powersUsed++; this.used.add(kind);
      this.m.clientSend(this.idx, { type: 'use', power: kind });
      this.m.emit({ type: 'powerUse', p: this.idx, kind });
    }
    applyFx(t) {
      if (!this.pendingFx.length) return;
      this.pendingFx = this.pendingFx.filter((f) => {
        if (f.at > t) return true;
        const mine = f.by === this.idx;
        if (f.kind === 'shield' && mine) { this.meter = []; this.fx.shieldUntil = f.at + this.R.shieldSec * TPS; }
        else if (f.kind === 'bomb' && mine) {
          const n = this.R.bombRows; this.b = this.b.slice(n).concat(Array.from({ length: n }, emptyRow));
        } else if (f.kind === 'fog' && !mine) this.fx.fogUntil = f.at + this.R.powerSec * TPS;
        else if (f.kind === 'rush' && !mine) this.fx.rushUntil = f.at + this.R.powerSec * TPS;
        this.m.emit({ type: 'powerApply', p: this.idx, kind: f.kind, by: f.by });
        return false;
      });
    }
    lock(t) {
      const p = this.cur, b = this.b;
      const cells = cellsAt(p.t, p.r, p.x, p.y);
      let tspin = false;
      if (p.t === 'T' && this.lastRot) {
        let n = 0;
        for (const [dx, dy] of [[0, 0], [2, 0], [0, -2], [2, -2]]) {
          const cx = p.x + dx, cy = p.y + dy;
          if (cx < 0 || cx >= W || cy < 0 || (cy < H && b[cy][cx] !== '.')) n++;
        }
        tspin = n >= 3;
      }
      cells.forEach(([x, y], k) => { if (y < H) b[y][x] = p.gem && p.gem.i === k ? GEM[p.gem.type] : p.t; });
      this.cur = null; this.holdUsed = false; this.stats.pieces++; this.spawnWait = this.R.spawnDelay;
      if (cells.every(([, y]) => y >= VIS)) { this.topOut(t, 'lock out'); return; }
      const rows = fullRows(b);
      const ev = { type: 'lock', p: this.idx, piece: p.t, cells, lines: rows.length, rows, tspin };
      if (rows.length) {
        const lines = rows.length;
        const gems = [];
        rows.forEach((y) => b[y].forEach((ch) => { if (GEM_POWER[ch]) gems.push(GEM_POWER[ch]); }));
        this.clearing = { rows, until: t + this.R.clearDelay };
        const difficult = lines === 4 || tspin;
        let atk = tspin ? TSPIN[lines] : BASE[lines];
        const b2b = difficult && this.b2b ? 1 : 0; atk += b2b;
        this.b2b = difficult; this.combo++;
        const comboBonus = COMBO[Math.min(this.combo, 10)]; atk += comboBonus;
        const after = clearRows(b, rows);
        const pc = after.every((r) => r.every((c) => c === '.'));
        if (pc) { atk = Math.max(atk, 10); this.stats.pcs++; }
        let left = atk, cancel = 0;
        while (left > 0 && this.meter.length) {
          const e = this.meter[0], k = Math.min(left, e.rows);
          e.rows -= k; left -= k; cancel += k; if (!e.rows) this.meter.shift();
        }
        const S = this.stats; S.lines += lines; S.sent += left; S.cancelled += cancel;
        if (lines === 4) S.tetrises++; if (tspin) S.tspins++; S.maxCombo = Math.max(S.maxCombo, this.combo);
        Object.assign(ev, { attack: atk, cancel, sent: left, b2b, combo: this.combo, pc,
          label: pc ? 'Perfect clear' : (b2b ? 'B2B ' : '') + (tspin ? 'T-spin ' + (LINE_NAME[lines] || '') : LINE_NAME[lines]) + (this.combo > 0 ? ' · combo ×' + (this.combo + 1) : '') });
        if (left > 0) this.m.clientSend(this.idx, { type: 'attack', rows: left, label: ev.label });
        if (gems.length && !this.power) { this.power = gems[0]; S.powersGot++; ev.power = gems[0]; }
      } else {
        this.combo = -1;
        let landed = 0, overflow = false;
        const cap = this.R.garbageCap;
        while (this.meter.length && this.meter[0].ready <= t && landed < cap) {
          const e = this.meter[0], k = Math.min(e.rows, cap - landed);
          if (e.hole === undefined) e.hole = Math.floor(this.holes() * W);
          const top = this.b.slice(H - k);
          if (top.some((r) => r.some((c) => c !== '.'))) overflow = true;
          const g = Array.from({ length: k }, () => { const r = Array(W).fill('X'); r[e.hole] = '.'; return r; });
          this.b = g.concat(this.b.slice(0, H - k));
          landed += k; e.rows -= k; if (!e.rows) this.meter.shift();
        }
        if (landed) { ev.rise = landed; this.stats.garbageRows += landed; this.rise = { n: landed, t }; }
        if (overflow) { this.m.emit(ev); this.sendLock(ev); this.topOut(t, 'buried'); return; }
      }
      this.sendLock(ev);
      this.m.emit(ev);
    }
    sendLock(ev) {
      this.m.clientSend(this.idx, { type: 'lock', board: snapshot(this.clearing ? clearRows(this.b, this.clearing.rows) : this.b),
        lines: ev.lines, attack: ev.attack || 0, label: ev.label, meter: this.meterTotal(), gack: this.gotGarbage,
        hold: this.hold && this.hold.t, power: this.power, stats: { ...this.stats } });
    }
    topOut(t, why) {
      if (!this.alive) return;
      this.alive = false; this.m.clientSend(this.idx, { type: 'topout', why });
      this.m.emit({ type: 'topout', p: this.idx, why });
    }
    posMessage() {
      const c = this.cur, key = c ? `${c.t}${c.r}${c.x},${c.y}|${this.meterTotal()}` : '-|' + this.meterTotal();
      if (key === this.lastPos) return null;
      this.lastPos = key;
      return { type: 'pos', cur: c ? { t: c.t, r: c.r, x: c.x, y: c.y } : null, meter: this.meterTotal(), gack: this.gotGarbage, power: this.power, hold: this.hold && this.hold.t };
    }
    onMessage(msg, t) {
      this.info[msg.type] = msg;
      switch (msg.type) {
        case 'start': this.resumeAt = msg.goAt; break;
        case 'bag': this.queue.push(...msg.pieces); this.bagPending = false; break;
        case 'garbage':
          if (msg.id <= this.gotGarbage) break;
          this.gotGarbage = msg.id; this.meter.push({ rows: msg.rows, ready: t + this.R.garbageDelay, id: msg.id });
          this.stats.received += msg.rows; this.m.emit({ type: 'incoming', p: this.idx, rows: msg.rows });
          break;
        case 'power': this.pendingFx.push(msg); break;
        case 'opp':
          if (msg.kind === 'pos') { this.opp.cur = msg.cur; this.opp.meter = msg.meter; this.opp.power = msg.power; this.opp.hold = msg.hold; }
          else { this.opp.b = parse(msg.board); this.opp.cur = null; this.opp.meter = msg.meter; this.opp.stats = msg.stats; this.opp.power = msg.power; this.opp.hold = msg.hold; this.opp.lastLock = { lines: msg.lines, label: msg.label, t }; }
          break;
        case 'paused': this.frozen = true; this.resumeAt = -1; break;
        case 'resume': this.resumeAt = msg.at; break;
        case 'showdown': this.sd = msg; break;
        case 'result': this.result = msg; this.frozen = true; break;
        default: break;
      }
    }
  }

  /* ---------------- bot controller ---------------- */
  const BOTS = {
    rookie: { think: 26, jitter: 14, move: 9, noise: 1.4, style: 'safe' },
    regular: { think: 14, jitter: 8, move: 5, noise: 0.45, style: 'mixed' },
    pro: { think: 7, jitter: 5, move: 3, noise: 0.12, style: 'tetris' },
    kestrel: { think: 8, jitter: 5, move: 3, noise: 0.18, style: 'tetris' },
    heron: { think: 9, jitter: 6, move: 4, noise: 0.2, style: 'mixed' },
  };
  class Bot {
    constructor(m, idx, cfg) {
      this.m = m; this.i = idx; this.P = m.players[idx]; this.cfg = cfg;
      this.rng = mulberry32((m.seed ^ BOT_SALT ^ Math.imul(idx + 1, 7919)) >>> 0);
      this.plan = null; this.key = ''; this.wait = 0; this.fails = 0; this.powerWait = 40;
    }
    tick(t) {
      const P = this.P;
      if (!P.cur) return NONE;
      const inp = {};
      if (P.power) {
        if (this.powerWait > 0) this.powerWait--;
        else if (this.wantPower(P, t)) { inp.power = true; this.powerWait = 40; }
      }
      const key = P.stats.pieces + ':' + P.holdUsed;
      if (key !== this.key) {
        if (!(this.plan && this.plan.afterHold && P.holdUsed)) { this.plan = null; this.wait = this.cfg.think + Math.floor(this.rng() * this.cfg.jitter); }
        this.key = key; this.fails = 0;
      }
      if (this.wait > 0) { this.wait--; return inp; }
      if (!this.plan) this.plan = this.decide();
      this.wait = this.cfg.move * (t < P.fx.fogUntil ? 2 : 1);
      const p = P.cur, pl = this.plan;
      if (pl.hold && !P.holdUsed) { inp.hold = true; pl.hold = false; pl.afterHold = true; return inp; }
      if (p.r !== pl.r && this.fails < 3) {
        const d = (pl.r - p.r + 4) % 4, before = p.r;
        if (d === 3) inp.ccw = true; else inp.cw = true;
        if (!fits(P.b, p.t, (before + (d === 3 ? 3 : 1)) % 4, p.x, p.y)) this.fails++;
        return inp;
      }
      if (p.x !== pl.x && this.fails < 3) {
        const dx = Math.sign(pl.x - p.x);
        if (!fits(P.b, p.t, p.r, p.x + dx, p.y)) { this.fails++; if (this.fails >= 3) inp.hard = true; return inp; }
        inp.dx = dx; return inp;
      }
      inp.hard = true;
      return inp;
    }
    wantPower(P, t) {
      const k = P.power;
      if (k === 'shield') return P.meterTotal() >= 3;
      if (k === 'bomb') { const h = height(P.b); return h >= 11 || holes(P.b) >= 6; }
      return true;
    }
    decide() {
      const P = this.P, cur = P.cur.t;
      const alt = P.hold ? P.hold.t : (P.queue[0] ? P.queue[0].t : null);
      let best = this.best(P.b, cur), hold = false;
      if (alt && alt !== cur && !P.holdUsed) {
        const b2 = this.best(P.b, alt);
        if (b2 && (!best || b2.score > best.score + 0.35)) { best = b2; hold = true; }
      }
      if (!best) return { hold: false, r: P.cur.r, x: P.cur.x };
      return { hold, r: best.r, x: best.x };
    }
    best(b, t) {
      const sp = spawnPos(t);
      let best = null;
      const rots = t === 'O' ? [0] : [0, 1, 2, 3];
      for (const r of rots) {
        if (!fits(b, t, r, sp.x, sp.y)) continue;
        for (let x = -2; x < W; x++) {
          if (!fits(b, t, r, x, sp.y)) continue;
          let ok = true;
          const s = Math.sign(x - sp.x);
          for (let xx = sp.x; xx !== x; xx += s) if (!fits(b, t, r, xx + s, sp.y)) { ok = false; break; }
          if (!ok) continue;
          let y = sp.y; while (fits(b, t, r, x, y - 1)) y--;
          const score = this.score(b, t, r, x, y);
          if (!best || score > best.score) best = { r, x, score };
        }
      }
      return best;
    }
    score(b0, t, r, x, y) {
      const b = b0.map((row) => row.slice());
      for (const [cx, cy] of cellsAt(t, r, x, y)) if (cy < H) b[cy][cx] = t;
      const rows = fullRows(b), lines = rows.length;
      const nb = lines ? clearRows(b, rows) : b;
      const hs = Array(W).fill(0);
      let hole = 0;
      for (let c = 0; c < W; c++) {
        let top = -1;
        for (let yy = H - 1; yy >= 0; yy--) if (nb[yy][c] !== '.') { top = yy; break; }
        hs[c] = top + 1;
        for (let yy = top - 1; yy >= 0; yy--) if (nb[yy][c] === '.') hole++;
      }
      let agg = 0, bump = 0, maxH = 0;
      for (let c = 0; c < W; c++) { agg += hs[c]; maxH = Math.max(maxH, hs[c]); if (c < W - 1) bump += Math.abs(hs[c] - hs[c + 1]); }
      const danger = this.P.meterTotal() >= 4 || maxH > 12;
      let s = -0.51 * agg - 0.36 * hole * 1.4 - 0.18 * bump;
      const style = this.cfg.style;
      if (style === 'safe' || danger) s += 0.76 * lines * 1.6;
      else if (style === 'tetris') {
        s += lines === 4 ? 14 : -1.8 * lines;
        s -= 1.1 * hs[W - 1];
        s += 0.18 * Math.abs(hs[W - 2] - hs[W - 1]);
      } else {
        s += lines >= 3 ? 3 * lines : 0.5 * lines;
        s -= 0.2 * hs[W - 1];
      }
      if (maxH > 14) s -= (maxH - 14) * 3;
      return s + (this.rng() - 0.5) * this.cfg.noise;
    }
  }
  function height(b) { for (let y = H - 1; y >= 0; y--) if (b[y].some((c) => c !== '.')) return y + 1; return 0; }
  function holes(b) {
    let n = 0;
    for (let c = 0; c < W; c++) { let seen = false; for (let y = H - 1; y >= 0; y--) { if (b[y][c] !== '.') seen = true; else if (seen) n++; } }
    return n;
  }

  /* ---------------- human controller (keys → per-tick input, with DAS/ARR) ---------------- */
  class Human {
    constructor() { this.held = {}; this.pressed = new Set(); this.das = 10; this.arr = 2; this.dir = 0; this.dasT = 0; this.first = false; }
    down(k) {
      if (this.held[k]) return;
      this.held[k] = true; this.pressed.add(k);
      if (k === 'left' || k === 'right') { this.dir = k === 'left' ? -1 : 1; this.dasT = 0; this.first = true; }
    }
    up(k) {
      this.held[k] = false;
      if ((k === 'left' && this.dir === -1) || (k === 'right' && this.dir === 1)) {
        this.dir = this.held.left ? -1 : this.held.right ? 1 : 0; this.dasT = 0; this.first = this.dir !== 0;
      }
    }
    reset() { this.held = {}; this.pressed.clear(); this.dir = 0; }
    tick() {
      const p = this.pressed;
      const inp = { cw: p.has('cw'), ccw: p.has('ccw'), hold: p.has('hold'), hard: p.has('hard'), power: p.has('power'), soft: !!this.held.soft, dx: 0 };
      if (this.dir) {
        if (this.first) { inp.dx = this.dir; this.first = false; this.dasT = 0; }
        else { this.dasT++; if (this.dasT >= this.das && (this.dasT - this.das) % this.arr === 0) inp.dx = this.dir; }
      }
      p.clear();
      return inp;
    }
  }

  /* ---------------- the Match Durable Object (simulated) ---------------- */
  class MatchDO {
    constructor(m) {
      this.m = m; this.R = m.rules;
      this.state = 'waiting'; this.prevState = null;
      this.seqRng = mulberry32(m.seed); this.gemRng = mulberry32((m.seed ^ GEM_SALT) >>> 0);
      this.bags = []; this.gems = [];
      this.p = [0, 1].map(() => ({ presence: 'present', reason: null, pausesLeft: m.rules.pauseBudget, reconnects: m.rules.reconnects,
        lastHb: 0, awayAt: -1, graceUntil: -1, bagIdx: 0, gOut: [], gAck: 0, shieldUntil: -1, snapshot: null }));
      this.gid = 0; this.activeTicks = 0; this.goAt = -1; this.resumeAt = -1;
      this.pause = null; this.abandonAt = -1; this.sdIdx = 0; this.showdown = null; this.result = null;
      this.counts = { in: 0, pos: 0, hb: 0, lock: 0, relayed: 0 };
    }
    bag(k) {
      while (this.bags.length <= k) {
        const bag = PIECES.slice();
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(this.seqRng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
        const base = this.bags.length * 7;
        this.bags.push(bag.map((t, j) => ({ t, gem: this.gem(base + j) })));
      }
      return this.bags[k];
    }
    gem(n) {
      while (this.gems.length <= n) {
        const a = this.gemRng(), b = this.gemRng(), c = this.gemRng();
        this.gems.push(a < this.R.gemChance ? { i: Math.floor(b * 4), type: POWERS[Math.floor(c * 4)] } : null);
      }
      return this.gems[n];
    }
    setState(s, why) { if (this.state === s) return; this.prevState = this.state; this.state = s; this.m.emit({ type: 'doState', from: this.prevState, to: s, why }); }
    deal(i) {
      const P = this.p[i], pieces = this.bag(P.bagIdx++).map((x) => ({ ...x }));
      this.m.doSend(i, { type: 'bag', pieces });
      this.m.log('DO', i, `bag{#${P.bagIdx}, 7 pieces${pieces.some((x) => x.gem) ? ', gems' : ''}}`, 'bag');
    }
    start(t) {
      this.setState('countdown', 'both joined');
      this.goAt = t + 180;
      for (const i of [0, 1]) { this.p[i].lastHb = t; this.deal(i); this.deal(i); this.m.doSend(i, { type: 'start', goAt: this.goAt }); }
      this.m.log('DO', 'both', 'start{in:"3s"} · seed stays on the server');
    }
    broadcast(msg) { this.m.doSend(0, msg); this.m.doSend(1, msg); }
    onMessage(i, msg, t) {
      const P = this.p[i], o = 1 - i, name = this.m.names[i];
      this.counts.in++;
      if (msg.gack) { P.gAck = Math.max(P.gAck, msg.gack); P.gOut = P.gOut.filter((e) => e.id > P.gAck); }
      switch (msg.type) {
        case 'hb': this.counts.hb++; P.lastHb = t; return;
        case 'pos': this.counts.pos++; P.lastHb = t; if (this.state !== 'over') { this.m.doSend(o, { type: 'opp', kind: 'pos', cur: msg.cur, meter: msg.meter, power: msg.power, hold: msg.hold }); this.counts.relayed++; } return;
        case 'bagReq': this.deal(i); return;
        case 'lock':
          this.counts.lock++; P.lastHb = t; P.snapshot = msg;
          this.m.doSend(o, { type: 'opp', kind: 'lock', board: msg.board, meter: msg.meter, stats: msg.stats, lines: msg.lines, label: msg.label, power: msg.power, hold: msg.hold });
          this.counts.relayed++;
          if (msg.lines) this.m.log(i, 'DO', `lock{cleared:${msg.lines}, attack:${msg.attack}${msg.label ? ', "' + msg.label + '"' : ''}}`, 'lock');
          return;
        case 'attack': {
          if (this.state === 'over') return;
          const mult = this.showdown ? 2 : 1, rows = msg.rows * mult;
          if (this.p[o].shieldUntil > t) { this.m.log('DO', null, `${this.m.names[o]}'s shield blocked ${rows} rows`, 'power'); this.m.emit({ type: 'blocked', p: o, rows }); return; }
          const id = ++this.gid;
          this.p[o].gOut.push({ id, rows });
          this.m.doSend(o, { type: 'garbage', rows, id });
          this.m.log('DO', o, `garbage{rows:${rows}${mult > 1 ? ' (×2 showdown)' : ''}, id:${id}}`, 'attack');
          this.m.emit({ type: 'route', from: i, to: o, rows });
          if (rows >= 4) this.m.key(`${name} sent ${rows} rows${msg.label ? ' (' + msg.label + ')' : ''}${mult > 1 ? ' · doubled' : ''}`);
          return;
        }
        case 'use': {
          const at = t + 12;
          if (msg.power === 'shield') P.shieldUntil = at + this.R.shieldSec * TPS;
          this.broadcast({ type: 'power', kind: msg.power, by: i, at });
          this.m.log(i, 'DO', `use{power:"${msg.power}"} → both apply at +0.2 s`, 'power');
          this.m.key(`${name} used ${msg.power.toUpperCase()}`);
          return;
        }
        case 'topout': this.end(o, `${name} topped out`, t); return;
        case 'away': this.onAway(i, msg.reason, t); return;
        case 'back': case 'rejoin': this.onBack(i, t, msg); return;
        case 'extend':
          if (this.pause && this.pause.by !== i) {
            this.pause.deadline += this.R.extendSec * TPS; this.pause.ext++;
            this.broadcast({ type: 'deadline', deadline: this.pause.deadline });
            this.m.log(i, 'DO', 'extend{by:60}', 'pause'); this.m.log('DO', null, `setAlarm(+${fmtT((this.pause.deadline - t) / TPS)})`, 'pause');
            this.m.key(`${name} extended the timer (+1:00)`);
          }
          return;
        case 'leave':
          if (this.state === 'paused' && this.pause && this.pause.by !== i) {
            this.m.log(i, 'DO', 'leave{}', 'pause');
            if (this.R.leaveResult === 'win') this.end(i, `${this.m.names[this.pause.by]} was away and ${name} left`, t);
            else this.end(null, `${name} left while ${this.m.names[this.pause.by]} was away: no contest`, t);
          } else if (this.state !== 'over') this.end(o, `${name} left the match`, t);
          return;
        default: return;
      }
    }
    onAway(i, reason, t) {
      const P = this.p[i], name = this.m.names[i];
      if (this.state === 'over' || this.state === 'waiting') return;
      if (P.presence !== 'present') return;
      P.presence = reason === 'tab' || reason === 'step' ? 'away' : 'gone'; P.reason = reason;
      P.awayAt = reason === 'lost' ? P.lastHb : t;
      const why = { tab: 'switched tabs', step: 'stepped away', closed: 'closed the tab', lost: 'lost the connection' }[reason];
      if (reason === 'closed') this.m.log(i, null, 'WebSocket closed → DO webSocketClose()', 'pause');
      else if (reason === 'lost') this.m.log('DO', null, `no heartbeat from ${name} for ${this.R.heartbeatSec} s`, 'pause');
      else this.m.log(i, 'DO', `away{reason:"${reason}"}`, 'pause');
      this.m.emit({ type: 'presence', p: i, to: P.presence });
      if (this.state === 'paused') {
        if (this.pause.by !== i && this.abandonAt < 0) {
          this.abandonAt = t + this.R.abandonSec * TPS;
          this.broadcast({ type: 'bothAway', endsAt: this.abandonAt });
          this.m.log('DO', null, `both players away · setAlarm(+${fmtT(this.R.abandonSec)}) to end the session`, 'pause');
          this.m.key(`${name} ${why} too · both away, session ends in ${fmtT(this.R.abandonSec)} unless someone returns`);
        }
        return;
      }
      const free = reason === 'lost' && P.reconnects > 0;
      if (free) { P.reconnects--; this.startPause(i, reason, t, false); this.m.key(`${name} ${why} · free reconnect (${P.reconnects} left), no pause used`); }
      else if (P.pausesLeft > 0) { P.pausesLeft--; this.startPause(i, reason, t, true); this.m.key(`${name} ${why} · paused (${P.pausesLeft} pause${P.pausesLeft === 1 ? '' : 's'} left)`); }
      else {
        P.presence = 'grace'; P.graceUntil = t + this.R.graceSec * TPS;
        this.broadcast({ type: 'grace', by: i, until: P.graceUntil });
        this.m.log('DO', 'both', `grace{by:"${name}", forfeitIn:"${this.R.graceSec}s"} · no pauses left, match keeps running`, 'pause');
        this.m.emit({ type: 'presence', p: i, to: 'grace' });
        this.m.key(`${name} ${why} with no pauses left · the match keeps running, ${this.R.graceSec} s to return`);
      }
    }
    startPause(i, reason, t, budgeted) {
      this.setState('paused', reason);
      this.pause = { by: i, reason, since: t, deadline: t + this.R.pauseSec * TPS, ext: 0, budgeted };
      this.broadcast({ type: 'paused', by: i, reason, deadline: this.pause.deadline, pausesLeft: this.p[i].pausesLeft, budgeted });
      this.m.log('DO', null, `setAlarm(+${fmtT(this.R.pauseSec)})`, 'pause');
      this.m.log('DO', 'both', `paused{by:"${this.m.names[i]}", reason:"${reason}"${budgeted ? '' : ', free'}} · boards hidden`, 'pause');
    }
    onBack(i, t, msg) {
      const P = this.p[i], name = this.m.names[i], o = 1 - i;
      if (P.presence === 'present' || this.state === 'over') return;
      const awayTicks = Math.max(t - P.awayAt, msg && msg.awayMs ? Math.round(msg.awayMs / 1000 * TPS) : 0);
      const wasGrace = P.presence === 'grace';
      P.presence = 'present'; P.lastHb = t;
      this.m.emit({ type: 'presence', p: i, to: 'present' });
      if (msg && msg.type === 'rejoin') {
        this.m.log(i, 'DO', 'rejoin{token}', 'pause');
        const resend = P.gOut.filter((e) => e.id > P.gAck);
        resend.forEach((e) => this.m.doSend(i, { type: 'garbage', rows: e.rows, id: e.id }));
        this.m.log('DO', i, `snapshot{boards, meter} + resent ${resend.length} unacknowledged garbage message${resend.length === 1 ? '' : 's'}`, 'pause');
      } else this.m.log(i, 'DO', 'back{}', 'pause');
      if (wasGrace) { this.broadcast({ type: 'back', by: i, away: awayTicks, pausesLeft: P.pausesLeft }); this.m.key(`${name} came back after ${fmtT(awayTicks / TPS)} (no pause)`); return; }
      if (this.state !== 'paused') return;
      if (this.abandonAt >= 0) {
        this.abandonAt = -1;
        this.m.log('DO', null, 'deleteAlarm() · abandon timer cancelled', 'pause');
        if (this.pause.by === i) { this.pause.by = o; this.pause.reason = this.p[o].reason; this.pause.deadline = t + this.R.pauseSec * TPS; }
        this.broadcast({ type: 'paused', by: this.pause.by, reason: this.pause.reason, deadline: this.pause.deadline, pausesLeft: this.p[this.pause.by].pausesLeft, budgeted: true });
        this.m.key(`${name} came back · still waiting for ${this.m.names[this.pause.by]}`);
        return;
      }
      if (this.pause.by !== i) return;
      this.setState('resuming', 'back');
      this.resumeAt = t + 180;
      this.broadcast({ type: 'resume', at: this.resumeAt, by: i, away: awayTicks, pausesLeft: P.pausesLeft, free: !this.pause.budgeted });
      this.m.log('DO', null, 'deleteAlarm()', 'pause');
      this.m.log('DO', 'both', `resume{in:"3s", away:"${fmtT(awayTicks / TPS)}", pausesLeft:${P.pausesLeft}}`, 'pause');
      this.m.key(`${name} came back after ${fmtT(awayTicks / TPS)} · resume in 3 s`);
      this.pause = null;
    }
    end(winner, reason, t) {
      if (this.state === 'over') return;
      this.setState('over', reason);
      this.result = { winner, reason, activeTicks: this.activeTicks, ticks: t };
      this.broadcast({ type: 'result', winner, reason });
      this.m.log('DO', 'both', `result{winner:${winner === null ? 'none' : '"' + this.m.names[winner] + '"'}, reason:"${reason}"}`, 'result');
      this.m.key(winner === null ? `Match over: ${reason}` : `${this.m.names[winner]} wins: ${reason}`);
      this.m.over = true;
    }
    tick(t) {
      const R = this.R;
      if (this.state === 'countdown' && t >= this.goAt) this.setState('playing', 'go');
      if (this.state === 'resuming' && t >= this.resumeAt) this.setState('playing', 'go');
      if (this.state === 'playing') {
        this.activeTicks++;
        const sec = this.activeTicks / TPS, sd = R.showdowns[this.sdIdx];
        if (sd && !sd.warned && sec >= sd.at - 5) {
          sd.warned = true;
          this.broadcast({ type: 'showdown', kind: sd.kind, phase: 'soon', startsAt: sd.at });
          this.m.log('DO', 'both', `showdown{kind:"${sd.kind}", in:"5s"}`, 'showdown');
        }
        if (sd && sec >= sd.at) {
          this.showdown = { kind: sd.kind, until: sd.dur ? this.activeTicks + sd.dur * TPS : Infinity };
          this.sdIdx++;
          this.broadcast({ type: 'showdown', kind: sd.kind, phase: 'start', until: this.showdown.until });
          this.m.log('DO', 'both', `showdown{kind:"${sd.kind}", start}${sd.kind === 'sudden' ? ' · speed +4, garbage ×2 until the end' : ' · garbage ×2 for ' + sd.dur + ' s'}`, 'showdown');
          this.m.key(sd.kind === 'sudden' ? 'SUDDEN DEATH: speed +4 and garbage ×2 until someone tops out' : `SHOWDOWN: double garbage for ${sd.dur} s`);
        }
        if (this.showdown && this.activeTicks >= this.showdown.until) {
          this.broadcast({ type: 'showdown', kind: this.showdown.kind, phase: 'end' });
          this.m.log('DO', 'both', 'showdown{end}', 'showdown');
          this.showdown = null;
        }
        for (const i of [0, 1]) {
          const P = this.p[i];
          if (P.presence === 'grace' && t >= P.graceUntil) { this.end(1 - i, `${this.m.names[i]} was away with no pauses left`, t); return; }
        }
      }
      if (this.state === 'playing' || this.state === 'paused' || this.state === 'resuming') {
        for (const i of [0, 1]) {
          const P = this.p[i];
          if (P.presence === 'present' && t - P.lastHb > R.heartbeatSec * TPS) this.onAway(i, 'lost', t);
        }
      }
      if (this.state === 'paused') {
        if (this.abandonAt >= 0 && t >= this.abandonAt) { this.end(null, 'both players left: session ended', t); return; }
        if (this.abandonAt < 0 && this.pause && t >= this.pause.deadline) {
          const by = this.pause.by;
          this.m.log('DO', null, `alarm() fired: ${this.m.names[by]} did not return`, 'pause');
          this.p[by].presence = 'forfeit'; this.m.emit({ type: 'presence', p: by, to: 'forfeit' });
          this.end(1 - by, `${this.m.names[by]} did not return in time`, t);
        }
      }
    }
  }
  const fmtT = (s) => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  /* ---------------- the match: clients + DO + network ---------------- */
  class Match {
    constructor(o) {
      this.seed = o.seed >>> 0; this.names = o.names; this.rules = { ...DEFAULTS, ...(o.rules || {}) };
      this.rules.showdowns = (this.rules.showdowns || []).map((s) => ({ ...s }));
      this.latMs = o.latency || [40, 40]; this.jitterMs = o.jitter == null ? 12 : o.jitter;
      this.onEvent = o.onEvent || null; this.onLog = o.onLog || null;
      this.t = 0; this.over = false; this.keys = [];
      this.players = [new Player(0, o.names[0], this), new Player(1, o.names[1], this)];
      this.do = new MatchDO(this);
      this.net = []; this.nseq = 0; this.chanAt = {};
      this.netRng = mulberry32((this.seed ^ NET_SALT) >>> 0);
      this.ctl = [null, null]; this.timers = []; this.script = (o.script || []).map((s) => ({ ...s }));
    }
    emit(ev) { if (this.onEvent) this.onEvent(ev, this); }
    log(from, to, text, kind) { if (this.onLog) this.onLog({ from, to, text, kind, t: this.t, active: this.do.activeTicks }); }
    key(text) { this.keys.push({ active: this.do.activeTicks, t: this.t, text }); this.emit({ type: 'key', text }); }
    lat(i, chan) {
      const ticks = Math.max(1, Math.round((this.latMs[i] + this.netRng() * this.jitterMs) / 1000 * TPS));
      const at = Math.max(this.t + ticks, this.chanAt[chan] || 0);
      this.chanAt[chan] = at;
      return at;
    }
    clientSend(i, msg) {
      const P = this.players[i];
      if (P.offline || P.closed) { if (msg.type !== 'hb' && msg.type !== 'pos') P.outbox.push(msg); return; }
      this.net.push({ at: this.lat(i, 'up' + i), to: 'DO', from: i, msg, s: this.nseq++ });
    }
    doSend(i, msg) {
      const P = this.players[i];
      if (P.offline || P.closed) return;
      this.net.push({ at: this.lat(i, 'down' + i), to: i, msg, s: this.nseq++ });
    }
    later(ticks, fn) { this.timers.push({ at: this.t + ticks, fn }); }
    start() { this.do.start(this.t); }
    away(i, reason, direct) {
      const P = this.players[i];
      if (P.away || P.offline || !P.alive || this.over) return;
      if (reason === 'lost') { P.offline = true; this.emit({ type: 'offline', p: i }); return; }
      P.away = true; if (reason === 'closed') P.closed = true;
      if (direct) this.do.onMessage(i, { type: 'away', reason }, this.t);
      else if (reason === 'closed') { P.closed = false; this.clientSend(i, { type: 'away', reason }); P.closed = true; }
      else this.clientSend(i, { type: 'away', reason });
    }
    back(i, awayMs) {
      const P = this.players[i];
      if (this.over) return;
      if (P.offline || P.closed) {
        const wasClosed = P.closed;
        P.offline = false; P.closed = false; P.away = false;
        if (wasClosed && P.cur) { P.queue.unshift({ t: P.cur.t, gem: P.cur.gem }); P.cur = null; }
        const out = P.outbox; P.outbox = [];
        out.forEach((msg) => this.clientSend(i, msg));
        this.clientSend(i, { type: 'rejoin', gack: P.gotGarbage, awayMs });
      } else if (P.away) { P.away = false; this.clientSend(i, { type: 'back', awayMs }); }
    }
    step() {
      const t = ++this.t;
      if (this.net.length) {
        const due = [];
        this.net = this.net.filter((e) => { if (e.at <= t) { due.push(e); return false; } return true; });
        due.sort((a, b) => a.at - b.at || a.s - b.s);
        for (const e of due) {
          if (e.to === 'DO') this.do.onMessage(e.from, e.msg, t);
          else if (!this.players[e.to].offline && !this.players[e.to].closed) this.players[e.to].onMessage(e.msg, t);
        }
      }
      this.do.tick(t);
      if (this.timers.length) {
        const due = this.timers.filter((x) => x.at <= t);
        if (due.length) { this.timers = this.timers.filter((x) => x.at > t); due.forEach((x) => x.fn(this)); }
      }
      if (this.script.length && !this.over) {
        const sec = this.do.activeTicks / TPS;
        for (const s of this.script) if (!s.done && sec >= s.at && this.do.state === 'playing') { s.done = true; s.fn(this); }
      }
      for (const i of [0, 1]) {
        const P = this.players[i];
        if (P.resumeAt >= 0 && t >= P.resumeAt) { P.frozen = false; P.resumeAt = -1; }
        if (!P.offline && !P.closed && t % TPS === i * 30) this.clientSend(i, { type: 'hb' });
        if (P.frozen || P.away || P.offline || !P.alive || this.over) continue;
        const inp = this.ctl[i] ? this.ctl[i].tick(t) : NONE;
        P.step(t, inp);
        if (t % 4 === i * 2) { const pm = P.posMessage(); if (pm) this.clientSend(i, pm); }
      }
    }
    run(maxTicks) { let n = 0; while (!this.over && n++ < maxTicks) this.step(); return this; }
    summary() {
      const r = this.do.result;
      return { result: r, stats: this.players.map((p) => ({ ...p.stats })), keys: this.keys.slice(), ticks: this.t, active: this.do.activeTicks,
        pausesLeft: this.do.p.map((p) => p.pausesLeft), reconnects: this.do.p.map((p) => p.reconnects), counts: { ...this.do.counts } };
    }
  }

  return { W, VIS, H, TPS, PIECES, POWERS, GEM_POWER, DEFAULTS, BOTS, CELLS, Match, Bot, Human, fits, cellsAt, spawnPos, framesPerRow, fmtT, snapshot, parse, height };
})();
if (typeof module !== 'undefined') module.exports = LV;
