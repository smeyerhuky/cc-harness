# Garbage Day

Garbage Day is a two-player, real-time falling-block versus game (a Tetris-style clone under its own name and look): two players are matched at random, play side by side on the same seeded pieces, and attack each other with garbage lines. It is for casual players who want a quick live match with a stranger or a friend, and it runs entirely on Cloudflare (Workers, static assets and Durable Objects) with no server to operate.

## Getting started

M1 (foundations) is under way: the workspace builds, but there is no game in it yet. With Node
22.22 or newer, from `projects/garbage-day/`:

```
corepack enable            # or prefix every command with: npx pnpm@12.8.1
pnpm install
pnpm dev                   # the client on Vite's dev server
pnpm test                  # engine, protocol, ui and client tests
pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build   # the code gates
```

The code lives in `src/`, one package per folder: `engine`, `protocol`, `ui` (the shared
commons) and `app` (the React client, and the Worker from `GD-TICKET-011`). To understand what is
being built, read, in order:

- [the PRD](kb/product/prd.md) and the rules files beside it: what v1 does;
- [the design](kb/design/index.md): system and React client architecture, UI language, stack and CI;
- [`spikes/proof-of-concept/`](spikes/proof-of-concept/JOURNAL.md): the demo pages' source, which the
  engine is ported from. `node spikes/proof-of-concept/live/test-live.js` runs its bot matches.

How work on the project is planned and recorded, and where its knowledge base starts:
[`CLAUDE.md`](CLAUDE.md).
