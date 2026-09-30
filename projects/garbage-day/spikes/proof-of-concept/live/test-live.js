const LV = require('./live-engine.js');
function sim(seed, a, b, script, rules) {
  const m = new LV.Match({ seed, names: ['KESTREL', 'HERON'], latency: [35, 55], script, rules });
  m.ctl = [new LV.Bot(m, 0, LV.BOTS[a]), new LV.Bot(m, 1, LV.BOTS[b])];
  m.start();
  const t0 = Date.now();
  m.run(60 * 60 * 15);
  const s = m.summary();
  s.ms = Date.now() - t0;
  return s;
}
const disrupt = [
  { at: 35, fn: (m) => { m.away(1, 'tab'); m.later(6 * 60, (mm) => mm.clientSend(0, { type: 'extend' })); m.later(18 * 60, (mm) => mm.back(1)); } },
  { at: 70, fn: (m) => { m.away(0, 'lost'); m.later(14 * 60, (mm) => mm.back(0)); } },
  { at: 105, fn: (m) => { m.away(1, 'tab'); m.later(2 * 60, (mm) => mm.away(0, 'tab')); m.later(12 * 60, (mm) => mm.back(0)); m.later(25 * 60, (mm) => mm.back(1)); } },
  { at: 125, fn: (m) => { m.away(1, 'tab'); m.later(6 * 60, (mm) => mm.back(1)); } },
];
const seeds = [0x5EED01, 0x5EED02, 0x1234, 0xBEEF, 0xC0FFEE, 0x777, 0xA11CE, 0xD0D0];
for (const sd of seeds) {
  const s = sim(sd, 'kestrel', 'heron', []);
  console.log('plain', sd.toString(16), 'winner', s.result && s.result.winner, s.result && s.result.reason, 'active', LV.fmtT(s.active / 60), 'ms', s.ms,
    'K', JSON.stringify({ l: s.stats[0].lines, s: s.stats[0].sent, t: s.stats[0].tetrises, ts: s.stats[0].tspins, p: s.stats[0].powersUsed }),
    'H', JSON.stringify({ l: s.stats[1].lines, s: s.stats[1].sent, t: s.stats[1].tetrises, ts: s.stats[1].tspins, p: s.stats[1].powersUsed }), 'msgs', s.counts.in);
}
const d1 = sim(0x5EED02, 'kestrel', 'heron', disrupt);
const d2 = sim(0x5EED02, 'kestrel', 'heron', disrupt);
console.log('\nDISRUPTED:', d1.result, LV.fmtT(d1.active / 60), 'wall', LV.fmtT(d1.ticks / 60), 'pausesLeft', d1.pausesLeft, 'reconnects', d1.reconnects);
d1.keys.forEach((k) => console.log('  ', LV.fmtT(k.active / 60), k.text));
console.log('deterministic:', JSON.stringify(d1.stats) === JSON.stringify(d2.stats) && d1.ticks === d2.ticks);
// human-vs-bot smoke: a bot plays the human seat through the Human controller path is not needed; check rookie vs regular
const r = sim(0xABCD, 'rookie', 'regular', []);
console.log('\nrookie vs regular:', r.result, LV.fmtT(r.active / 60));
