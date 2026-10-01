---
type: "Work Item"
title: "GD-TICKET-030: Find and fix CodeQL's high alert from quick match"
description: "CodeQL raised one new high-severity alert on PR #14 at the quick-match commit, and an agent session can't read code-scanning alerts; keep each run's SARIF as an artifact, then find the alert and fix it."
resource: "../journal/2026-09-30-scaffold.md"
tags: ["backlog", "ci"]
timestamp: "2026-10-01"
state: "done"
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

## Resolution

Done in [the scaffold session](../journal/2026-09-30-scaffold.md).

- **Reading the findings.** The CodeQL workflow now keeps each run's SARIF as the
  `codeql-sarif` artifact for a week (`output:` on the analyze step, then
  `actions/upload-artifact`, pinned by SHA). An agent session downloads it through the Actions
  API it can reach. [Stack and CI](../../design/stack-and-ci.md#dependency-security) says so.
- **The alert:** `js/biased-cryptographic-random` (security severity 7.5). It traced the Match
  DO's crypto-random seed (`worker/match.ts`) into `mulberry32`'s additions (`engine/src/rng.ts`,
  line 13).
- **Bias is not the problem.** Seeding a generator isn't drawing a number in a range. The
  real weakness is that a 32-bit seed is guessable. A player can try all 2³² seeds against the
  three or so bags they have seen, and the match is then known to its end. That defeats the
  hidden next pieces (PRD US-06).
- **The fix.** The engine gains xoshiro128** (`xoshiro128ss`), checked against the reference
  implementation's outputs. A dealing seed is now a `Seed`: a number (mulberry32, as before) or
  128 bits (xoshiro128**); `seeded(seed, salt)` builds either. The Dealer and the referee's
  snapshot take either. The Match DO deals from four crypto-random words, which never leave
  it. Local matches and the golden replays keep their 32-bit seeds and didn't change. The
  [determinism contract](../../design/architecture.md#determinism-contract) says why.
- xoshiro128** uses no addition, multiplication or modulo, so CodeQL's flow ends there; nothing
  had to be suppressed.

Checks:

- 6 new engine tests:
  - xoshiro128** against the reference outputs for two seeds;
  - it never sticks at zero, and stays in [0, 1);
  - `seeded` is mulberry32 salted as before for a number, and xoshiro128** for 128 bits;
  - a Dealer on 128 bits deals true bags, the same for the same seed;
  - a 128-bit seed survives a referee snapshot.
- The code gates pass.
- CodeQL's check on PR #14 passed at `f588680`, with no alerts.
