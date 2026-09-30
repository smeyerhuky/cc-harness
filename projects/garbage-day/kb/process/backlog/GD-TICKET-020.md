---
type: "Work Item"
title: "GD-TICKET-020: Run the browser replays in Playwright's container image"
description: "Run CI's test-browser job in Playwright's official image, pinned by digest, instead of installing the browsers and their system libraries on the runner every time, and have Renovate update the image and the workspace's Playwright together."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "engine", "ci"]
timestamp: "2026-09-30"
state: "done"
milestone: "M1"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
  - type: DEPENDS_ON
    target: GD-TICKET-019.md
---

# GD-TICKET-020: Run the browser replays in Playwright's container image

## Description

Found while driving pull request #10 for [`GD-TICKET-011`](GD-TICKET-011.md). On `903e743`,
`test-browser` was cancelled at its 15-minute timeout in both runs, so `garbage-day-ok` failed.
The tests never started: `playwright install --with-deps chromium firefox webkit` was still
downloading the browsers' system libraries from the Ubuntu mirror at about 90 KB/s. One 13.6 MB
package took 2.5 minutes. The job [`GD-TICKET-019`](GD-TICKET-019.md) added reinstalled a few
hundred megabytes on every run, so any slow mirror could turn the required check red.

## Acceptance Criteria

- `test-browser` runs in `mcr.microsoft.com/playwright` at the workspace's Playwright version,
  pinned by digest like the actions, as user 1001 (Playwright's CI docs), with no browser or apt
  install step.
- The job, run in that image as user 1001 on a clean copy of the branch, installs with the frozen
  lockfile and passes all three browsers.
- Renovate updates the image and the `playwright` package in one group, so the two versions
  can't drift apart.
- `stack-and-ci.md` describes the job; CI is green on the pull request.

## Linked Artifacts

- [Stack and CI — the pipeline](../../design/stack-and-ci.md#the-pipeline),
  [`GD-TICKET-019`](GD-TICKET-019.md)
- Playwright's docs: CI ("Via Containers") and Docker ("Image tags")

## AI PDLC Prompt

Goal: make `test-browser` independent of the Ubuntu mirror. Read the job in
`.github/workflows/garbage-day.yml`, `renovate.json`, and `kb/design/stack-and-ci.md` ("The
pipeline"). Move the job into Playwright's image at the workspace's version, pinned by digest,
and drop the install step. Group the image with `playwright` in Renovate. Run the job's steps in
the image locally if Docker is available. Done when the criteria hold, the KB gates pass, this
item is `done` with a Resolution, and the journal records it.

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md). `test-browser` now runs in
`mcr.microsoft.com/playwright:v1.63.0-noble`, pinned to digest `sha256:eff16c30…a4a27`, with
`options: --user 1001` as Playwright's CI docs show, and the `playwright install --with-deps` step
is gone. The image holds Node 24.20, git, and exactly the browser builds Playwright 1.63.0 expects
(Chromium 1243, Firefox 1543, WebKit 2359) under `/ms-playwright`.

Checked before pushing, with Docker in the session container: the image pulled in 39 seconds. As
user 1001, a clean `git archive` of the branch installed with `--frozen-lockfile` and ran
`pnpm test:browser` green: 30 tests, ten golden replays in each browser, 21 seconds end to end.
`renovate.json` gains a `playwright` group matching `playwright` and `mcr.microsoft.com/playwright`,
placed after the GitHub Actions group so it wins for the image. Renovate's validator accepts the
config, and actionlint is clean.
