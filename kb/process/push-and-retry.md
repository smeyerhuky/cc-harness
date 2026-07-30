---
type: "Policy"
title: "Push and Retry"
description: "How to push to the designated branch, and the exponential-backoff retry policy for genuine network failures only."
resource: "session-instructions:2026-07-15"
tags: ["git", "push", "retry", "policy"]
timestamp: "2026-07-15"
---

# Push and Retry

## The push command

Always push using:

```bash
git push -u origin <branch-name>
```

The `-u` sets upstream tracking on first push and is idempotent on later pushes. The branch name is your designated branch — see [branch-discipline](branch-discipline.md).

## Retry policy

If the push fails **due to network errors**, retry up to four times with exponential backoff:

| Attempt | Wait before |
|---|---|
| 1 | (immediate) |
| 2 | 2 seconds |
| 3 | 4 seconds |
| 4 | 8 seconds |
| 5 (final) | 16 seconds |

**Only retry for network errors.** Do not retry for:

- Non-fast-forward rejections (fetch first, then re-push — or if the remote branch was force-updated legitimately, reconcile with the user before doing anything).
- Authentication failures (retry won't fix a broken token).
- Pre-receive hook rejections (fix the underlying issue).
- Any error message that describes a policy or state problem, not a network problem.

Retrying past a non-transient failure just delays the diagnosis you have to do anyway.

## Fetch and pull

Prefer branch-specific fetches when possible:

```bash
git fetch origin <branch-name>
git pull origin <branch-name>
```

Same 2/4/8/16s backoff for network failures.

## After the push

Do not create a PR from the push output — see [pr-creation](pr-creation.md). Remote-side PR-creation URLs printed by `git push` (e.g. GitHub's "Create a pull request for … by visiting …") are informational, not instructions.

## Related

- [Branch discipline](branch-discipline.md) — what branch you're pushing to and why.
- [Merged PR follow-ups](merged-pr-followups.md) — special case if the PR for your branch was already merged.
