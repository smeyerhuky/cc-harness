---
type: "Work Item"
title: "GD-TICKET-004: Choose the tech stack and design the build and CI pipeline"
description: "Write kb/design/stack-and-ci.md: languages, packages and tools, the repository layout, local development and testing, the GitHub Actions pipeline, and deployment to Cloudflare with preview and production environments."
resource: "../../product/prd.md"
tags: ["backlog", "design", "deploy"]
timestamp: "2026-09-30"
state: "open"
milestone: "M0"
relationships:
  - type: DERIVED_FROM
    target: ../../product/prd.md
  - type: DEPENDS_ON
    target: GD-TICKET-002.md
---

# GD-TICKET-004: Choose the tech stack and design the build and CI pipeline

## Description

The owner accepted these defaults: TypeScript; a shared engine package used by the client, the
Match DO and the bot; Vite for the client; a Worker with Durable Objects deployed with Wrangler;
Vitest with the Workers test pool; and GitHub Actions running lint, typecheck, tests, the
engine's replay tests and the repo's KB gates on every pull request, deploying to Cloudflare on
merge to main. This item records those choices with their versions and reasons, and designs the
pipeline in enough detail for the first build milestone to implement it.

## Acceptance Criteria

- `kb/design/stack-and-ci.md` exists with OKF frontmatter and covers: each technology with its
  pinned major version and why; the source layout under `projects/garbage-day/src/` (engine,
  client, worker packages); local development (`wrangler dev` with Durable Objects, two browser
  tabs); the test pyramid (engine unit tests, deterministic replay tests with golden files, DO
  tests in the Workers pool, a browser end-to-end smoke test); the GitHub Actions jobs with their
  order and triggers; deployment (preview per pull request, production on merge, credentials
  as repository secrets), consistent with the repo's deploy KB (`/kb/platforms/`,
  `/kb/lessons/`); and free-plan cost checks.
- It names which checks are required to merge.
- It is linked from `kb/design/index.md`, and the project's `CLAUDE.md` lists the code gates it
  defines.
- The project gates pass.

## Linked Artifacts

- [PRD non-functional requirements](../../product/prd.md#non-functional-requirements)
- [Architecture](GD-TICKET-002.md) (the design this stack implements)
- Repo deploy KB: `/kb/platforms/cloudflare-workers-minimal.md`, `/kb/platforms/cloudflare-local-verify.md`,
  `/kb/lessons/sandbox-egress-limits.md`

## AI PDLC Prompt

Goal: choose Garbage Day's stack and design its build and CI pipeline. Read
`projects/garbage-day/CLAUDE.md`, `kb/product/prd.md` (non-functional requirements),
`kb/design/architecture.md` (written by GD-TICKET-002), and the repo's deploy KB:
`/kb/concepts/deploy-lifecycle.md`, `/kb/platforms/index.md` and the Cloudflare files it lists,
and `/kb/lessons/index.md`. Check current versions of Wrangler, Vite, Vitest and
`@cloudflare/vitest-pool-workers` before pinning. Write `kb/design/stack-and-ci.md` with OKF
frontmatter covering every point in the acceptance criteria; link it from `kb/design/index.md`;
add a "Code gates" line to the project's `CLAUDE.md` naming the checks. Do not create the
workflow files or source packages here; the first build milestone does. Done when the acceptance
criteria hold, the project gates pass (`/kb/pdlc/definition-of-done.md`, "Gates"), this item is
`done` with a Resolution, the backlog index and roadmap agree, and the session's running-journal
entry records it.
