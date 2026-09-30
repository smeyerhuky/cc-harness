(() => {
'use strict';
/* ================================================================= SHARED ================================================================= */
const $ = (s, el = document) => el.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k, d) { try { const v = localStorage.getItem('gdl.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('gdl.' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
let activeSection = 'live';

/* ---- sound (off until asked) ---- */
let soundOn = false, actx = null;
function beep(freq, dur = 0.08, type = 'square', vol = 0.05, when = 0, slide) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime + when, o = actx.createOscillator(), gn = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) { /* audio unavailable */ }
}
const sfx = {
  move() { beep(330, 0.03, 'square', 0.02); },
  drop() { beep(120, 0.08, 'square', 0.05, 0, 70); },
  clear(n) { [523, 659, 784, 1046].slice(0, n).forEach((f, i) => beep(f, 0.1, 'triangle', 0.05, i * 0.06)); },
  attack() { beep(260, 0.3, 'sawtooth', 0.025, 0, 1100); },
  cancel() { beep(820, 0.14, 'square', 0.035, 0, 260); },
  rise() { beep(95, 0.35, 'sawtooth', 0.05, 0, 50); },
  tick() { beep(880, 0.05, 'sine', 0.05); },
  go() { beep(1320, 0.15, 'sine', 0.06); },
  badge() { [784, 988, 1318].forEach((f, i) => beep(f, 0.1, 'triangle', 0.05, i * 0.08)); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => beep(f, 0.16, 'triangle', 0.06, i * 0.1)); },
  bad() { beep(160, 0.22, 'square', 0.05, 0, 90); },
  pause() { beep(600, 0.12, 'sine', 0.05, 0, 300); },
  power() { beep(440, 0.18, 'triangle', 0.05, 0, 1400); },
  showdown() { [392, 392, 523].forEach((f, i) => beep(f, 0.16, 'square', 0.04, i * 0.18)); },
};

/* ---- colors from tokens ---- */
const COL = { P: {}, PW: {} }, themeHooks = [];
function readColors() {
  const cs = getComputedStyle(document.documentElement), g = (n) => cs.getPropertyValue(n).trim();
  Object.assign(COL, { well: g('--well'), grid: g('--well-grid'), you: g('--you-stack'), rival: g('--rival-stack'),
    garbage: g('--garbage'), stripe: g('--garbage-stripe'), bad: g('--bad'), ink: g('--well-ink') });
  ['I', 'O', 'T', 'S', 'Z', 'J', 'L'].forEach((p) => { COL.P[p] = g('--p-' + p); });
  ['shield', 'bomb', 'fog', 'rush'].forEach((p) => { COL.PW[p] = g('--pw-' + p); });
  themeHooks.forEach((f) => f());
}
try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', readColors); } catch (e) { /* old browser */ }
new MutationObserver(readColors).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

/* ---- toast ---- */
let toastT = 0;
function toast(title, small) {
  const t = $('#toast'); t.innerHTML = ''; t.append(title);
  if (small) { const s = document.createElement('small'); s.textContent = small; t.appendChild(s); }
  t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---- piece glyphs ---- */
function glyph(letter, size = 10) {  // replay engine shapes (y-up)
  const sh = GD.SHAPES[letter];
  const w = Math.max(...sh.map((c) => c[0])) + 1, h = Math.max(...sh.map((c) => c[1])) + 1;
  return `<svg viewBox="0 0 ${w * size} ${h * size}" width="${w * size}" height="${h * size}" aria-hidden="true">${sh.map(([x, y]) =>
    `<rect x="${x * size + 0.5}" y="${(h - 1 - y) * size + 0.5}" width="${size - 1}" height="${size - 1}" rx="1.5" style="fill:var(--p-${letter[0]})"/>`).join('')}</svg>`;
}
function lvGlyph(piece, size = 7) {  // live engine shapes, with the gem marked
  if (!piece) return '';
  const cells = LV.CELLS[piece.t][0];
  const minC = Math.min(...cells.map((c) => c[0])), minR = Math.min(...cells.map((c) => c[1]));
  const w = Math.max(...cells.map((c) => c[0])) - minC + 1, h = Math.max(...cells.map((c) => c[1])) - minR + 1;
  return `<svg viewBox="0 0 ${w * size} ${h * size}" width="${w * size}" height="${h * size}" aria-hidden="true">${cells.map(([c, r], k) => {
    const x = (c - minC) * size, y = (r - minR) * size, gem = piece.gem && piece.gem.i === k;
    return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="1.5" style="fill:var(--${gem ? 'pw-' + piece.gem.type : 'p-' + piece.t})"/>` +
      (gem ? `<path d="M${x + size / 2} ${y + 1.5} L${x + size - 1.5} ${y + size / 2} L${x + size / 2} ${y + size - 1.5} L${x + 1.5} ${y + size / 2} Z" style="fill:#fff"/>` : '');
  }).join('')}</svg>`;
}
const PW_PATH = {
  shield: '<path d="M8 1 L14 3.6 V8 C14 11.4 11.4 14 8 15 C4.6 14 2 11.4 2 8 V3.6 Z"/>',
  bomb: '<circle cx="7" cy="9.6" r="5"/><path d="M10.4 5.4 L12.8 3" style="fill:none;stroke-width:1.8"/><circle cx="13.5" cy="2.4" r="1.4"/>',
  fog: '<rect x="1" y="3.5" width="14" height="2.2" rx="1.1"/><rect x="3" y="7.4" width="12" height="2.2" rx="1.1"/><rect x="1" y="11.3" width="10" height="2.2" rx="1.1"/>',
  rush: '<path d="M1.5 3 L8 8 L1.5 13 Z"/><path d="M8 3 L14.5 8 L8 13 Z"/>',
};
const PW_TEXT = {
  shield: ['Shield', 'Wipes your meter and blocks every attack for 5 s.'],
  bomb: ['Bomb', 'Removes your bottom 3 rows, garbage included.'],
  fog: ['Fog', "Clouds the top of your opponent's board for 6 s."],
  rush: ['Rush', "Your opponent's speed jumps by 4 levels for 6 s."],
};
const pwIcon = (k, size = 18) => (k ? `<svg viewBox="0 0 16 16" width="${size}" height="${size}" aria-label="${PW_TEXT[k][0]}" style="fill:var(--pw-${k});stroke:var(--pw-${k})">${PW_PATH[k]}</svg>` : '');

/* ---- state machines + their diagrams ---- */
function createMachine(name, states, initial) {
  const m = { name, state: initial, last: null, subs: [],
    send(ev) {
      const to = states[m.state] && states[m.state][ev];
      if (!to) return false;
      m.last = { from: m.state, to, ev }; m.state = to;
      m.subs.forEach((f) => f(m)); return true;
    },
    force(s) { m.state = s; m.last = null; m.subs.forEach((f) => f(m)); },
    on(f) { m.subs.push(f); } };
  return m;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function mk(tag, attrs, parent) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function drawMachine(svg, spec) {
  svg.setAttribute('viewBox', `0 0 ${spec.w} ${spec.h}`);
  svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', spec.label);
  const defs = mk('defs', {}, svg);
  [['a', 'var(--sm-edge)'], ['h', 'var(--sm-on)']].forEach(([k, c]) => {
    const m = mk('marker', { id: `${k}-${spec.id}`, viewBox: '0 0 8 8', refX: 7, refY: 4, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    mk('path', { d: 'M0,0 L8,4 L0,8 z', style: `fill:${c}` }, m);
  });
  const nodeEl = {}, edgeEl = {};
  const N = spec.nodes, hw = (n) => (n.w || 76) / 2, hh = 14;
  function border(n, tx, ty) {
    const dx = tx - n.x, dy = ty - n.y;
    const t = Math.min(Math.abs(dx) > 0.01 ? hw(n) / Math.abs(dx) : 1e9, Math.abs(dy) > 0.01 ? hh / Math.abs(dy) : 1e9);
    return [n.x + dx * t, n.y + dy * t];
  }
  spec.edges.forEach((e) => {
    const g = mk('g', { class: 'sm-edge' + (e.dashed ? ' dashed' : '') }, svg);
    let d = e.d;
    if (!d) {
      const a = N[e.from], b = N[e.to], [x1, y1] = border(a, b.x, b.y), [x2, y2] = border(b, a.x, a.y);
      const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      d = `M${(x1 + ux * 2).toFixed(1)},${(y1 + uy * 2).toFixed(1)} L${(x2 - ux * 3).toFixed(1)},${(y2 - uy * 3).toFixed(1)}`;
    }
    const path = mk('path', { d }, g);
    if (!e.noArrow) path.setAttribute('marker-end', `url(#a-${spec.id})`);
    if (e.label) {
      const t = mk('text', { x: e.lx, y: e.ly, 'text-anchor': e.anchor || 'middle' }, g);
      e.label.split('\n').forEach((line, i) => { const ts = mk('tspan', { x: e.lx, dy: i ? 11 : 0 }, t); ts.textContent = line; });
    }
    const key = e.from + '>' + e.to;
    (edgeEl[key] = edgeEl[key] || []).push({ g, path, noArrow: e.noArrow });
  });
  Object.entries(N).forEach(([id, n]) => {
    const g = mk('g', { class: 'sm-node' }, svg);
    mk('rect', { x: n.x - hw(n), y: n.y - hh, width: hw(n) * 2, height: hh * 2, rx: 7 }, g);
    const t = mk('text', { x: n.x, y: n.y + 4, 'text-anchor': 'middle' }, g); t.textContent = n.label || id;
    nodeEl[id] = g;
  });
  const tokens = {};
  (spec.tokens || []).forEach((tk) => {
    const g = mk('g', { class: 'tok' }, svg);
    mk('circle', { r: 8, cx: 0, cy: 0, style: `fill:var(--${tk.color})` }, g);
    const t = mk('text', { x: 0, y: 3.5, 'text-anchor': 'middle' }, g); t.textContent = tk.letter;
    tokens[tk.id] = g;
  });
  return { spec, nodeEl, edgeEl, tokens, hotKey: null };
}
function highlight(view, state, last) {
  Object.entries(view.nodeEl).forEach(([id, g]) => g.classList.toggle('on', id === state));
  if (view.hotKey) (view.edgeEl[view.hotKey] || []).forEach((e) => { e.g.classList.remove('hot'); if (!e.noArrow) e.path.setAttribute('marker-end', `url(#a-${view.spec.id})`); });
  view.hotKey = null;
  if (last) {
    const key = last.from + '>' + last.to, list = view.edgeEl[key];
    if (list) { list.forEach((e) => { e.g.classList.add('hot'); if (!e.noArrow) e.path.setAttribute('marker-end', `url(#h-${view.spec.id})`); }); view.hotKey = key; }
  }
}

