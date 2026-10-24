---
type: "Work Item"
title: "GD-TICKET-035: Clear the audit again, with overrides where Cloudflare pins the flaw"
description: "New advisories in zod, happy-dom and undici failed main's audit, so neither pull request #20 nor #18 deployed. Zod and happy-dom move to fixed releases; the copies of undici and zod that Cloudflare's test tooling pins exactly are overridden until it ships the fixes."
resource: "../journal/2026-10-24-audit-overrides.md"
tags: ["backlog", "dependencies", "security"]
timestamp: "2026-10-24"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-10-24-audit-overrides.md
---

# GD-TICKET-035: Clear the audit again, with overrides where Cloudflare pins the flaw

## Description

Found when pull request #18 merged on 2026-10-24. The merge's `audit` job failed, so the build
and the production deploy were skipped. The same job had already failed on #20's merge on
2026-10-22. Production is still on `54e2ff9` (2026-10-02), with neither
[`GD-TICKET-034`](GD-TICKET-034.md) nor [`GD-TICKET-017`](GD-TICKET-017.md) in it.

`pnpm audit --audit-level moderate` found five advisories:

- **zod 4.6.5** (high: memory exhaustion validating oversized constrained collections), fixed in
  4.6.6. Zod is a production dependency: the Worker validates every incoming message with it.
  `@cloudflare/vitest-plugin` pins zod 4.6.5 exactly, up to its newest release (1.4.7).
- **happy-dom 20.14.5** (high: an incomplete fix for CVE-2026-33943). It is fixed only in
  21.0.4. Every 20.x release is affected.
- **undici 7.29.1** under miniflare (one high, two moderate), fixed in 7.30.1. Every Cloudflare
  tooling set up to the Vite plugin 1.65.0 (Wrangler 4.152.0, 2026-10-23) pins it.

## Acceptance Criteria

- `pnpm audit --audit-level moderate` is clean.
- Each package is on its newest fixed release at least a day old, where one can be reached.
- Where Cloudflare's tooling pins the vulnerable version exactly, an override forces the fix.
  Each override is commented in `pnpm-workspace.yaml` and listed in
  [stack and CI](../../design/stack-and-ci.md#exceptions-to-latest), with when to delete it.
- The code gates and the browser suites pass. CI is green on `main`, and the production
  deploy runs.

## Linked Artifacts

- [Stack and CI](../../design/stack-and-ci.md), [`GD-TICKET-034`](GD-TICKET-034.md),
  [`GD-TICKET-021`](GD-TICKET-021.md) (the last `undici` override, and its deletion)

## AI PDLC Prompt

Goal: a clean dependency audit, so `main` deploys again. Read `kb/design/stack-and-ci.md`
("The stack", "Exceptions to latest"). Done when the criteria hold, the code and KB gates pass,
this item is `done` with a Resolution, the backlog index and roadmap agree, and the journal
records it.

## Resolution

Done in [the session of 2026-10-24](../journal/2026-10-24-audit-overrides.md), on its own branch
(`gd-ticket-035-audit-overrides`) and pull request, as the owner asked for `GD-TICKET-034`.

- **zod 4.6.5 → 4.6.7** in `@garbage-day/protocol`, which the Worker runs.
- **happy-dom 20.14.5 → 21.0.4**, a major version. The tests needed no change.
- **Two overrides** in `pnpm-workspace.yaml`, both under Cloudflare test or dev tooling that
  pins the flawed version exactly:
  - `undici: 7.30.1` (miniflare pins 7.29.1);
  - `zod: 4.6.7` (`@cloudflare/vitest-plugin` pins 4.6.5).

  Both are listed in stack and CI's exceptions, to be deleted once a Cloudflare matched set
  brings the fix. No Cloudflare release had done so on 2026-10-24.
- **Checks:** the audit reports no known vulnerabilities, and the gates and browser suites pass
  (the journal has the counts).
