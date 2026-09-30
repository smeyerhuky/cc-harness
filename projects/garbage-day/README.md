# Garbage Day

Garbage Day is a two-player, real-time falling-block versus game (a Tetris-style clone under its own name and look): two players are matched at random, play side by side on the same seeded pieces, and attack each other with garbage lines. It is for casual players who want a quick live match with a stranger or a friend, and it runs entirely on Cloudflare (Workers, static assets and Durable Objects) with no server to operate.

## Getting started

Nothing to build yet: M0 (spec and design) is done and M1 starts with the workspace scaffold
([`GD-TICKET-006`](kb/process/backlog/GD-TICKET-006.md)). Read, in order:

- [the PRD](kb/product/prd.md) and the rules files beside it: what v1 does;
- [the design](kb/design/index.md): system and React client architecture, UI language, stack and CI;
- [`spikes/proof-of-concept/`](spikes/proof-of-concept/JOURNAL.md): the demo pages' source, which the
  engine is ported from. `node spikes/proof-of-concept/live/test-live.js` runs its bot matches.

How work on the project is planned and recorded, and where its knowledge base starts:
[`CLAUDE.md`](CLAUDE.md).
