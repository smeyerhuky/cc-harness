---
type: "Policy"
title: "Branch Discipline"
description: "Rules for how Claude sessions use the designated development branch — develop there, commit there, push there, never elsewhere without explicit permission."
resource: "session-instructions:2026-07-15"
tags: ["git", "branches", "policy"]
timestamp: "2026-07-15"
---

# Branch Discipline

## The rule

Every Claude session in this repo is given a **designated branch** (e.g. `claude/hello-world-215aqu`) as part of its session instructions. All development, commits, and pushes for the session go to that branch. Do not push to a different branch — including `main` or another feature branch — without the user's explicit permission.

If the designated branch does not exist locally yet, create it. If it does exist, keep working on it.

## What this covers

- **Develop** all your changes on the designated branch.
- **Commit** with clear messages ([commit-etiquette](commit-etiquette.md)).
- **Push** to that branch when your changes are complete ([push-and-retry](push-and-retry.md)).
- **Create** the branch locally if it doesn't exist yet.
- **Never** push to a different branch without asking.

## Why this matters

The user coordinates their review, CI, and merge tooling around the branch name they gave the session. A session that "helpfully" pushes to `main` or invents a new branch name breaks that coordination — sometimes silently, sometimes destructively.

## Related

- If a PR for the designated branch has already been merged, do not stack new commits on it — see [merged-pr-followups](merged-pr-followups.md).
- The branch discipline is enforced regardless of platform target — see [concepts/deploy-lifecycle](../concepts/deploy-lifecycle.md) stages 5–6 for where this fits in the overall deploy flow.