/* ---- progress: XP + badges ---- */
const LEVELS = [[0, 'Rookie stacker'], [150, 'Line clearer'], [400, 'Garbage collector'], [700, 'Well digger'], [1000, 'B2B machine'], [1400, 'Garbage Day legend']];
const BADGES = [
  ['firstWin', 'First win', 'Beat RIVAL live', 'T'], ['tetrisLive', 'Four-row club', 'Clear a Tetris live', 'IV'],
  ['tspin', 'T-spin', 'Land a T-spin live', 'T'], ['power', 'Power player', 'Fire a power-up live', 'O'],
  ['allPowers', 'Full kit', 'Fire all four power-ups', 'L'], ['showdown', 'Sudden death', 'Still standing when sudden death starts', 'Z'],
  ['comeBack', 'Back in time', 'Return from a pause live', 'S'], ['timeLord', 'Time lord', 'Extend a pause timer', 'L'],
  ['ghost', 'Ghost connection', 'Make RIVAL lose Wi-Fi', 'S'], ['series', 'Series watched', 'Watch both simulated matches to the end', 'J'],
  ['replay', 'Garbage Day', 'Finish the step-through replay', 'I'], ['labRat', 'Lab rat', 'Try the attack lab', 'J'],
];
const BADGE_ALIAS = { garbageDay: 'replay' };
let xp = store.get('xp', 0), got = new Set(store.get('badges', [])), powersEver = new Set(store.get('powers', []));
function renderXp() {
  let lvl = 0; LEVELS.forEach(([t], i) => { if (xp >= t) lvl = i; });
  const [t0, name] = LEVELS[lvl], t1 = LEVELS[lvl + 1] ? LEVELS[lvl + 1][0] : t0;
  $('#xpTitle').textContent = name;
  $('#xpNum').textContent = xp + ' XP' + (LEVELS[lvl + 1] ? ' · next at ' + t1 : '');
  $('#xpBar').style.width = (LEVELS[lvl + 1] ? ((xp - t0) / (t1 - t0)) * 100 : 100) + '%';
}
function addXp(n) {
  const before = xp; xp += n; store.set('xp', xp); renderXp();
  const lv = (v) => LEVELS.filter(([t]) => v >= t).length;
  if (lv(xp) > lv(before)) toast('Level up: ' + LEVELS[lv(xp) - 1][1], `${xp} XP`);
}
function renderBadges(fresh) {
  $('#badges').innerHTML = BADGES.map(([id, name, how, g]) => `<div class="badge ${got.has(id) ? 'got' : ''} ${fresh === id ? 'fresh' : ''}"><div class="ic">${glyph(g, 7)}</div><div><b>${name}</b><span>${how}</span></div></div>`).join('');
  $('#badgeCount').textContent = `${got.size} of ${BADGES.length} collected`;
}
function award(id) {
  id = BADGE_ALIAS[id] || id;
  const b = BADGES.find((x) => x[0] === id);
  if (!b || got.has(id)) return;
  got.add(id); store.set('badges', [...got]);
  renderBadges(id); addXp(100); sfx.badge(); toast('Badge: ' + b[1], b[2] + ' · +100 XP');
}
function notePower(kind) {
  powersEver.add(kind); store.set('powers', [...powersEver]);
  award('power'); if (powersEver.size >= 4) award('allPowers');
}

/* ================================================================= LIVE BOARD RENDERER ================================================================= */
const GEM_OF = { 1: 'shield', 2: 'bomb', 3: 'fog', 4: 'rush' };
const EMPTY = LV.parse('.'.repeat(LV.W * LV.H));
class BoardCanvas {
  constructor(canvas) { this.c = canvas; this.ctx = canvas.getContext('2d'); this.cell = 16; this.spr = new Map(); themeHooks.push(() => this.spr.clear()); }
  size(cell) {
    this.cell = cell;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.c.width = cell * 10 * dpr; this.c.height = cell * 20 * dpr;
    this.c.style.width = cell * 10 + 'px'; this.c.style.height = cell * 20 + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.spr.clear();
  }
  garbage(s) {
    if (!this.spr.has(s)) {
      const c = document.createElement('canvas'), dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = s * dpr; c.height = s * dpr;
      const x = c.getContext('2d'); x.scale(dpr, dpr);
      x.fillStyle = COL.garbage; x.fillRect(1, 1, s - 2, s - 2);
      x.save(); x.beginPath(); x.rect(1, 1, s - 2, s - 2); x.clip();
      x.strokeStyle = COL.stripe; x.lineWidth = Math.max(2, s * 0.17);
      for (let i = -s; i < s * 2; i += s * 0.46) { x.beginPath(); x.moveTo(i, s); x.lineTo(i + s, 0); x.stroke(); }
      x.restore(); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(1, 1, s - 2, Math.max(2, s * 0.12));
      this.spr.set(s, c);
    }
    return this.spr.get(s);
  }
  cellAt(px, py, s, color, a = 1) {
    const c = this.ctx, bev = Math.max(1, Math.round(s * 0.14));
    c.globalAlpha = a; c.fillStyle = color; c.fillRect(px + 1, py + 1, s - 2, s - 2);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(px + 1, py + 1, s - 2, bev);
    c.fillStyle = 'rgba(0,0,0,.24)'; c.fillRect(px + 1, py + s - 1 - bev, s - 2, bev);
    c.globalAlpha = 1;
  }
  gemAt(px, py, s, kind, now) {
    this.cellAt(px, py, s, COL.PW[kind]);
    const c = this.ctx, cx = px + s / 2, cy = py + s / 2, r = s * 0.27 * (1 + 0.14 * Math.sin(now / 170));
    c.fillStyle = 'rgba(255,255,255,.95)';
    c.beginPath(); c.moveTo(cx, cy - r); c.lineTo(cx + r, cy); c.lineTo(cx, cy + r); c.lineTo(cx - r, cy); c.closePath(); c.fill();
  }
  draw(b, o = {}) {
    const c = this.ctx, s = this.cell, Wp = s * 10, Hp = s * 20, now = o.now || 0;
    c.fillStyle = COL.well; c.fillRect(0, 0, Wp, Hp);
    c.strokeStyle = COL.grid; c.lineWidth = 1; c.beginPath();
    for (let x = 1; x < 10; x++) { c.moveTo(x * s + 0.5, 0); c.lineTo(x * s + 0.5, Hp); }
    for (let y = 1; y < 20; y++) { c.moveTo(0, y * s + 0.5); c.lineTo(Wp, y * s + 0.5); }
    c.stroke();
    let off = 0;
    if (o.rise && o.t - o.rise.t < 9 && !reduceMotion) off = o.rise.n * (1 - (o.t - o.rise.t) / 9);
    const flash = o.clearing ? o.clearing.rows : null;
    for (let y = 0; y < 22; y++) {
      const py = (19 - y + off) * s;
      if (py < -s || py > Hp) continue;
      const row = b[y];
      for (let x = 0; x < 10; x++) {
        const ch = row[x]; if (ch === '.') continue;
        const px = x * s;
        if (o.dead) this.cellAt(px, py, s, '#4B5257');
        else if (ch === 'X') c.drawImage(this.garbage(s), px, py, s, s);
        else if (GEM_OF[ch]) this.gemAt(px, py, s, GEM_OF[ch], now);
        else this.cellAt(px, py, s, COL.P[ch] || COL.garbage);
      }
      if (flash && flash.includes(y)) { c.fillStyle = `rgba(255,255,255,${0.35 + 0.45 * Math.abs(Math.sin(now / 45))})`; c.fillRect(0, py, Wp, s); }
    }
    const p = o.cur;
    if (p && !o.dead) {
      if (o.ghost) {
        let gy = p.y; while (LV.fits(b, p.t, p.r, p.x, gy - 1)) gy--;
        c.strokeStyle = COL.P[p.t]; c.lineWidth = 2; c.globalAlpha = 0.6;
        LV.cellsAt(p.t, p.r, p.x, gy).forEach(([x, y]) => { if (y < 20) c.strokeRect(x * s + 2, (19 - y) * s + 2, s - 4, s - 4); });
        c.globalAlpha = 1;
      }
      LV.CELLS[p.t][p.r].forEach(([cc, rr], k) => {
        const x = p.x + cc, y = p.y - rr; if (y >= 20 || y < 0) return;
        if (p.gem && p.gem.i === k) this.gemAt(x * s, (19 - y) * s, s, p.gem.type, now);
        else this.cellAt(x * s, (19 - y) * s, s, COL.P[p.t]);
      });
    }
    if (o.fog) {
      const g = c.createLinearGradient(0, 0, 0, Hp * 0.78);
      g.addColorStop(0, 'rgba(168,174,196,0.98)'); g.addColorStop(0.82, 'rgba(150,156,180,0.93)'); g.addColorStop(1, 'rgba(150,156,180,0)');
      c.fillStyle = g; c.fillRect(0, 0, Wp, Hp * 0.78);
      for (let i = 0; i < 7; i++) {
        const bx = ((now / 38 + i * 57) % (Wp + 80)) - 40, by = (i * 41) % (Hp * 0.62);
        c.beginPath(); c.fillStyle = 'rgba(220,224,238,.35)'; c.arc(bx, by, s * 2.3, 0, 7); c.fill();
      }
    }
  }
}

