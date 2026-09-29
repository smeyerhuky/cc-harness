---
type: "Work Item"
title: "HW-TICKET-002: The greeting names the harness"
description: "Change the Worker's response from its old greeting to `hello world from cc-harness`, so the demo names the repo it ships in."
resource: "../journal/2026-09-29-greeting.md"
tags: ["backlog", "deploy"]
timestamp: "2026-09-29"
state: "done"
milestone: "M1"
relationships:
  - type: DERIVED_FROM
    target: ../journal/2026-09-29-greeting.md
---

# HW-TICKET-002: The greeting names the harness

## Description

The Worker's one-line greeting named a different repo. The owner asked for it to name this one.

## Acceptance Criteria

- `src/index.js` returns `hello world from cc-harness\n` with status 200; nothing else changes.
- The project gates pass.

## Linked Artifacts

- `projects/hello-worker/src/index.js`
- [The journal entry this traces to](../journal/2026-09-29-greeting.md)

## AI PDLC Prompt

Goal: change the string returned by `src/index.js` to `hello world from cc-harness\n` and nothing
else. Verify it locally with `wrangler dev` and `curl`, as this project's definition of done
requires, and paste the output. Do not deploy; that is the owner's call. Done
when the output matches, the project gates pass, this item is `done` with a Resolution, and the
roadmap, backlog index, handoff, and running journal agree.

## Resolution

Done 2026-09-29. The greeting in `src/index.js` changed; nothing else in the code did. Verified
locally with `wrangler dev` (wrangler 4.143.0) and `curl`: `GET / 200`, body
`hello world from cc-harness`; the `.wrangler/` cache stayed ignored. Not redeployed.
