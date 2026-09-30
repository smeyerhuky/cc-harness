---
type: "Lesson"
title: "A Skipped Job Upstream Skips the Deploy — even behind an always() summary check"
description: "In GitHub Actions a plain job `if:` means `success() && …`, and a skip anywhere up the needs chain carries down to it, through a summary job that runs under always(). Gate deploys on `!cancelled()` and the summary job's result."
resource: "projects/garbage-day/kb/process/journal/2026-09-30-scaffold.md"
tags: ["github-actions", "ci", "deploy", "lesson"]
timestamp: "2026-09-30"
---

# A Skipped Job Upstream Skips the Deploy — even behind an always() summary check

## What happened

On 2026-09-30, Garbage Day's pull request #10 merged into `main` with every check green. The
workflow's `deploy-production` job then **skipped** instead of deploying. The job was:

```yaml
deploy-production:
  needs: [changes, garbage-day-ok]
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

Both jobs it needs succeeded. `garbage-day-ok` is a summary job that needs every check and runs
under `if: always()`. One of those checks, `dependency-review`, runs only on pull requests, so on
the push it was **skipped**.

## Why

A job `if:` without a status function gets an implicit `success()`. GitHub's workflow syntax
reference, on `jobs.<job_id>.needs`: "If a run contains a series of jobs that need each other, a
failure or skip applies to all jobs in the dependency chain from the point of failure or skip
onwards." The summary job still runs, because `always()` overrides that. The deploy after it
doesn't: the skip from `dependency-review` reaches it through the summary job. Pull requests never
showed the problem because nothing upstream is skipped on them.

## What to do

Gate every job that follows a summary job on its result, and don't let a skip decide:

```yaml
if: >-
  !cancelled() && needs.garbage-day-ok.result == 'success' &&
  github.event_name == 'push' && github.ref == 'refs/heads/main'
```

`!cancelled()` replaces the implicit `success()`. The explicit result keeps the job behind the
summary check. Use a block scalar (`>-`) or `${{ }}`, because YAML reserves a leading `!`. Then
check the first run of any job that only one event triggers, here the first push to `main`: a
green check list says nothing about jobs that were skipped.

## Related

- [Verification vs deployment](../concepts/verification-vs-deployment.md): a green run isn't a
  deploy.
- [Worker Previews in CI](worker-previews-in-ci.md): the same project's other first-deploy walls.