/* ---- a two-screen stage (live and spectator) ---- */
class StageView {
  constructor(prefix, root, asym) {
    this.q = (s) => root.querySelector(s);
    this.p = prefix; this.asym = asym;
    this.stage = this.q(`#${prefix}-stage`);
    this.boards = [0, 1].map((i) => new BoardCanvas(this.q(`#${prefix}-cv-${i}`)));
    this.cells = [16, 16]; this.cache = {};
    this.el = (id) => this.q(`#${prefix}-${id}`);
    new ResizeObserver(() => this.layout()).observe(this.stage);
    this.onScreen = true;
    try { new IntersectionObserver((es) => { this.onScreen = es.some((e) => e.isIntersecting); }).observe(this.stage); } catch (e) { /* no observer */ }
    this.confetti = { cv: this.el('confetti'), parts: [], dirty: false };
  }
  layout() {
    const w = this.stage.clientWidth, narrow = w < 640;
    this.stage.classList.toggle('narrow', narrow);
    const pad = narrow ? 8 : 12, lane = narrow ? 30 : 64, gap = narrow ? 6 : 10, side = narrow ? 34 : 52;
    const inner = w - pad * 2 - lane - gap * 2;
    let a = inner / 2, b = inner / 2;
    if (narrow && this.asym) { b = Math.floor(inner * 0.36); a = inner - b; }
    this.stage.style.gridTemplateColumns = `minmax(0,${Math.round(a)}fr) ${lane}px minmax(0,${Math.round(b)}fr)`;
    const byH = Math.floor(Math.max(window.innerHeight, 560) * 0.6 / 20);
    const sideB = narrow && this.asym ? 0 : side;
    this.cells = [clamp(Math.min(Math.floor((a - side - 22) / 10), byH), 7, 24), clamp(Math.min(Math.floor((b - sideB - 22) / 10), byH), 5, 24)];
    [0, 1].forEach((i) => { this.boards[i].size(this.cells[i]); this.el('meter-' + i).style.height = this.cells[i] * 20 + 'px'; });
  }
  set(id, key, html) { const el = this.el(id); if (el && el._k !== key) { el._k = key; el.innerHTML = html; } }
  text(id, s) { const el = this.el(id); if (el && el._t !== s) { el._t = s; el.textContent = s; } }
  meter(i, total, ready, shield) {
    const el = this.el('meter-' + i), c = this.cells[i], key = total + '/' + ready + '/' + shield + '/' + c;
    if (el._k === key) return; el._k = key;
    el.querySelector('.meter-fill').style.height = Math.min(total, 20) * c + 'px';
    el.querySelector('.meter-ready').style.height = Math.min(ready, 20) * c + 'px';
    const lab = el.querySelector('.meter-n'); lab.textContent = total; lab.style.bottom = (Math.min(total, 20) * c + 2) + 'px'; lab.style.opacity = total ? 1 : 0.4;
    el.classList.toggle('shield', !!shield);
  }
  pres(i, state, label) {
    const el = this.el('pres-' + i); if (!el || el._k === state + label) return; el._k = state + label;
    el.dataset.s = state; el.querySelector('span').textContent = label;
  }
  lvl(i, level, prog, hot) {
    const el = this.el('lvl-' + i), key = level + '|' + Math.round(prog * 50) + '|' + hot;
    if (el._k === key) return; el._k = key;
    el.querySelector('b').textContent = 'SPEED ' + level; el.querySelector('s').style.width = (prog * 100).toFixed(0) + '%';
    el.classList.toggle('hot', !!hot);
  }
  side(i, hold, power, next) {
    this.set('hold-' + i, hold ? hold.t + (hold.gem ? hold.gem.type : '') : '-', lvGlyph(hold, 7));
    this.set('pw-' + i, power || '-', power ? pwIcon(power, 20) : '<span class="none">–</span>');
    if (next) this.set('next-' + i, next.map((p) => p.t + (p.gem ? p.gem.i + p.gem.type : '')).join(''), next.map((p) => lvGlyph(p, 6)).join(''));
  }
  count(i, n) {
    const el = this.el('cnt-' + i); const v = n ? String(n) : '';
    if (el._t === v) return; el._t = v; el.textContent = v;
    if (v) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  cover(i, show, txt) {
    const el = this.el('cov-' + i); el.hidden = !show;
    if (show) { const sp = el.querySelector('span'); if (sp._t !== txt) { sp._t = txt; sp.textContent = txt; } }
  }
  popup(i, text, cls = '') {
    if (!this.onScreen) return;
    const el = document.createElement('div'); el.className = 'popup ' + cls; el.textContent = text;
    this.el('pop-' + i).appendChild(el); setTimeout(() => el.remove(), 1400);
  }
  shake(i) { if (reduceMotion) return; const s = this.el('scr-' + i); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
  centerOf(el) { const r = el.getBoundingClientRect(), sr = this.stage.getBoundingClientRect(); return [r.left - sr.left + r.width / 2, r.top - sr.top + r.height / 2]; }
  projectile(from, to, text) {
    if (!this.onScreen || reduceMotion) return;
    const el = document.createElement('div'); el.className = 'proj'; el.textContent = text;
    this.el('fx').appendChild(el);
    const [x0, y0] = this.centerOf(this.el('box-' + from)), [x1, y1] = this.centerOf(this.el('do'));
    const [x2, y2] = this.centerOf(this.el('meter-' + to));
    const w = el.offsetWidth / 2, h = el.offsetHeight / 2;
    const anim = el.animate([
      { transform: `translate(${x0 - w}px,${y0 - h}px) scale(.5)`, opacity: 0 },
      { transform: `translate(${x1 - w}px,${y1 - h}px) scale(1.1)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${x2 - w}px,${y2 - h}px) scale(.7)`, opacity: 0.8 },
    ], { duration: 700, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'forwards' });
    anim.onfinish = () => el.remove();
    const d = this.el('do'); d.classList.remove('pulse'); void d.offsetWidth; d.classList.add('pulse');
  }
  burst(i, n = 60) {
    if (reduceMotion || !this.onScreen) return;
    const [x, y] = this.centerOf(this.el('box-' + i)), cols = Object.values(COL.P);
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 6;
      this.confetti.parts.push({ x, y: y - 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, r: Math.random() * 6, c: cols[k % cols.length], life: 90 + Math.random() * 50, s: 4 + Math.random() * 5 });
    }
  }
  stepConfetti() {
    const C = this.confetti;
    if (!C.parts.length && !C.dirty) return;
    const cv = C.cv, ctx = cv.getContext('2d'), w = this.stage.clientWidth, h = this.stage.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    C.parts = C.parts.filter((q) => q.life > 0);
    C.parts.forEach((q) => {
      q.vy += 0.18; q.vx *= 0.99; q.x += q.vx; q.y += q.vy; q.r += 0.1; q.life--;
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.globalAlpha = Math.min(1, q.life / 30);
      ctx.fillStyle = q.c; ctx.fillRect(-q.s / 2, -q.s / 2, q.s, q.s * 0.6); ctx.restore();
    });
    C.dirty = C.parts.length > 0;
  }
  msg(i, key, title, text, btns) {
    const box = this.el('box-' + i);
    let el = box.querySelector('.msg');
    if (!key) { if (el) el.remove(); return null; }
    if (el && el._k === key) return el;
    if (el) el.remove();
    el = document.createElement('div'); el.className = 'msg'; el._k = key;
    el.innerHTML = '<b></b><span class="tx"></span><span class="t"></span>';
    el.querySelector('b').textContent = title; el.querySelector('.tx').textContent = text;
    (btns || []).forEach(([label, fn]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn small'; b.textContent = label; b.onclick = fn; el.appendChild(b); });
    box.appendChild(el); return el;
  }
  msgTime(i, s) { const el = this.el('box-' + i).querySelector('.msg .t'); if (el && el._t !== s) { el._t = s; el.textContent = s; } }
  sd(info, activeTicks) {
    const el = this.el('sd');
    if (!info || info.phase === 'end') { el.hidden = true; return; }
    let txt, cls = info.kind === 'sudden' ? 'sudden' : '';
    const name = info.kind === 'sudden' ? 'Sudden death' : 'Double garbage';
    if (info.phase === 'soon') { const left = info.startsAt - activeTicks / 60; if (left < -0.5) { el.hidden = true; return; } txt = `Showdown in ${Math.max(0, Math.ceil(left))} · ${name}`; }
    else if (info.until === Infinity || info.until == null) txt = name + ' · speed +4 · garbage ×2';
    else txt = `${name} · ${fmt((info.until - activeTicks) / 60)}`;
    el.hidden = false; el.className = 'sd-banner ' + cls;
    if (el._t !== txt) { el._t = txt; el.textContent = txt; }
  }
}

/* ---- shared per-frame drawing of a live Match into a StageView ---- */
const PRES_LABEL = { present: 'online', away: 'away', grace: 'away · no pause', gone: 'gone', forfeit: 'forfeited' };
function drawMatch(V, m, now, spect) {
  const t = m.t, D = m.do, P = m.players, R = m.rules;
  const A = P[0];
  V.boards[0].draw(A.b, { cur: A.cur, ghost: !spect, clearing: A.clearing, t, rise: A.rise, fog: t < A.fx.fogUntil, dead: !A.alive, now });
  if (spect) {
    const B = P[1];
    V.boards[1].draw(B.b, { cur: B.cur, clearing: B.clearing, t, rise: B.rise, fog: t < B.fx.fogUntil, dead: !B.alive, now });
    V.meter(1, B.meterTotal(), B.meterReady(t), t < B.fx.shieldUntil);
    V.side(1, B.hold, B.power, B.queue.slice(0, 5));
  } else {
    const O = A.opp;
    V.boards[1].draw(O.b, { cur: O.cur, t, dead: !P[1].alive && m.over, now });
    V.meter(1, O.meter, O.meter, t < P[1].fx.shieldUntil);
    V.side(1, O.hold ? { t: O.hold } : null, O.power, null);
  }
  V.meter(0, A.meterTotal(), A.meterReady(t), t < A.fx.shieldUntil);
  V.side(0, A.hold, A.power, A.queue.slice(0, 5));
  const ramp = R.rampSec * 60, prog = (D.activeTicks % ramp) / ramp;
  [0, 1].forEach((i) => {
    const Pi = P[i], lv = Pi.level(t), hot = t < Pi.fx.rushUntil || (Pi.sd && Pi.sd.kind === 'sudden' && Pi.sd.phase === 'start');
    V.lvl(i, lv, lv >= R.maxLevel ? 1 : prog, hot);
    const st = spect || i === 0 ? Pi.stats : (A.opp.stats || {});
    const pps = D.activeTicks > 60 ? ((st.pieces || 0) / (D.activeTicks / 60)).toFixed(2) : '0.00';
    V.text('stats-' + i, `Lines ${st.lines || 0} · Sent ${st.sent || 0} · ${pps} pieces/s`);
    const pr = D.p[i].presence;
    const label = Pi.offline ? 'reconnecting…' : Pi.closed ? 'tab closed' : PRES_LABEL[pr] || pr;
    V.pres(i, Pi.offline ? 'silent' : pr === 'grace' ? 'away' : pr, label);
  });
  V.text('clock', fmt(D.activeTicks / 60));
  V.sd(A.sd, D.activeTicks);
  const cd = [0, 1].map((i) => (P[i].resumeAt > t ? Math.ceil((P[i].resumeAt - t) / 60) : 0));
  [0, 1].forEach((i) => V.count(i, cd[i] || (D.state === 'countdown' && D.goAt > t ? Math.ceil((D.goAt - t) / 60) : 0)));
  const paused = D.state === 'paused' && !m.over;
  let coverTxt = '';
  if (paused && D.pause) {
    const who = m.names[D.pause.by], why = { tab: 'switched tabs', step: 'stepped away', closed: 'closed the tab', lost: 'lost the connection' }[D.pause.reason] || 'left';
    coverTxt = D.abandonAt >= 0 ? `Both players away\nsession ends in ${fmt((D.abandonAt - t) / 60)}` : `${who} ${why}\n${fmt((D.pause.deadline - t) / 60)} to return`;
  }
  [0, 1].forEach((i) => V.cover(i, paused, coverTxt));
  V.stepConfetti();
  return cd;
}

/* ================================================================= LIVE ================================================================= */
function initLive() {
  const root = document.getElementById('live'), q = (s) => root.querySelector(s);
  const V = new StageView('l', root, true);
  const human = new LV.Human();
  const NAMES = ['YOU', 'RIVAL'];
  const S = { opp: 'regular', lat: 50, leave: 'nocontest', budget: 2, pauseSec: 120, ramp: 15 };
  let m = null, running = false, acc = 0, lastT = performance.now(), ff = 1, startTok = 0;
  let waited = false, resultShown = false, hidden = null, wake = null, lastCd = [0, 0];
  let seenResume = null, seenBack = null, note = null, pieceQ = [], pieceState = 'spawn', pieceAt = 0, lastPres = [null, null];
  const wireEl = q('#l-wire');

  /* diagrams */
  const smMatch = drawMachine(q('#l-smMatch'), {
    id: 'lmatch', label: 'Match state machine', w: 420, h: 205,
    nodes: { waiting: { x: 44, y: 36, w: 72 }, countdown: { x: 150, y: 36, w: 78 }, playing: { x: 262, y: 36, w: 72 },
      resuming: { x: 150, y: 132, w: 78 }, paused: { x: 262, y: 132, w: 72 }, over: { x: 380, y: 132, w: 64 } },
    edges: [
      { from: 'waiting', to: 'countdown', label: 'joined', lx: 97, ly: 27 },
      { from: 'countdown', to: 'playing', label: 'go', lx: 207, ly: 27 },
      { from: 'playing', to: 'paused', label: 'away ·\nlost', lx: 255, ly: 80, anchor: 'end' },
      { from: 'paused', to: 'resuming', label: 'back', lx: 207, ly: 124 },
      { from: 'resuming', to: 'playing', d: 'M150,117 C150,72 196,56 228,48', label: 'go', lx: 160, ly: 80, anchor: 'start' },
      { from: 'playing', to: 'over', label: 'top out ·\ngrace ends', lx: 336, ly: 70, anchor: 'start' },
      { from: 'paused', to: 'over', label: 'timer 0', lx: 323, ly: 124 },
      { from: 'paused', to: 'over', d: 'M0,0', noArrow: true, label: 'leave ·\nboth gone', lx: 323, ly: 148 },
      { from: 'paused', to: 'paused', d: 'M248,147 C236,184 290,184 277,147', label: 'extend', lx: 262, ly: 198 },
    ],
  });
  const smPres = drawMachine(q('#l-smPres'), {
    id: 'lpres', label: 'Presence state machine', w: 420, h: 218,
    nodes: { present: { x: 60, y: 105, w: 76 }, away: { x: 210, y: 30, w: 72 }, grace: { x: 210, y: 105, w: 70 },
      gone: { x: 210, y: 180, w: 70 }, forfeit: { x: 360, y: 105, w: 84, label: 'forfeited' } },
    edges: [
      { from: 'present', to: 'away', d: 'M84,90 C110,40 140,30 172,28', label: 'hidden ·\npause left', lx: 110, ly: 42, anchor: 'end' },
      { from: 'away', to: 'present', d: 'M176,42 C150,62 120,80 96,96', label: 'back', lx: 150, ly: 76, anchor: 'start' },
      { from: 'present', to: 'grace', label: 'none left', lx: 136, ly: 97 },
      { from: 'grace', to: 'present', d: 'M176,116 C150,134 122,134 97,116', label: 'back < 15 s', lx: 136, ly: 146 },
      { from: 'grace', to: 'forfeit', label: '15 s', lx: 281, ly: 97 },
      { from: 'present', to: 'gone', d: 'M92,117 L175,172', label: 'closed · lost', lx: 150, ly: 168, anchor: 'end' },
      { from: 'gone', to: 'present', d: 'M178,192 C120,206 54,178 56,121', label: 'rejoin', lx: 122, ly: 213 },
      { from: 'away', to: 'forfeit', label: 'timer 0', lx: 298, ly: 50, anchor: 'start' },
      { from: 'gone', to: 'forfeit', label: 'timer 0', lx: 300, ly: 168, anchor: 'start' },
    ],
    tokens: [{ id: 0, letter: 'Y', color: 'you' }, { id: 1, letter: 'R', color: 'rival' }],
  });
  const smPiece = drawMachine(q('#l-smPiece'), {
    id: 'lpiece', label: 'Piece state machine', w: 420, h: 216,
    nodes: { spawn: { x: 40, y: 56, w: 58 }, falling: { x: 126, y: 56, w: 64 }, locking: { x: 218, y: 56, w: 68 }, locked: { x: 316, y: 56, w: 64 },
      topout: { x: 64, y: 134, w: 64, label: 'top out' }, rise: { x: 196, y: 134, w: 104, label: 'garbage lands' },
      clear: { x: 330, y: 134, w: 84, label: 'clear lines' }, send: { x: 330, y: 196, w: 100, label: 'cancel · send' } },
    edges: [
      { from: 'spawn', to: 'falling' },
      { from: 'falling', to: 'locking', d: 'M160,51 L181,51', label: 'touch', lx: 171, ly: 44 },
      { from: 'locking', to: 'falling', d: 'M183,62 L162,62', label: 'lift', lx: 171, ly: 78 },
      { from: 'locking', to: 'locked', label: '0.5 s', lx: 267, ly: 47 },
      { from: 'falling', to: 'locked', d: 'M126,41 C150,8 290,8 314,40', label: 'hard drop', lx: 220, ly: 14 },
      { from: 'locked', to: 'clear', label: 'lines', lx: 330, ly: 100, anchor: 'start' },
      { from: 'clear', to: 'send', label: 'attack', lx: 336, ly: 170, anchor: 'start' },
      { from: 'locked', to: 'rise', label: 'no lines', lx: 262, ly: 108, anchor: 'end' },
      { from: 'rise', to: 'topout', label: 'past top', lx: 121, ly: 126 },
      { from: 'send', to: 'spawn', dashed: true, d: 'M280,196 H40 V72', label: 'next piece', lx: 170, ly: 190 },
      { from: 'rise', to: 'spawn', dashed: true, noArrow: true, d: 'M196,148 V196' },
      { from: 'falling', to: 'falling', d: 'M112,70 C100,100 152,100 140,70', label: 'hold', lx: 126, ly: 108 },
    ],
  });
  function tokens() {
    if (!m) return;
    const pos = [0, 1].map((i) => { const n = smPres.spec.nodes[pres(i)]; return [n.x + (n.w || 76) / 2 - 4, n.y - 14]; });
    if (pres(0) === pres(1)) pos[0][0] -= 18;
    [0, 1].forEach((i) => { smPres.tokens[i].style.transform = `translate(${pos[i][0]}px,${pos[i][1]}px)`; });
  }
  const pres = (i) => { const p = m.do.p[i].presence; return p === 'forfeit' ? 'forfeit' : p; };
  const EV_TEXT = { countdown: 'both joined', playing: 'go', paused: 'player away', resuming: 'player back', over: 'match over' };

  /* wire */
  const nm = (x) => (x === null || x === undefined ? '' : typeof x === 'number' ? NAMES[x] : x);
  function wireLine(from, to, text, active) {
    if (wireEl.firstElementChild && wireEl.firstElementChild.classList.contains('wire-empty')) wireEl.innerHTML = '';
    const li = document.createElement('li'); li.className = 'new';
    const cls = from === 'YOU' ? 'r-you' : from === 'RIVAL' ? 'r-rival' : 'r-do';
    li.innerHTML = `<span class="wt">${fmt((active || 0) / 60)}</span><span class="wr ${cls}">${from}${to ? ' → ' + to : ''}</span><code></code>`;
    li.querySelector('code').textContent = text;
    wireEl.appendChild(li);
    while (wireEl.children.length > 140) wireEl.firstChild.remove();
    wireEl.scrollTop = wireEl.scrollHeight;
  }
  const onLog = (e) => wireLine(nm(e.from), nm(e.to), e.text, e.active);
  let usageAt = 0;
  function usage(now) {
    if (now - usageAt < 400) return; usageAt = now;
    const c = m ? m.do.counts : { in: 0, pos: 0, hb: 0, lock: 0, relayed: 0 };
    q('#l-usage').innerHTML = `<span>Into the DO <b>${c.in.toLocaleString()}</b> messages (≈<b>${Math.ceil(c.in / 20).toLocaleString()}</b> billed requests)</span><span>position updates <b>${c.pos.toLocaleString()}</b></span><span>heartbeats <b>${c.hb.toLocaleString()}</b></span><span>locks <b>${c.lock.toLocaleString()}</b></span>`;
  }

  /* events → effects */
  function onEvent(ev, mm) {
    if (mm !== m) return;
    switch (ev.type) {
      case 'lock':
        if (ev.p === 0) {
          sfx.drop();
          if (ev.lines) {
            sfx.clear(ev.lines);
            V.popup(0, ev.label, ev.b2b || ev.lines === 4 || ev.tspin ? 'hazard-text' : '');
            if (ev.cancel) { V.popup(0, `−${ev.cancel} cancelled`, 'small hazard-text'); sfx.cancel(); }
            if (ev.lines === 4) { V.burst(0, 50); award('tetrisLive'); addXp(25); }
            if (ev.tspin) { award('tspin'); addXp(25); }
            if (ev.pc) { V.burst(0, 90); addXp(50); }
            if (ev.power) V.popup(0, '+ ' + PW_TEXT[ev.power][0], 'small power');
            pieceQ.push('locked', 'clear', 'send', 'spawn');
          } else if (ev.rise) { V.shake(0); sfx.rise(); pieceQ.push('locked', 'rise', 'spawn'); }
          else pieceQ.push('locked', 'spawn');
        } else {
          if (ev.lines) V.popup(1, ev.label, 'small');
          if (ev.rise) V.shake(1);
        }
        break;
      case 'route': V.projectile(ev.from, ev.to, '+' + ev.rows); if (ev.to === 0) sfx.attack(); break;
      case 'blocked': V.popup(ev.p, 'Blocked by shield', 'small power'); break;
      case 'powerUse': V.popup(ev.p, PW_TEXT[ev.kind][0] + '!', 'power'); sfx.power(); if (ev.p === 0) notePower(ev.kind); break;
      case 'powerApply':
        if (ev.kind === 'fog' && ev.p !== ev.by) V.popup(ev.p, 'Fogged for 6 s', 'small');
        if (ev.kind === 'rush' && ev.p !== ev.by) V.popup(ev.p, 'Rush: speed +4', 'small bad');
        if (ev.kind === 'bomb' && ev.p === ev.by) { V.shake(ev.p); V.popup(ev.p, 'Bottom 3 rows gone', 'small'); }
        if (ev.kind === 'shield' && ev.p === ev.by) V.popup(ev.p, 'Shield up', 'small power');
        break;
      case 'hold': if (ev.p === 0) pieceQ.push('hold'); break;
      case 'topout': V.popup(ev.p, 'Top out', 'bad'); if (ev.p === 0) pieceQ.push('topout'); break;
      case 'doState': highlight(smMatch, ev.to, { from: ev.from, to: ev.to }); q('#l-lastMatch').innerHTML = `last: <b>${ev.from} → ${ev.to}</b> (${EV_TEXT[ev.to] || ev.why || ''})`; if (ev.to === 'paused') sfx.pause(); break;
      case 'key':
        if (/^SUDDEN/.test(ev.text)) { sfx.showdown(); if (m.players[0].alive) award('showdown'); }
        else if (/^SHOWDOWN/.test(ev.text)) sfx.showdown();
        break;
      default: break;
    }
  }

  /* settings */
  function readSettings() {
    S.opp = q('#l-sOpp').value; S.lat = +q('#l-sLat').value; S.leave = q('#l-sLeave').value;
    S.budget = +q('#l-sBudget').value; S.pauseSec = +q('#l-sPause').value; S.ramp = +q('#l-sRamp').value;
    q('#l-sum').textContent = `${q('#l-sOpp').selectedOptions[0].text} · ~${S.lat} ms each way · ${S.budget} pause${S.budget === 1 ? '' : 's'} each · ${fmt(S.pauseSec)} timer · leaving ${S.leave === 'win' ? 'counts as a win' : 'is no contest'}`;
    q('#l-lat').textContent = `~${S.lat} ms`;
  }
  root.querySelectorAll('.set-grid select').forEach((s) => s.addEventListener('change', readSettings));
  const padEl = q('#l-pad');
  const coarse = matchMedia('(pointer: coarse)').matches;
  q('#l-sPad').checked = store.get('pad', coarse);
  padEl.hidden = !q('#l-sPad').checked;
  q('#l-sPad').onchange = (e) => { padEl.hidden = !e.target.checked; store.set('pad', e.target.checked); };

  /* matchmaking + start */
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  async function findMatch() {
    const tok = ++startTok;
    readSettings();
    running = false; m = null;
    q('#l-start').hidden = true; q('#l-result').hidden = true; resultShown = false; waited = false; note = null;
    wireEl.innerHTML = ''; seenResume = seenBack = null; pieceQ = [];
    root.querySelectorAll('.set-grid select').forEach((s) => { s.disabled = true; });
    wireLine('YOU', 'Lobby', 'join{}', 0); await sleep(350);
    if (tok !== startTok) return;
    wireLine('Lobby', null, 'queue: RIVAL was already waiting → pair them', 0); await sleep(300);
    if (tok !== startTok) return;
    wireLine('Lobby', null, 'create Match DO (idFromName(matchId))', 0);
    wireLine('Lobby', 'both', 'matched{matchId, joinToken}', 0); await sleep(250);
    if (tok !== startTok) return;
    const seed = (crypto.getRandomValues(new Uint32Array(1))[0]) >>> 0;
    m = new LV.Match({ seed, names: NAMES, latency: [S.lat, S.lat + 8], jitter: Math.max(4, S.lat / 4),
      rules: { pauseBudget: S.budget, pauseSec: S.pauseSec, rampSec: S.ramp, leaveResult: S.leave }, onEvent, onLog });
    m.ctl = [human, new LV.Bot(m, 1, LV.BOTS[S.opp])];
    human.reset(); m.start();
    running = true; acc = 0; lastT = performance.now(); ff = 1; activeSection = 'live';
    highlight(smMatch, m.do.state, null);
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((w) => { wake = w; }).catch(() => {}); } catch (e) { /* no wake lock */ }
    const r = V.stage.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) V.stage.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  q('#l-go').onclick = findMatch;

  function showResult() {
    resultShown = true;
    const D = m.do, r = D.result, P = m.players;
    const title = r.winner === 0 ? 'You win' : r.winner === 1 ? 'RIVAL wins' : 'No contest';
    if (r.winner === 0) { sfx.win(); V.burst(0, 140); award('firstWin'); addXp(200); } else sfx.bad();
    const row = (label, k) => `<tr><td>${label}</td><td>${P[0].stats[k]}</td><td>${P[1].stats[k]}</td></tr>`;
    q('#l-resIn').innerHTML = `<p class="eyebrow">Match over · ${fmt(D.activeTicks / 60)} of play</p><h3></h3><p class="rs"></p>
      <div class="tbl-wrap"><table class="res-tbl"><thead><tr><th></th><th>YOU</th><th>RIVAL</th></tr></thead><tbody>
      ${row('Lines', 'lines')}${row('Garbage sent', 'sent')}${row('Tetrises', 'tetrises')}${row('T-spins', 'tspins')}${row('Power-ups used', 'powersUsed')}${row('Pieces', 'pieces')}
      </tbody></table></div><div class="res-actions"><button class="btn primary" type="button" id="l-again">Rematch</button><button class="btn" type="button" id="l-change">Change settings</button></div>`;
    q('#l-resIn h3').textContent = title; q('#l-resIn .rs').textContent = r.reason.charAt(0).toUpperCase() + r.reason.slice(1) + '.';
    q('#l-result').hidden = false;
    q('#l-again').onclick = findMatch;
    q('#l-change').onclick = () => { q('#l-result').hidden = true; q('#l-start').hidden = false; q('#l-settings').open = true; q('#l-settings').scrollIntoView({ block: 'nearest' }); };
    root.querySelectorAll('.set-grid select').forEach((s) => { s.disabled = false; });
    human.reset();
    if (wake) { try { wake.release(); } catch (e) { /* ignore */ } wake = null; }
  }

  /* input */
  const KEYMAP = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', ' ': 'hard', ArrowUp: 'cw', x: 'cw', X: 'cw', z: 'ccw', Z: 'ccw', Control: 'ccw', c: 'hold', C: 'hold', Shift: 'hold', e: 'power', E: 'power' };
  const playing = () => m && running && !m.over;
  document.addEventListener('keydown', (e) => {
    if (!playing() || activeSection !== 'live') return;
    if (/INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || '')) return;
    const k = KEYMAP[e.key]; if (!k) return;
    e.preventDefault(); if (!e.repeat) human.down(k);
  });
  document.addEventListener('keyup', (e) => { const k = KEYMAP[e.key]; if (k) human.up(k); });
  window.addEventListener('blur', () => human.reset());
  padEl.querySelectorAll('button').forEach((b) => {
    const k = b.dataset.k;
    const down = (e) => { e.preventDefault(); activeSection = 'live'; if (!playing()) return; try { b.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } b.classList.add('on'); human.down(k); };
    const up = () => { b.classList.remove('on'); human.up(k); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  });

  /* pause lab + popover */
  q('#l-rTab').onclick = () => { if (playing()) m.away(1, 'tab'); };
  q('#l-rClose').onclick = () => { if (playing()) m.away(1, 'closed'); };
  q('#l-rWifi').onclick = () => { if (playing()) { m.away(1, 'lost'); award('ghost'); } };
  q('#l-rBack').onclick = () => { if (playing()) m.back(1); };
  q('#l-yStep').onclick = () => {
    if (!playing()) return;
    const P0 = m.players[0];
    if (P0.away) m.back(0); else m.away(0, 'step');
  };
  q('#l-yLeave').onclick = () => { if (playing()) m.clientSend(0, { type: 'leave' }); };
  const toggleFF = () => { ff = ff === 1 ? 10 : 1; q('#l-mFF').textContent = q('#l-ff').textContent = ff === 1 ? 'Demo: fast-forward timers ×10' : 'Demo: back to real time'; };
  q('#l-ff').onclick = toggleFF; q('#l-mFF').onclick = toggleFF;
  q('#l-mWait').onclick = () => { waited = true; };
  q('#l-mExtend').onclick = () => { if (playing()) { m.clientSend(0, { type: 'extend' }); award('timeLord'); sfx.go(); } };
  q('#l-mLeave').onclick = () => { if (playing()) m.clientSend(0, { type: 'leave' }); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !q('#l-modal').hidden) waited = true; });

