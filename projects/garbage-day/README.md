# Garbage Day

Garbage Day is a two-player, real-time falling-block versus game (a Tetris-style clone under its own name and look): two players are matched at random, play side by side on the same seeded pieces, and attack each other with garbage lines. It is for casual players who want a quick live match with a stranger or a friend, and it runs entirely on Cloudflare (Workers, static assets and Durable Objects) with no server to operate.

## Getting started

M1 (foundations) and M2 (play solo) are complete, and M3 (play online) is under way. The game is live at
<https://garbage-day.smeyerhuky.workers.dev>, where you play a bot in the browser. Online
matches come with M3: quick match against a stranger, which survives a dropped connection, is in
pull request #14's preview so far. Add `?dev` to the address, or press ` (the key left of 1), for the
developer overlay: the app's state and every message between the players and the referee.
With Node 22.22 or newer, from `projects/garbage-day/`:

```
corepack enable            # or prefix every command with: npx pnpm@12.8.1
pnpm install
pnpm dev                   # the app, the Worker and both Durable Objects, locally in workerd
pnpm test                  # engine (with golden replays), protocol, ui and client tests
pnpm test:worker           # the Worker and Durable Object tests, inside workerd
pnpm test:browser          # golden replays in three browsers, and the accessibility scan
pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build   # the code gates
```

The code lives in `src/`, one package per folder: `engine` (the deterministic rules, bots and
referee), `protocol` (the wire messages), `ui` (the shared commons) and `app` (the React client
in `client/`, the Worker and Durable Objects in `worker/`). Deploys run from CI: a Worker Preview
per pull request, production on `main` ([stack and CI](kb/design/stack-and-ci.md#deployment)). To understand what is
being built, read, in order:

- [the PRD](kb/product/prd.md) and the rules files beside it: what v1 does;
- [the design](kb/design/index.md): system and React client architecture, UI language, stack and CI;
- [`spikes/proof-of-concept/`](spikes/proof-of-concept/JOURNAL.md): the demo pages' source, which the
  engine is ported from. `node spikes/proof-of-concept/live/test-live.js` runs its bot matches.

How work on the project is planned and recorded, and where its knowledge base starts:
[`CLAUDE.md`](CLAUDE.md).
