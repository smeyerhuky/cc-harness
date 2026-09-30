---
type: "Work Item"
title: "GD-TICKET-011: Deploy the app shell with preview and production pipelines"
description: "Stand up the app package (a React shell page, the Worker serving static assets with an SPA fallback, empty Lobby and Match Durable Object classes with SQLite migrations) and add the preview-per-PR and production-on-main deploy jobs."
resource: "../../design/stack-and-ci.md"
tags: ["backlog", "deploy"]
timestamp: "2026-09-30"
state: "open"
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
