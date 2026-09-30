const LV = require('./live-engine.js');
const disrupt = () => [
  { at: 35, fn: (m) => { m.away(1, 'tab'); m.later(6 * 60, (mm) => mm.clientSend(0, { type: 'extend' })); m.later(18 * 60, (mm) => mm.back(1)); } },
  { at: 70, fn: (m) => { m.away(0, 'lost'); m.later(14 * 60, (mm) => mm.back(0)); } },
  { at: 105, fn: (m) => { m.away(1, 'tab'); m.later(2 * 60, (mm) => mm.away(0, 'tab')); m.later(12 * 60, (mm) => mm.back(0)); m.later(25 * 60, (mm) => mm.back(1)); } },
  { at: 125, fn: (m) => { m.away(1, 'tab'); m.later(6 * 60, (mm) => mm.back(1)); } },
];
for (const sd of [0x5EED02, 0x1234, 0xBEEF, 0x777, 0xD0D0, 0x5EED03, 0x5EED04, 0x5EED05, 0x2B2B, 0x3C3C]) {
  const m = new LV.Match({ seed: sd, names: ['KESTREL', 'HERON'], latency: [35, 55], script: disrupt() });
  m.ctl = [new LV.Bot(m, 0, LV.BOTS.kestrel), new LV.Bot(m, 1, LV.BOTS.heron)];
  m.start(); m.run(60 * 60 * 15);
  const s = m.summary();
  const fired = m.script.filter((x) => x.done).length;
  console.log(sd.toString(16), 'winner', s.result.winner, s.result.reason, 'active', LV.fmtT(s.active / 60), 'wall', LV.fmtT(s.ticks / 60), 'scripts', fired, 'K tetris', s.stats[0].tetrises, 'H', s.stats[1].tetrises);
}
