---
type: "Work Item"
title: "GD-TICKET-034: Clear the dependency audit's new advisories"
description: "Advisories published after main's last green run turned CI's audit job red on every pull request: Vite, source-map-js and sharp under the Cloudflare tooling, then Vitest's mocker. Move each to a fixed release at least a day old, the Cloudflare tooling as a matched set."
resource: "../journal/2026-10-22-audit-deps.md"
tags: ["backlog", "dependencies", "security"]
timestamp: "2026-10-22"
state: "done"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-10-22-audit-deps.md
---

# GD-TICKET-034: Clear the dependency audit's new advisories

## Description

Found while opening pull request #18 ([`GD-TICKET-017`](GD-TICKET-017.md)). Its `audit` job
(`pnpm audit --audit-level moderate`) failed on advisories that had appeared since `main`'s
last green run, in packages the pull request didn't touch. `main` fails the same way, so every
pull request is blocked until they are fixed. The owner asked for the fix in a pull request of
its own, with #18 rebased on top of it.

On 2026-10-21 the audit found five advisories:

- three in Vite 8.3.1 (`launch-editor`: 1 high, 2 moderate), fixed in 8.3.3;
- one in `source-map-js` 1.2.1 under PostCSS (high), fixed in 1.2.2;
- one in `sharp` 0.35.4 (high, a librsvg CVE), fixed in 0.35.5. Miniflare pins `sharp` exactly.

By 2026-10-22 two more had appeared, in `@vitest/mocker` 4.1.11 (moderate), fixed in 4.1.12.

## Acceptance Criteria

- `pnpm audit --audit-level moderate` is clean, with no override.
- Every version is the newest fixed release at least a day old.
- Wrangler, `@cloudflare/vite-plugin` and `@cloudflare/vitest-plugin` are a matched set, both
  plugins pinning the same Wrangler.
- The stack table and its exceptions in [stack and CI](../../design/stack-and-ci.md) show the
  new versions.
- The code gates and the browser suites pass. CI, the preview and the production deploy are
  green.

## Linked Artifacts

- [Stack and CI](../../design/stack-and-ci.md), [`GD-TICKET-021`](GD-TICKET-021.md) (the
  last Cloudflare tooling move)

## AI PDLC Prompt

Goal: a clean dependency audit. Read `kb/design/stack-and-ci.md` ("The stack", "Exceptions to
latest"). Move each flagged package to its newest fixed release at least a day old, keeping
the Cloudflare tooling a matched set. Done when the criteria hold, the code and KB gates pass,
this item is `done` with a Resolution, the backlog index and roadmap agree, and the journal
records it.

## Resolution

Done in [the audit session](../journal/2026-10-22-audit-deps.md), on its own branch
(`gd-ticket-034-audit-deps`) and pull request, with #18 rebased on top.

- **Vite 8.3.1 → 8.3.4.** 8.3.5 was under a day old.
- **The Cloudflare tooling moved as a matched set:**
  - Wrangler 4.143.1 → 4.151.0;
  - `@cloudflare/vite-plugin` 1.62.1 → 1.64.0, the newest, which pins Wrangler 4.151.0;
  - `@cloudflare/vitest-plugin` 1.3.2 → 1.4.3, the newest that pins Wrangler 4.151.0;
  - `@cloudflare/workers-types` → 5.20261021.1.

  Their miniflare, 5.20261012.0-beta, pins `sharp` 0.35.5. Wrangler 4.151.3 was a day old, but
  no Vite plugin pins it, so it would have brought a second Wrangler and miniflare.
- **Vitest and `@vitest/browser-playwright` 4.1.11 → 4.1.12.** The test plugin 1.4 also accepts
  Vitest 5, which lifts the recorded blocker on the Vitest hold-back. Moving to Vitest 5 is a
  major upgrade and is left to Renovate's pull request.
- **`source-map-js` → 1.2.2** in the lockfile, within PostCSS's range.
- **No override.** `compatibility_date` stays 2026-09-26, which the newer runtime supports.
- **Checks:** the audit reports no known vulnerabilities, and the gates and browser suites pass
  (the journal has the counts).