  function waitbar(show, left) {
    const box = q('#l-box-0');
    let el = box.querySelector('.waitbar');
    if (!show) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.className = 'waitbar';
      el.innerHTML = '<span class="grow">Waiting for RIVAL <span class="t"></span></span>';
      const ext = document.createElement('button'); ext.type = 'button'; ext.className = 'btn'; ext.textContent = '+1:00'; ext.onclick = () => q('#l-mExtend').click();
      const lv = document.createElement('button'); lv.type = 'button'; lv.className = 'btn'; lv.textContent = 'Leave'; lv.onclick = () => q('#l-mLeave').click();
      el.append(ext, lv); box.appendChild(el);
    }
    const t = el.querySelector('.t'); if (t._t !== left) { t._t = left; t.textContent = left; }
  }

  /* real tab visibility */
  function onHidden() {
    if (!playing()) return false;
    const P0 = m.players[0];
    if (P0.away || P0.offline) return true;
    hidden = { at: Date.now() };
    m.away(0, 'tab', true);
    return true;
  }
  function onVisible() {
    if (!hidden || !m) { hidden = null; return; }
    const ms = Date.now() - hidden.at, ticks = Math.round(ms / 1000 * 60), D = m.do;
    hidden = null;
    lastT = performance.now(); acc = 0;
    if (m.over) return;
    if (D.state === 'paused' && D.abandonAt >= 0 && ticks >= D.abandonAt - m.t) { D.end(null, 'both players left: session ended', m.t); return; }
    if (D.state === 'paused' && D.pause && D.pause.by === 0 && D.abandonAt < 0 && ticks > D.pause.deadline - m.t) {
      D.p[0].presence = 'forfeit'; D.end(1, 'YOU did not return in time', m.t); return;
    }
    if (D.p[0].presence === 'grace') {
      const k = Math.min(ticks, D.p[0].graceUntil - m.t + 5);
      for (let i = 0; i < k && !m.over; i++) m.step();
      if (m.over) return;
    }
    m.back(0, ms);
  }

  /* per-frame */
  function frame(now) {
    requestAnimationFrame(frame);
    if (m && running && !m.over) {
      const dt = Math.min(250, now - lastT); lastT = now;
      const speed = m.do.state === 'paused' || m.do.p.some((p) => p.presence === 'grace') ? ff : 1;
      acc += dt * speed;
      let n = 0;
      while (acc >= 1000 / 60 && n < 700) { m.step(); acc -= 1000 / 60; n++; if (m.over) break; }
      if (acc > 1000) acc = 0;
    } else lastT = now;
    if (m && m.over && !resultShown) showResult();
    if (V.onScreen) render(now);
    usage(now);
  }
  function render(now) {
    if (!m) { V.boards[0].draw(EMPTY, { now }); V.boards[1].draw(EMPTY, { now }); V.stepConfetti(); return; }
    const cd = drawMatch(V, m, now, false);
    [0, 1].forEach((i) => { if (cd[i] && cd[i] !== lastCd[i] && i === 0) sfx.tick(); });
    lastCd = cd;
    const t = m.t, D = m.do, P0 = m.players[0], P1 = m.players[1];
    const over = m.over;
    // popover for YOU when RIVAL is away
    const rivalPause = !over && D.state === 'paused' && D.pause && D.pause.by === 1 && D.abandonAt < 0 && P0.frozen;
    const modal = q('#l-modal');
    if (rivalPause && !waited) {
      if (modal.hidden) { modal.hidden = false; setTimeout(() => { if (!modal.hidden) q('#l-mWait').focus(); }, 50); }
      const reason = D.pause.reason;
      const title = { tab: 'RIVAL left the game tab', closed: 'RIVAL closed the game', lost: "RIVAL's connection dropped", step: 'RIVAL stepped away' }[reason] || 'RIVAL is away';
      const extra = reason === 'lost' ? " This one is free: dropped connections don't use RIVAL's pause budget." : '';
      if (q('#l-mTitle')._t !== title) { q('#l-mTitle')._t = title; q('#l-mTitle').textContent = title; q('#l-mText').textContent = `Both boards are hidden and frozen, so nobody loses time or sees the other's board. If RIVAL isn't back when the timer runs out, RIVAL forfeits.${extra}`; }
      const total = S.pauseSec + D.pause.ext * 60, left = (D.pause.deadline - t) / 60;
      const C = 2 * Math.PI * 28;
      q('#l-mRing').style.strokeDasharray = `${C * clamp(left / total, 0, 1)} ${C}`;
      q('#l-mTime').textContent = fmt(left);
      q('#l-mNote').textContent = D.pause.ext ? `Extended ${D.pause.ext}× · add more whenever you like.` : `Default wait ${fmt(S.pauseSec)}. You can add time whenever you like.`;
      q('#l-mLeave').textContent = S.leave === 'win' ? 'Leave (you win)' : 'Leave (no contest)';
    } else if (!modal.hidden) modal.hidden = true;
    waitbar(rivalPause && waited, rivalPause ? fmt((D.pause.deadline - t) / 60) : '');
    if (!rivalPause) waited = false;
    // cards on the boards: act as RIVAL, your own away state, return notes
    if (!over && (P1.away || P1.offline || P1.closed)) {
      const k = P1.offline ? 'lost' : P1.closed ? 'closed' : 'tab';
      const [ti, tx, bl] = { tab: ["RIVAL's screen", 'RIVAL switched to another tab.', 'Come back (as RIVAL)'], closed: ['Tab closed', 'Nothing runs on RIVAL\'s side. Reopening the link rejoins with the saved token.', 'Reopen the link (as RIVAL)'],
        lost: ['Connection lost', "RIVAL's browser is reconnecting. The DO notices after 5 s of silence; until then you keep playing.", 'Reconnect (as RIVAL)'] }[k];
      V.msg(1, 'r' + k, ti, tx, [[bl, () => m.back(1)]]);
      const Dp = D.p[1];
      V.msgTime(1, Dp.presence === 'grace' ? `No pauses left: ${fmt((Dp.graceUntil - t) / 60)} before RIVAL forfeits` : D.pause && D.pause.by === 1 ? `${fmt((D.pause.deadline - t) / 60)} left` : '');
    } else if (!over && P0.away) {
      const Dp = D.p[0];
      const grace = Dp.presence === 'grace';
      V.msg(0, 'y' + (grace ? 'g' : 'p'), grace ? 'No pauses left' : 'You stepped away', grace ? 'The match keeps running and RIVAL keeps playing. Come back before the timer ends or you forfeit.' : 'Both boards are frozen and hidden. RIVAL sees the wait-or-leave popover.', [['Come back', () => m.back(0)]]);
      V.msgTime(0, grace ? `${fmt((Dp.graceUntil - t) / 60)} to return` : `away ${fmt((t - Dp.awayAt) / 60)} · ${Dp.pausesLeft} pause${Dp.pausesLeft === 1 ? '' : 's'} left`);
      V.msg(1, null);
    } else {
      if (note && now > note.until) note = null;
      const inf = P0.info || {};
      if (inf.resume && inf.resume !== seenResume) {
        seenResume = inf.resume; const r = inf.resume, who = r.by === 0 ? 'You were' : 'RIVAL was';
        note = { p: r.by, until: now + 4200, text: `${who} away ${fmt(r.away / 60)}${r.free ? ' · free reconnect' : ''} · ${r.pausesLeft} pause${r.pausesLeft === 1 ? '' : 's'} left` };
        if (r.by === 0) { award('comeBack'); addXp(20); }
      }
      if (inf.back && inf.back !== seenBack) {
        seenBack = inf.back; const r = inf.back;
        note = { p: r.by, until: now + 4200, text: `${r.by === 0 ? 'You were' : 'RIVAL was'} away ${fmt(r.away / 60)} · no pause was used` };
      }
      [0, 1].forEach((i) => { if (note && note.p === i) V.msg(i, 'n' + note.text, 'Welcome back', note.text); else V.msg(i, null); });
    }
    // lab buttons
    const live = playing(), st = D.state;
    const rivalOut = P1.away || P1.offline || P1.closed;
    q('#l-rTab').disabled = q('#l-rClose').disabled = q('#l-rWifi').disabled = !live || rivalOut || st !== 'playing';
    q('#l-rBack').hidden = !(live && rivalOut);
    q('#l-rBack').textContent = P1.offline ? 'Reconnect RIVAL' : P1.closed ? 'Reopen the link as RIVAL' : 'Bring RIVAL back';
    q('#l-yStep').disabled = !live || (!P0.away && st !== 'playing');
    q('#l-yStep').textContent = P0.away ? 'Come back' : `Step away (${D.p[0].pausesLeft} pause${D.p[0].pausesLeft === 1 ? '' : 's'} left)`;
    q('#l-yLeave').disabled = !live;
    q('#l-ff').hidden = !(live && (st === 'paused' || D.p.some((p) => p.presence === 'grace')));
    const noteTxt = !m ? '' : st === 'paused' ? 'Paused: both boards are hidden. Act as RIVAL on the right, or answer the popover.' : 'Or switch away from this browser tab mid-match. Your pause budget applies.';
    if (q('#l-plNote')._t !== noteTxt) { q('#l-plNote')._t = noteTxt; q('#l-plNote').textContent = noteTxt; }
    // state machines
    [0, 1].forEach((i) => {
      const p = pres(i);
      if (p !== lastPres[i]) {
        const from = lastPres[i]; lastPres[i] = p;
        Object.entries(smPres.nodeEl).forEach(([id, g]) => g.classList.toggle('on', id === pres(0) || id === pres(1)));
        highlight(smPres, null, from ? { from, to: p } : null);
        Object.entries(smPres.nodeEl).forEach(([id, g]) => g.classList.toggle('on', id === pres(0) || id === pres(1)));
        q('#l-lastPres').innerHTML = from ? `last: <b>${NAMES[i]} ${from} → ${p}</b>` : 'both players: present';
        tokens();
      }
    });
    if (pieceQ.length) {
      if (now - pieceAt > 110) { const s = pieceQ.shift(); setPiece(s === 'hold' ? 'falling' : s, s === 'hold' ? 'falling' : null); pieceAt = now; }
    } else if (now - pieceAt > 110) {
      const derived = !P0.alive ? 'topout' : P0.clearing ? 'clear' : !P0.cur ? 'spawn' : P0.grounded() ? 'locking' : 'falling';
      if (derived !== pieceState) { setPiece(derived); pieceAt = now; }
    }
  }
  function setPiece(s, forceFrom) {
    const from = forceFrom || pieceState; pieceState = s;
    highlight(smPiece, s, { from, to: s });
    q('#l-lastPiece').innerHTML = `last: <b>${from} → ${s}</b>`;
  }

  readSettings();
  highlight(smMatch, 'waiting', null); highlight(smPiece, 'spawn', null);
  Object.entries(smPres.nodeEl).forEach(([id, g]) => g.classList.toggle('on', id === 'present'));
  [0, 1].forEach((i) => { smPres.tokens[i].style.transform = `translate(${94 - (i ? 0 : 18)}px,91px)`; });
  q('#l-lastMatch').textContent = 'state: waiting'; q('#l-lastPres').textContent = 'both players: present'; q('#l-lastPiece').textContent = 'state: spawn';
  V.layout(); usage(0);
  requestAnimationFrame(frame);
  return { onHidden, onVisible, busy: () => playing() };
}

