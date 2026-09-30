---
type: "Work Item"
title: "GD-TICKET-011: Deploy the app shell with preview and production pipelines"
description: "Stand up the app package (a React shell page, the Worker serving static assets with an SPA fallback, empty Lobby and Match Durable Object classes with SQLite migrations) and add the preview-per-PR and production-on-main deploy jobs."
resource: "../../design/stack-and-ci.md"
tags: ["backlog", "deploy"]
timestamp: "2026-09-30"
state: "active"
milestone: "M1"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../../design/stack-and-ci.md
  - type: DEPENDS_ON
    target: GD-TICKET-007.md
  - type: DEPENDS_ON
    target: GD-TICKET-010.md
---

# GD-TICKET-011: Deploy the app shell with preview and production pipelines

## Description

Proves the whole path from commit to a live URL before any game code depends on it
([stack and CI — deployment](../../design/stack-and-ci.md#deployment)).

## Acceptance Criteria

- `src/app` builds a React 19 shell page (the Garbage Day name in the UI language's type) and a
  Worker that serves it with an SPA fallback; `wrangler.jsonc` declares the Lobby and Match DO
  classes with a first migration using `new_sqlite_classes`.
- `pnpm dev` serves the shell with both DOs running locally in workerd.
- The workflow gains `deploy-preview` (pull requests: `wrangler versions upload`, comment the URL)
  and `deploy-production` (push to `main`, GitHub environment `production`), using the
  `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets.
- The owner has opened the preview URL and the production URL in their own browser and seen the
  shell (a sandboxed session cannot reach `*.workers.dev`).
- Code gates pass.

## Linked Artifacts

- [Stack and CI — deployment](../../design/stack-and-ci.md#deployment)
- Repo deploy KB: `/kb/concepts/deploy-lifecycle.md`, `/kb/platforms/cloudflare-workers-minimal.md`,
  `/kb/platforms/cloudflare-credentials.md`, `/kb/lessons/sandbox-egress-limits.md`

## AI PDLC Prompt

Goal: deploy the app shell with preview and production pipelines. Read
`kb/design/stack-and-ci.md` ("Deployment", "Local development"), `kb/design/architecture.md`
("Components"), and the repo deploy KB files listed above before touching Wrangler. Build the
shell in `projects/garbage-day/src/app/`, verify locally per `/kb/platforms/cloudflare-local-verify.md`,
add the two deploy jobs to `.github/workflows/garbage-day.yml`, and ask the owner to add the two
secrets and open both URLs. Done when the criteria hold (including the owner's confirmation,
recorded in the journal), the KB and code gates pass, this item is `done` with a Resolution, the
backlog index and roadmap agree, and the journal records it.

## Progress

The owner added the `CLOUDFLARE_API_TOKEN` (an account API token from the "Edit Cloudflare
Workers" template, one account, expiring 2026-12-29) and `CLOUDFLARE_ACCOUNT_ID` repository
secrets on 2026-09-30, so the item is active again: the next run deploys the first preview.
Before that, everything that needed no Cloudflare account was done and verified:

- **The shell.** `src/app/worker/index.ts` has the Worker and the `LobbyDO` and `MatchDO`
  classes; `/api/health` answers from both over RPC. `src/app/wrangler.jsonc` sets the asset SPA
  fallback, both DO bindings, the first migration with `new_sqlite_classes`, and a `previews`
  block. The React page shows the name in Big Shoulders Display (self-hosted through the `ui`
  package's `fonts.css`) and a status line read from `/api/health` with `use()`.
- **Local verify, per the repo's deploy KB.** `vite dev` and `vite preview` of the production
  build both ran the Worker and both DOs in workerd. `curl` got health from both DOs, the page,
  the SPA fallback for `/g/GD-7KQ4`, the font as `font/woff2`, and 404 for `/api/nope` and
  `/ws/lobby`. Headless Chromium screenshots at desktop and phone width, light and dark, show the
  page as designed.
- **Tests.** 4 Worker tests run inside workerd (`pnpm test:worker`), and 4 client tests.
- **CI.** `deploy-preview` (a Worker Preview per pull request, with its URL commented),
  `deploy-production` (`main`, GitHub environment `production`), and
  `garbage-day-preview-cleanup.yml`. Each skips with a notice while the secrets are missing.

Waiting on the owner:

1. ~~Add the repository secrets~~ (done 2026-09-30).
2. Open the preview URL that `deploy-preview` then comments on the pull request, and the
   production URL after the first push to `main`, which means merging. Say whether both show the
   shell with "Server ready".

Found on the way, fixed inside this item and recorded in
[stack and CI](../../design/stack-and-ci.md):

- **Preview design.** Cloudflare makes no version URL for a Worker with Durable Objects, so the
  design's `wrangler versions upload` preview could never work. Worker Previews replace it.
- **Test pool.** `@cloudflare/vitest-pool-workers` stopped at 0.22.0 (August), and its bundled
  runtime rejects the compatibility date. It was renamed `@cloudflare/vitest-plugin` (1.3.1 used).
- **Build allowlist.** pnpm 11 renamed `onlyBuiltDependencies` to `allowBuilds`; the scaffold's
  setting was being ignored. It is now `allowBuilds: { esbuild, workerd }`.
- **Audit.** Wrangler's miniflare pinned `undici` 7.29.0, with ten advisories. A recorded override
  sets 7.29.1 until Wrangler 4.143.1 or later is in.
