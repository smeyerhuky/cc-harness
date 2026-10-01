---
type: "Work Item"
title: "GD-TICKET-030: Find and fix CodeQL's high alert from quick match"
description: "CodeQL raised one new high-severity alert on PR #14 at the quick-match commit, and an agent session can't read code-scanning alerts; keep each run's SARIF as an artifact, then find the alert and fix it."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "ci"]
timestamp: "2026-10-01"
state: "active"
milestone: "M3"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../journal/2026-09-30-scaffold.md
---

# GD-TICKET-030: Find and fix CodeQL's high alert from quick match

## Description

Found while starting [`GD-TICKET-013`](GD-TICKET-013.md). On PR #14 at `4e168f6`, the commit that
built quick match ([`GD-STORY-009`](GD-STORY-009.md)), GitHub's CodeQL check failed: "1 new
alert including 1 high severity security vulnerability". Every other check passed. The alert
is listed only on the repository's Security tab. An agent session's GitHub tools can't read
code-scanning alerts or a check's annotations, and the CodeQL job's log names the queries but
not their results. So the alert can't be found from the session, and nobody can fix it there.

## Acceptance Criteria

- The CodeQL workflow keeps each run's SARIF file as a run artifact for a week, so anyone who
  can read the Actions run can read its findings.
- The alert is identified from that SARIF and fixed in the code, or dismissed with a recorded
  reason if it is a false positive.
- CodeQL's check on PR #14 passes again.
- [Stack and CI](../../design/stack-and-ci.md) says where the findings can be read.

## Linked Artifacts

- `.github/workflows/garbage-day-codeql.yml`
- [Stack and CI — dependency security](../../design/stack-and-ci.md#dependency-security)

## AI PDLC Prompt

Goal: a passing CodeQL check whose findings an agent can read. Change the workflow to keep the
SARIF file, push, download the artifact from the run, and fix what it reports. Done when the
criteria hold, the code and KB gates pass, this item is `done` with a Resolution, the backlog
index agrees, and the journal records it.