/* ================================================================= SIMULATED MATCHES ================================================================= */
function initSims() {
  const root = document.getElementById('sims'), q = (s) => root.querySelector(s);
  const V = new StageView('s', root, false);
  const NAMES = ['KESTREL', 'HERON'];
  const disrupt = () => [
    { at: 35, fn: (m) => { m.away(1, 'tab'); m.later(360, (x) => x.clientSend(0, { type: 'extend' })); m.later(1080, (x) => x.back(1)); } },
    { at: 70, fn: (m) => { m.away(0, 'lost'); m.later(840, (x) => x.back(0)); } },
    { at: 105, fn: (m) => { m.away(1, 'tab'); m.later(120, (x) => x.away(0, 'tab')); m.later(720, (x) => x.back(0)); m.later(1500, (x) => x.back(1)); } },
    { at: 125, fn: (m) => { m.away(1, 'tab'); m.later(360, (x) => x.back(1)); } },
  ];
  const CFG = [
    { seed: 0xA056, name: 'Match 1', tag: 'clean', script: () => [] },
    { seed: 0x5EED05, name: 'Match 2', tag: 'with interruptions', script: disrupt },
  ];
  function make(k, hooks) {
    const c = CFG[k];
    const m = new LV.Match({ seed: c.seed, names: NAMES, latency: [35, 55], script: c.script(), onEvent: hooks.onEvent, onLog: hooks.onLog });
    m.ctl = [new LV.Bot(m, 0, LV.BOTS.kestrel), new LV.Bot(m, 1, LV.BOTS.heron)];
    m.start();
    return m;
  }
  const pre = CFG.map((_, k) => make(k, {}).run(60 * 60 * 20).summary());
  const verified = [null, null];

  function renderScore() {
    const wins = [0, 0]; pre.forEach((s) => { if (s.result.winner !== null) wins[s.result.winner]++; });
    q('#s-series').innerHTML = `Series: <b>KESTREL ${wins[0]} – ${wins[1]} HERON</b>. Seeds 0x${CFG[0].seed.toString(16).toUpperCase()} and 0x${CFG[1].seed.toString(16).toUpperCase()}; both computed in the browser when the page loaded.`;
    q('#s-score').innerHTML = pre.map((s, k) => {
      const r = s.result, win = r.winner === null ? 'No contest' : NAMES[r.winner] + ' wins';
      const rows = [['Lines', (i) => s.stats[i].lines], ['Garbage sent', (i) => s.stats[i].sent], ['Tetrises', (i) => s.stats[i].tetrises],
        ['Power-ups used', (i) => s.stats[i].powersUsed], ['Pauses used', (i) => 2 - s.pausesLeft[i]], ['Free reconnects used', (i) => 3 - s.reconnects[i]]];
      return `<article class="sc-card"><header><h3>${CFG[k].name}</h3><span class="sc-tag">${CFG[k].tag}</span></header>
        <p class="sc-win"><b>${win}</b> · ${r.reason}</p>
        <p class="sc-time">${fmt(s.active / 60)} of play · ${fmt(s.ticks / 60)} on the clock · ${s.counts.in.toLocaleString()} messages into the DO (≈${Math.ceil(s.counts.in / 20)} billed)</p>
        <div class="tbl-wrap"><table class="res-tbl"><thead><tr><th></th><th>KESTREL</th><th>HERON</th></tr></thead><tbody>
        ${rows.map(([l, f]) => `<tr><td>${l}</td><td>${f(0)}</td><td>${f(1)}</td></tr>`).join('')}</tbody></table></div>
        <p class="sc-verify ${verified[k] === true ? 'ok' : verified[k] === false ? 'bad' : ''}" id="s-ver-${k}">${verified[k] === true ? 'Watched: identical to the instant run, same result and same ' + s.ticks.toLocaleString() + ' ticks.' : verified[k] === false ? 'Watched run differed from the instant run.' : 'Not watched yet.'}</p></article>`;
    }).join('');
  }
  function renderKeys(watching, active) {
    q('#s-keys').innerHTML = pre.map((s, k) => `<div><h4>${CFG[k].name} · ${CFG[k].tag}</h4><ol>${s.keys.map((e) =>
      `<li class="${/wins|over|SUDDEN|SHOWDOWN/.test(e.text) ? 'hl' : ''} ${watching === k && e.active <= active ? 'past' : ''}"><b>${fmt(e.active / 60)}</b><span></span></li>`).join('')}</ol></div>`).join('');
    q('#s-keys').querySelectorAll('ol').forEach((ol, k) => ol.querySelectorAll('li span').forEach((sp, i) => { sp.textContent = pre[k].keys[i].text; }));
  }
  renderScore(); renderKeys(-1, 0);

  let m = null, cur = -1, queue = [], speed = 1, acc = 0, lastT = performance.now(), doneAt = 0, keysAt = 0;
  const wireEl = q('#s-wire');
  const onLog = (e) => {
    if (!/pause|power|showdown|result/.test(e.kind) && !(e.kind === 'attack' && /rows:([4-9]|\d\d)/.test(e.text))) return;
    if (wireEl.firstElementChild && wireEl.firstElementChild.classList.contains('wire-empty')) wireEl.innerHTML = '';
    const nm = (x) => (x === null || x === undefined ? '' : typeof x === 'number' ? NAMES[x] : x);
    const from = nm(e.from), to = nm(e.to);
    const li = document.createElement('li'); li.className = 'new';
    li.innerHTML = `<span class="wt">${fmt(e.active / 60)}</span><span class="wr ${from === 'DO' ? 'r-do' : from === 'KESTREL' ? 'r-you' : 'r-rival'}">${from}${to ? ' → ' + to : ''}</span><code></code>`;
    li.querySelector('code').textContent = e.text; wireEl.appendChild(li);
    while (wireEl.children.length > 120) wireEl.firstChild.remove();
    wireEl.scrollTop = wireEl.scrollHeight;
  };
  const onEvent = (ev, mm) => {
    if (mm !== m) return;
    if (ev.type === 'lock' && ev.lines) { V.popup(ev.p, ev.label, ev.lines === 4 ? 'hazard-text' : 'small'); if (ev.lines === 4) V.burst(ev.p, 40); }
    else if (ev.type === 'lock' && ev.rise) V.shake(ev.p);
    else if (ev.type === 'route') V.projectile(ev.from, ev.to, '+' + ev.rows);
    else if (ev.type === 'powerUse') V.popup(ev.p, PW_TEXT[ev.kind][0] + '!', 'power');
    else if (ev.type === 'topout') V.popup(ev.p, 'Top out', 'bad');
  };
  function watch(which) {
    activeSection = 'sims';
    queue = which === 'both' ? [0, 1] : [+which];
    next();
  }
  function next() {
    const k = queue.shift();
    if (k === undefined) { m = null; cur = -1; q('#s-idle').hidden = false; status('Done. Pick a match to watch again.'); return; }
    cur = k; m = make(k, { onEvent, onLog }); acc = 0; lastT = performance.now(); doneAt = 0;
    q('#s-idle').hidden = true; wireEl.innerHTML = '';
    status(`Watching ${CFG[k].name} (${CFG[k].tag})`);
    const r = V.stage.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) V.stage.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function status(s) { const el = q('#s-status'); if (el._t !== s) { el._t = s; el.textContent = s; } }
  root.querySelectorAll('[data-watch]').forEach((b) => { b.onclick = () => watch(b.dataset.watch); });
  q('#s-speedSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    speed = +b.dataset.sp; q('#s-speedSeg').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b));
  });
  q('#s-stop').onclick = () => { queue = []; m = null; cur = -1; q('#s-idle').hidden = false; status('Stopped.'); };

  function frame(now) {
    requestAnimationFrame(frame);
    if (m && !m.over) {
      const dt = Math.min(250, now - lastT); lastT = now;
      const D = m.do, fast = D.state === 'paused' || D.state === 'resuming' || m.players.some((p) => p.offline || p.away);
      const mult = fast ? Math.max(12, speed) : speed;
      acc += dt * mult;
      let n = 0;
      while (acc >= 1000 / 60 && n < 900) { m.step(); acc -= 1000 / 60; n++; if (m.over) break; }
      if (acc > 1000) acc = 0;
      V.text('speed', fast ? '×12 skip' : '×' + speed);
      if (m.over) {
        const s = m.summary(), p = pre[cur];
        verified[cur] = JSON.stringify(s.stats) === JSON.stringify(p.stats) && s.ticks === p.ticks && JSON.stringify(s.result) === JSON.stringify(p.result);
        renderScore(); doneAt = now;
        const r = s.result;
        V.burst(r.winner === null ? 0 : r.winner, 120);
        status(`${CFG[cur].name}: ${r.winner === null ? 'no contest' : NAMES[r.winner] + ' wins'}. ${verified[cur] ? 'Identical to the instant run.' : ''}`);
        if (verified[0] && verified[1]) award('series');
      }
    } else lastT = now;
    if (m && m.over && doneAt && now - doneAt > 2600) { doneAt = 0; next(); }
    if (m && V.onScreen) {
      drawMatch(V, m, now, true);
      const D = m.do, t = m.t;
      [0, 1].forEach((i) => {
        const P = m.players[i], Dp = D.p[i];
        if (P.offline) { V.msg(i, 'off', 'Connection lost', 'This browser froze itself. The DO notices after 5 s without a heartbeat.'); V.msgTime(i, ''); }
        else if (Dp.presence === 'grace') { V.msg(i, 'grace', 'Away, no pauses left', 'The match keeps running without this player.'); V.msgTime(i, `${fmt((Dp.graceUntil - t) / 60)} to return`); }
        else if (m.over && D.result) {
          const r = D.result, w = r.winner === i;
          V.msg(i, 'res' + i, r.winner === null ? 'No contest' : w ? 'Winner' : 'Topped out', w ? r.reason : '');
        } else V.msg(i, null);
      });
      if (now - keysAt > 500) { keysAt = now; renderKeys(cur, D.activeTicks); }
    } else if (!m && V.onScreen) { V.boards[0].draw(EMPTY, { now }); V.boards[1].draw(EMPTY, { now }); V.stepConfetti(); }
  }
  V.layout();
  requestAnimationFrame(frame);
}

