# Spike journal — Proof of concept

Work item: [`GD-SPIKE-001`](../../kb/process/backlog/GD-SPIKE-001.md). Written 2026-09-30 from the
planning session of 2026-09-29/30, in which the proof of concept was built before the project
existed; the code in this folder is exactly what ran.

## Purpose

Answer, with running code, whether a live two-player falling-block game can work with no server
of its own: one Durable Object per match relaying moves and routing garbage, each browser running
its own board, identical pieces for both players, and the owner's pause rules enforced fairly.

## Method

Two single-file HTML pages, published as private Artifacts and driven in headless Chromium:

| Page | Folder | What it runs |
|---|---|---|
| [Garbage Day](https://claude.ai/artifact/L5SGMhy2aj8qozrDVNSrkT) | `replay/` | An 11-moment step-through replay of one match: a deterministic engine (`engine.js`, global `GD`), animated boards, quizzes, the player's own moves, the pause popover, three state-machine diagrams, a wire log |
| [Garbage Day Live](https://claude.ai/artifact/VcuM8PLqvvcBjYD1n8EPja) | `live/` | Live play against a bot at 60 ticks a second through a simulated Match DO with modelled latency (`live-engine.js`, global `LV`), the replay above, and two bot-vs-bot matches computed headless at load and replayed tick for tick |

- `replay/check.js` replays the scripted match and checks every piece identity, garbage hole and
  attack value; `replay/seedsearch.js` found the seed (`0xCDD72`) that produces the scripted
  sequence from a real 7-bag.
- `live/test-live.js` runs 8 seeded bot-vs-bot matches plus one scripted with every interruption,
  twice, and compares the runs; `live/pick.js` chose the two showcase seeds.
- `live/build.py` assembles `garbage-day-live.html` from `live-body.html`, `extra.css`, `app.js`,
  both engines and the replay page. Run it from this folder: `python3 live/build.py`.

## Findings

1. **No server is needed beyond the Match DO.** The simulated DO dealt bags, relayed positions at
   15 Hz and a snapshot per lock, routed garbage with ids, scheduled showdowns and ran every pause
   rule. Nothing required a second service.
2. **Determinism holds.** Same seed and inputs gave identical matches: `deterministic: true`
   across repeated runs, and a watched replay matched its headless run tick for tick
   ("same 10,094 ticks").
3. **The rule values play well.** Bot matches ended in 1:20 to 3:15 of active play with balanced
   wins; the speed curve, 0.5 s garbage delay, 8-row cap and showdowns at 1:00 and 2:30 bound the
   match length without feeling abrupt. These values became `kb/product/game-rules.md`.
4. **Message volume fits the free plan.** A 2:45 match sent about 4,300 messages into the DO,
   about 217 billed requests at the 20:1 WebSocket ratio.
5. **Pause rules compose.** A scripted match exercised a tab switch with an extension, a Wi-Fi drop
   (free reconnect, 5 s detection), both players away (abandon timer started and cancelled), and a
   return with no pauses left (15 s grace). All resolved correctly and deterministically.
6. **Unacknowledged garbage is the reconnect trap.** Garbage routed during a connection loss is
   lost unless the DO keeps it; the fix that worked is an id per attack, acknowledged by the
   client, resent on rejoin.
7. **Headless precompute is cheap.** Two full bot matches computed in about 100 ms each in the
   browser, so replays and golden tests are affordable in CI.

## Discrepancies

- A first read of a precompute summary mistook `winner: 0` (KESTREL) for HERON; the series was
  2–0, not 1–1. Fixed by switching match 2's seed; the lesson is to print winner names, not indices.
- The first Tetris-seeking bot almost never built Tetrises because its "danger" check fired
  whenever any garbage was pending; loosening it to 4+ rows pending fixed it.
- `typescript-eslint` and `@cloudflare/vitest-pool-workers` lag the newest TypeScript and Vitest
  majors (found when choosing the stack, 2026-09-30): see `kb/design/stack-and-ci.md`.

## Open Questions

None blocking. Mini T-spins are not distinguished and the bot cannot tuck or spin; both are
accepted for v1 and noted in the design.

## Artifacts

- `replay/`: `engine.js`, `page.src.html`, `check.js`, `seedsearch.js`, built `garbage-day.html`
- `live/`: `live-engine.js`, `app.js`, `extra.css`, `live-body.html`, `build.py`, `test-live.js`,
  `pick.js`, built `garbage-day-live.html`
- Throwaway: the production code is written fresh in TypeScript from `live-engine.js`
  (`kb/design/architecture.md`, "What carries over from the proof of concept").
