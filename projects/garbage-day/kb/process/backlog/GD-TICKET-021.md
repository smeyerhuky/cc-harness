---
type: "Work Item"
title: "GD-TICKET-021: Take the next Cloudflare tooling set and delete the undici override"
description: "Move Wrangler, the Vite plugin, the Workers test plugin and the Worker types to the newest matched set at least a day old, which brings miniflare's own fixed undici, and delete the security override that stood in for it."
resource: "../coverage-audit.md"
tags: ["backlog", "dependencies", "security"]
timestamp: "2026-09-30"
state: "open"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-021: Take the next Cloudflare tooling set and delete the undici override

## Description

Found by the [coverage audit of the M1 exit](../coverage-audit.md). The Wrangler 4.143.0 pinned by
[`GD-TICKET-011`](GD-TICKET-011.md) brings a miniflare that pins `undici` 7.29.0, which has ten
advisories. `pnpm-workspace.yaml` overrides it to 7.29.1, and
[stack and CI](../../design/stack-and-ci.md#exceptions-to-latest) says to delete the override
"once Wrangler 4.143.1 or later is in". Nothing carried that step. Renovate's `cloudflare` group
will propose the newer Wrangler, but it never deletes an override, so it would stay forever.

## Acceptance Criteria

- Wrangler, `@cloudflare/vite-plugin`, `@cloudflare/vitest-plugin` and
  `@cloudflare/workers-types` are at the newest matched set at least a day old: the Vite plugin
  and the test plugin pin the same Wrangler. Renovate's `cloudflare` group pull request is used
  if it exists.
- The `undici` entry is gone from `overrides` in `pnpm-workspace.yaml`, the lockfile resolves
  miniflare's own `undici` at 7.29.1 or later, and `pnpm audit --audit-level moderate` is clean.
- `compatibility_date` is checked against the new runtime, and the Worker tests pass in it.
- The `undici` row leaves the exceptions table in `stack-and-ci.md`, and the stack table shows
  the new versions.
- The code gates pass; CI, the preview and the production deploy are green.

## Linked Artifacts

- [Stack and CI — exceptions to "latest"](../../design/stack-and-ci.md#exceptions-to-latest),
  [dependency security](../../design/stack-and-ci.md#dependency-security)
- [Coverage audit — M1 exit](../coverage-audit.md)

## AI PDLC Prompt

Goal: take the next matched Cloudflare tooling set and delete the `undici` override. Read
`kb/design/stack-and-ci.md` ("The stack", "Exceptions to latest", "Dependency security"),
`pnpm-workspace.yaml` and `src/app/package.json`. Check each package's newest version against the
npm registry, keeping to releases at least a day old, and pick a set whose plugins pin the same
Wrangler. Update, delete the override, run `pnpm install`, then `pnpm why undici` and
`pnpm audit`. Run the code gates (`pnpm lint && pnpm typecheck && pnpm test && pnpm test:worker
&& pnpm build`). Done when the criteria hold, the KB gates pass, this item is `done` with a
Resolution, the backlog index agrees, and the journal records it.
