# Garbage Day — Working Rules for Claude Sessions

Governs `projects/garbage-day/`.

Garbage Day is a two-player, real-time falling-block versus game (a Tetris-style clone under its own name and look): two players are matched at random, play side by side on the same seeded pieces, and attack each other with garbage lines. It is for casual players who want a quick live match with a stranger or a friend, and it runs entirely on Cloudflare (Workers, static assets and Durable Objects) with no server to operate. It deliberately does not use the Tetris name or trade dress, and it has no
accounts, rankings or persistent history in its first version. The design is already proven as a
proof of concept in two interactive pages (see the handoff); this project turns that into a spec,
product docs and a real build.

## Structure

```
src/            source code: a pnpm workspace, one package per folder
  engine/       @garbage-day/engine — the deterministic game rules (pure TypeScript, no DOM)
  protocol/     @garbage-day/protocol — message types and Zod schemas
  ui/           @garbage-day/ui — the commons: tokens, primitives, game widgets, hooks
  app/          @garbage-day/app — the React client (client/), the Worker and Durable Objects (worker/)
kb/             project-specific OKF knowledge base — see navigation below
  overview/     what the project is, for whom, what is out of scope
  process/      handoff, roadmap, backlog/, journal/, definition of done  (the PDLC instances)
  product/      the spec: PRD, game rules, pause and presence rules, controls and layout
  design/       system and client architecture, UI language, stack and CI
  alignment/    review ceremonies, one folder each — created at the first ceremony
spikes/         spike journals + throwaway code (proof-of-concept/: the demo pages' source)
package.json    workspace scripts; pnpm-workspace.yaml, pnpm-lock.yaml, tsconfig.base.json,
                eslint.config.js, .prettierrc.json, knip.json, vitest.config.ts beside it
CLAUDE.md       this file (governs the project)
README.md       overview and setup
version.json    project metadata (status, current milestone, updated)
```

## Knowledge base navigation

Start at [`kb/index.md`](kb/index.md):

- **[overview/](kb/overview/index.md)** — what the project is, for whom, and what is out of scope
- **[product/](kb/product/index.md)** — the spec: PRD, game rules, pause and presence rules, controls and layout
- **[design/](kb/design/index.md)** — system and client architecture, UI language, tech stack and CI
- **[process/](kb/process/index.md)** — handoff, roadmap, backlog, running journal, definition of done

## PDLC — how work is planned and recorded here

This project follows the repo's PDLC layer — the method lives in [`/kb/pdlc/`](../../kb/pdlc/index.md);
the files below are this project's instances of it.

**Work-item prefix: `GD`** — items are `GD-<KIND>-<NNN>`, registered in
[`/projects/kb/projects/index.md`](../kb/projects/index.md).

| Pipeline stage | Lives here |
|---|---|
| Spec (what, for whom, out of scope, acceptance criteria) | [`kb/product/`](kb/product/index.md) — the [PRD](kb/product/prd.md) and the rules it cites |
| Design (architecture, contracts, technology choices) | [`kb/design/`](kb/design/index.md) — system and client architecture, UI language, stack and CI |
| Roadmap (milestones, todos, exit criteria) | [`kb/process/roadmap.md`](kb/process/roadmap.md) |
| Backlog (epics, stories, spikes, tickets) | [`kb/process/backlog/`](kb/process/backlog/index.md) |
| Running journal (one entry per working session) | [`kb/process/journal/`](kb/process/journal/index.md) |
| Handoff (where things stand now) | [`kb/process/handoff.md`](kb/process/handoff.md) |
| Definition of done | [`kb/process/definition-of-done.md`](kb/process/definition-of-done.md) |
| Review ceremonies | `kb/alignment/` — created at the first ceremony |
| Spike journals | `spikes/<slug>/JOURNAL.md` — the [proof of concept](spikes/proof-of-concept/JOURNAL.md) so far |
| Coverage-audit sweeps | [`kb/process/coverage-audit.md`](kb/process/coverage-audit.md) |

**Starting a session:** read the [handoff](kb/process/handoff.md), then the
[roadmap](kb/process/roadmap.md), then the next work item's *AI PDLC Prompt*
([which one](../../kb/pdlc/work-items.md#which-item-is-next)).
**Ending one that changed anything:** follow
[closing a session](../../kb/pdlc/journals.md#closing-a-session). **At a milestone exit:** apply
the milestone tier of the [definition of done](kb/process/definition-of-done.md) (which extends
the repo's), ending with the owner check-in. **Found a gap in the method itself** (not in this
project)? It goes to the harness backlog — see
[the first session in a new project](../CLAUDE.md#the-first-session-in-a-new-project).

## Conventions

- **OKF hygiene:** `okf_version` only in `kb/index.md`; subdirectory `index.md` files are pure
  tables of contents; every content file has `type/title/description/resource/tags/timestamp`
  frontmatter. Validate `projects/garbage-day/kb/` with the project
  [gates](../../kb/pdlc/definition-of-done.md#gates).
- **Code gates** (from `projects/garbage-day/`, before every commit that touches `src/` or a
  workspace config): `pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker && pnpm build`,
  defined in [stack and CI](kb/design/stack-and-ci.md#code-gates). Run pnpm through Corepack or
  as `npx pnpm@12.8.1`; the version is pinned in `package.json`.
- **Dependencies stay current.** Newest versions unless an exception is recorded in
  [stack and CI](kb/design/stack-and-ci.md#exceptions-to-latest) with the condition for lifting it.
- **Document as you go.** Keep `kb/`, `README.md`, and `version.json` current as the project
  evolves.

## Related

- Rules for every project, including how this one was created: [`/projects/CLAUDE.md`](../CLAUDE.md)
- Projects index KB: [`/projects/kb/index.md`](../kb/index.md)