/* ================================================================= REPLAY (ported from the first page) ================================================================= */
function initReplay() {
/*__REPLAY__*/
}

/* ================================================================= ATTACK LAB ================================================================= */
function initLab() {
  const CLEARS = { Single: [0, false], Double: [1, false], Triple: [2, false], Tetris: [4, true], 'T-spin Single': [2, true], 'T-spin Double': [4, true], 'T-spin Triple': [6, true], 'Perfect clear': [10, false] };
  const COMBO = [0, 1, 1, 2, 2, 3, 3, 4, 4, 4, 5];
  const lab = { clear: 'Tetris', b2b: false, sd: false, combo: 0, inc: 3 };
  $('#labClear').innerHTML = Object.keys(CLEARS).map((k) => `<button type="button" data-c="${k}" aria-pressed="${k === lab.clear}">${k}</button>`).join('');
  function renderLab() {
    const [base, difficult] = CLEARS[lab.clear];
    const b2b = lab.b2b && difficult ? 1 : 0, combo = COMBO[Math.min(lab.combo, 10)];
    let attack = base + b2b + combo;
    if (lab.clear === 'Perfect clear') attack = Math.max(attack, 10);
    const cancel = Math.min(attack, lab.inc), sentRaw = attack - cancel, sent = sentRaw * (lab.sd ? 2 : 1), left = lab.inc - cancel;
    const terms = [`<span class="term">${base} ${lab.clear}</span>`];
    if (b2b) terms.push('+', '<span class="term">1 back-to-back</span>');
    if (combo) terms.push('+', `<span class="term">${combo} combo ×${lab.combo + 1}</span>`);
    terms.push('=', `<span class="term total">${attack} attack</span>`);
    if (lab.sd && sentRaw) terms.push('→', `<span class="term">${sentRaw} left after cancelling ×2 = ${sent}</span>`);
    $('#labEq').innerHTML = terms.join(' ');
    $('#labYou').innerHTML = lab.inc ? Array.from({ length: lab.inc }, (_, i) => `<i class="${i >= left ? 'x' : ''}"></i>`).join('') : '<span class="none">empty</span>';
    $('#labOpp').innerHTML = sent ? Array.from({ length: sent }, () => '<i class="s"></i>').join('') : '<span class="none">nothing arrives</span>';
    let say = attack === 0 ? `A ${lab.clear.toLowerCase()} sends nothing.`
      : cancel && sent ? `Cancels ${cancel} of your ${lab.inc} incoming rows, then sends ${sent} to your opponent.`
      : cancel ? `All ${attack} go to cancelling your own meter${left ? `, and ${left} ${left === 1 ? 'row still waits' : 'rows still wait'} for you` : ', which is now empty'}. Your opponent receives nothing.`
      : `Your meter is empty, so all ${sent} rows go to your opponent.`;
    if (lab.b2b && !difficult) say += ' Back-to-back only boosts Tetrises and T-spins, and this clear ends the chain.';
    if (lab.sd && sent) say += ' During a showdown the Match DO doubles what it routes.';
    $('#labSay').textContent = say;
    $('#cOut').textContent = lab.combo; $('#incOut').textContent = lab.inc;
  }
  let touches = 0;
  const touched = () => { touches++; if (touches === 3) award('labRat'); renderLab(); };
  $('#labClear').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; lab.clear = b.dataset.c; $('#labClear').querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', x === b)); touched(); });
  $('#labB2b').onchange = (e) => { lab.b2b = e.target.checked; touched(); };
  $('#labSd').onchange = (e) => { lab.sd = e.target.checked; touched(); };
  $('#cMinus').onclick = () => { lab.combo = Math.max(0, lab.combo - 1); touched(); };
  $('#cPlus').onclick = () => { lab.combo = Math.min(10, lab.combo + 1); touched(); };
  $('#labInc').oninput = (e) => { lab.inc = +e.target.value; touched(); };
  renderLab();
  $('#pwTable').innerHTML = Object.entries(PW_TEXT).map(([k, [n, d]]) => `<tr><td><span class="pwname">${pwIcon(k, 16)} ${n}</span></td><td>${d}</td></tr>`).join('');
}

