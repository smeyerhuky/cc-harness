const GD = require('./engine.js');
const tl = GD.timeline();
const show = (b, n) => b.slice(0, n).map((r) => r.join('')).reverse().join('\n');
let ok = true;
const fail = (m) => { ok = false; console.log('FAIL', m); };
const count = (b) => b.flat().filter((c) => c !== '.' && c !== 'X').length;

tl.forEach((st, k) => {
  const m = GD.MOMENTS[k];
  console.log(`\n=== M${k} ${m.t} ${m.title}  events: ${JSON.stringify(st.events)}`);
  for (const p of ['you', 'rival']) {
    const pre = st.pre[p], post = st.post[p];
    console.log(`${p}: idx ${pre.idx}->${post.idx} meter ${pre.meter}->${post.meter} b2b ${post.b2b} draws ${post.draws} next=${GD.SEQ[post.idx]}`);
  }
  // Piece identity: the acting player's piece must be the next piece in the shared sequence.
  if (m.type === 'action') {
    const want = GD.SEQ[st.pre[m.actor].idx];
    if (want !== m.move.letter) fail(`M${k}: ${m.actor} plays ${m.move.letter} but sequence #${st.pre[m.actor].idx + 1} is ${want}`);
  }
  // Silent stacking between moments must only add whole pieces on top of what was there.
  if (k > 0 && m.set && m.type !== 'skip') {
    for (const p of ['you', 'rival']) {
      if (!m.set[p]) continue;
      const prev = GD.settle(tl[k - 1].post[p].b), cur = st.pre[p].b;
      for (let y = 0; y < GD.H; y++) for (let x = 0; x < GD.W; x++) {
        if (prev[y][x] !== '.' && cur[y][x] !== prev[y][x]) fail(`M${k} ${p}: cell ${x},${y} removed/changed`);
      }
      const added = count(cur) - count(prev), pieces = st.pre[p].idx - tl[k - 1].post[p].idx;
      if (added !== pieces * 4) fail(`M${k} ${p}: added ${added} cells for ${pieces} pieces`);
    }
  }
});
const expect = [
  [1, 'rival', 'attack', { lines: 2, sent: 1 }], [2, 'you', 'rise', { n: 1, hole: 2 }],
  [3, 'you', 'attack', { lines: 4, sent: 4 }], [4, 'rival', 'attack', { lines: 3, cancel: 2, sent: 0 }],
  [5, 'rival', 'rise', { n: 2, hole: 7 }], [6, 'rival', 'attack', { lines: 2, sent: 1 }],
  [9, 'you', 'attack', { lines: 4, attack: 5, sent: 5 }], [10, 'rival', 'rise', { n: 5, hole: 0 }],
];
for (const [k, , type, fields] of expect) {
  const e = tl[k].events.find((ev) => ev.type === type);
  if (!e) { fail(`M${k} missing ${type}`); continue; }
  for (const [f, v] of Object.entries(fields)) if (e[f] !== v) fail(`M${k} ${type}.${f}=${e[f]} want ${v}`);
}
if (!tl[10].events.some((e) => e.type === 'topout')) fail('M10 no topout');
console.log('\nM10 rival post:\n' + show(tl[10].post.rival.b, 24));
console.log('\nM6 rival post:\n' + show(tl[6].post.rival.b, 6));
console.log(ok ? '\nALL CHECKS PASS' : '\nCHECKS FAILED');
