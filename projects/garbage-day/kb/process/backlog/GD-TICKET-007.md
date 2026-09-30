---
type: "Work Item"
title: "GD-TICKET-007: Add the GitHub Actions pipeline"
description: "Create .github/workflows/garbage-day.yml with the jobs and required checks from stack-and-ci.md (kb, lint, typecheck, test, test-worker, audit, build, dependency review, CodeQL), path-filtered to the project."
resource: "../../design/stack-and-ci.md"
tags: ["backlog", "ci"]
timestamp: "2026-09-30"
state: "open"
milestone: "M1"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../../design/stack-and-ci.md
  - type: DEPENDS_ON
    target: GD-TICKET-006.md
---

# GD-TICKET-007: Add the GitHub Actions pipeline

## Description

The pipeline in [stack and CI](../../design/stack-and-ci.md#the-pipeline), minus the deploy and
end-to-end jobs, which arrive with the app shell (GD-TICKET-011) and M3.

## Acceptance Criteria

- `.github/workflows/garbage-day.yml` runs on pushes and pull requests touching
  `projects/garbage-day/**` with jobs `install`, `lint`, `typecheck`, `test`, `test-worker`,
  `audit`, `build` and `kb` (the repo's KB gates on `projects/garbage-day/kb/` and
  `projects/kb/`), using `pnpm install --frozen-lockfile` and a cached pnpm store.
- Dependency review runs on pull requests; CodeQL (JavaScript/TypeScript) runs on pull requests and
  weekly.
- A pull request from this item shows every job green.
- `stack-and-ci.md` lists the required checks exactly as configured, and says which ones the
  owner must mark required in the repository settings (an agent session cannot).

## Linked Artifacts

- [Stack and CI — the pipeline](../../design/stack-and-ci.md#the-pipeline)
- Repo git protocol: `/kb/process/`

## AI PDLC Prompt

Goal: add Garbage Day's CI workflow. Read `kb/design/stack-and-ci.md` ("The pipeline",
"Dependency security", "Code gates") and the KB gate commands in `/kb/pdlc/definition-of-done.md`
("Gates"). Write `.github/workflows/garbage-day.yml` (plus the dependency-review and CodeQL
workflows if kept separate) with pinned action versions (full commit SHAs), least-privilege
`permissions:`, and path filters. Push on the session branch and open a pull request only if the
owner asks; otherwise verify with the workflow's first run on the branch. Update
`stack-and-ci.md` if anything had to change. Done when the criteria hold, the KB gates pass, this
item is `done` with a Resolution, the backlog index and roadmap agree, and the journal records it.