/* ================================================================= BOOT ================================================================= */
readColors(); renderXp(); renderBadges();
const safe = (name, fn) => { try { return fn(); } catch (e) { console.error(name + ' failed to start', e); return null; } };
safe('lab', initLab);
const live = safe('live', initLive);
const replay = safe('replay', initReplay);
safe('sims', initSims);
['live', 'replay', 'sims'].forEach((id) => {
  const el = document.getElementById(id);
  el.addEventListener('pointerdown', () => { activeSection = id; }, true);
  el.addEventListener('focusin', () => { activeSection = id; });
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (live && live.onHidden()) return;
    if (replay && activeSection === 'replay') replay.onHidden();
  } else {
    if (live) live.onVisible();
    if (replay) replay.onVisible();
  }
});
$('#soundBtn').onclick = (e) => { soundOn = !soundOn; e.currentTarget.setAttribute('aria-pressed', soundOn); e.currentTarget.textContent = soundOn ? 'Sound on' : 'Sound off'; if (soundOn) sfx.go(); };
$('#resetBtn').onclick = () => { xp = 0; got = new Set(); powersEver = new Set(); store.set('xp', 0); store.set('badges', []); store.set('quiz', {}); store.set('powers', []); renderXp(); renderBadges(); toast('Progress reset'); };
})();
