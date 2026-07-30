---
type: "Policy"
title: "Follow-up Work on a Merged PR"
description: "A merged PR is finished — do not reuse its branch to track new work. Restart from the default branch on the same branch name."
resource: "session-instructions:2026-07-15"
tags: ["git", "pull-requests", "policy"]
timestamp: "2026-07-15"
---

# Follow-up Work on a Merged PR

## The rule

If the pull request for your designated branch has already been merged, treat follow-up work as a fresh change. **A merged PR is finished** — it cannot track new work and must not be reused. Never stack new commits on top of the already-merged history.

## The procedure

Restart your designated branch from the latest default branch — keep the same branch name — and push the follow-up work there:

```bash
git fetch origin <default-branch>
git checkout -B <branch-name> origin/<default-branch>
```

Any pull request opened for the restarted branch is a **new** pull request, not the merged one. Do not attempt to reopen the merged PR.

A force-with-lease push is fine when the branch contains only already-merged history:

```bash
git push --force-with-lease -u origin <branch-name>
```

## If the branch has unmerged commits beyond the merged history

If your designated branch already carries additional unmerged work beyond what was in the merged PR (e.g. you started follow-up work before checking on the PR's merge status), keep those commits — rebase them onto the new base instead of discarding them:

```bash
git fetch origin <default-branch>
git rebase --onto origin/<default-branch> <merge-base-of-merged-pr>
```

Never use `--no-edit` with `git rebase` — it isn't a valid option and the flag is a common mistake.

## Why

A merged PR is a closed record of work that was reviewed and shipped. GitHub does not track further commits pushed to its branch as part of the same review; those commits become dangling relative to the merged PR and confuse tooling. A fresh PR gets its own review, its own CI, its own merge event.

## Related

- [Branch discipline](branch-discipline.md) — the branch name never changes even across restarts.
- [PR creation](pr-creation.md) — the follow-up work still doesn't get a PR unless the user asks.
- [Push and retry](push-and-retry.md) — network-error retries still apply after `--force-with-lease`; other failures still don't.
