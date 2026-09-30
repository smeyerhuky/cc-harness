---
type: "Work Item"
title: "GD-TICKET-006: Scaffold the pnpm workspace with the pinned stack"
description: "Create the workspace (engine, protocol, ui, app packages), pin the stack from stack-and-ci.md at the newest compatible versions, and set up TypeScript, ESLint, Prettier, Knip, Renovate and supply-chain settings, with a clean audit and a committed lockfile."
resource: "../../design/stack-and-ci.md"
tags: ["backlog", "build"]
timestamp: "2026-09-30"
state: "done"
milestone: "M1"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../../design/stack-and-ci.md
---

# GD-TICKET-006: Scaffold the pnpm workspace with the pinned stack

## Description

The first code in the project. It creates the workspace layout from
[stack and CI](../../design/stack-and-ci.md#workspace-layout) with empty but compiling packages,
so every later item adds code to a place that already lints, typechecks and tests.

## Acceptance Criteria

- `projects/garbage-day/` has `package.json`, `pnpm-workspace.yaml` (with `minimumReleaseAge` and
  `onlyBuiltDependencies`), `pnpm-lock.yaml`, `tsconfig.base.json`, `eslint.config.js`,
  `.prettierrc`, `knip.json`, and packages `src/engine`, `src/protocol`, `src/ui`, `src/app` with
  one trivial source file and one passing test each.
- Every dependency is at its newest version on the day of the change, except the two documented
  exceptions; any new deviation is added to the exceptions table in `stack-and-ci.md` with its
  reason (definition of done, dependency tier).
- `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass; `pnpm audit --audit-level
  moderate` is clean; the lockfile is committed.
- A Renovate config (`renovate.json` at the repo root, scoped to `projects/garbage-day/`) groups
  weekly updates and automerges patches when CI is green.
- The project `CLAUDE.md` structure block and `README.md` getting-started section describe the
  real layout and commands.

## Linked Artifacts

- [Stack and CI](../../design/stack-and-ci.md), [client architecture](../../design/client-architecture.md#packages-and-folders)

## AI PDLC Prompt

Goal: scaffold Garbage Day's pnpm workspace. Read `projects/garbage-day/CLAUDE.md`,
`kb/design/stack-and-ci.md` and `kb/design/client-architecture.md` ("Packages and folders").
Before pinning, run `npm view <pkg> version` and check peer dependencies for every package in the
stack table; use the newest compatible versions and record any change to the table. Create the
files in the acceptance criteria under `projects/garbage-day/` (Node 24, pnpm 12, TypeScript
project references, ESLint flat config with `typescript-eslint` and `eslint-plugin-react-hooks`,
Prettier, Knip), plus `renovate.json` at the repo root. Keep packages empty apart from one
trivial module and one test each. Run the commands in the acceptance criteria and paste their
output into the session journal. Done when the criteria hold, the KB gates pass
(`/kb/pdlc/definition-of-done.md`, "Gates"), this item is `done` with a Resolution, the backlog
index and roadmap agree, and the running-journal entry records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). The workspace has the four
packages, each with one module and one passing test (`mulberry32` in engine, the message
envelope in protocol, `Kbd` in ui, `App` in app), and the root configs from the criteria;
`renovate.json` is at the repo root and passed Renovate's config validator. Gate output is in
the journal entry: lint, typecheck, test (4 files, 7 tests) and build pass, `pnpm audit
--audit-level moderate` finds nothing, and the lockfile is committed. The React Compiler is
active in the build, and the hooks lint rejects a conditional hook.

Deviations, each recorded in [stack and CI](../../design/stack-and-ci.md):

- **Cloudflare packages wait for `GD-TICKET-011`.** Wrangler, the Vite plugin and the Worker
  types were under a day old, so `minimumReleaseAge` refused them; nothing needs them yet.
  `pnpm test:worker` prints a placeholder until the first Durable Object test.
- **No project references.** Packages export TypeScript source, so the typecheck runs
  `tsc --noEmit -p` per package instead of `tsc -b`.
- **Added packages** not in the design's table: `@babel/core` and `@rolldown/plugin-babel` (the
  React Compiler's route under `@vitejs/plugin-react` 6), `@eslint/js`, `globals`, `@types/node`.
- **File names:** `.prettierrc.json` (the criteria said `.prettierrc`), plus a root
  `tsconfig.json` that ESLint's project service needs for the root Vitest config.

Needs the owner: Renovate reads `renovate.json` only once the Renovate GitHub app is installed on
the repository.
