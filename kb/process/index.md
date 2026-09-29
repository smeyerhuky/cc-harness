# Process

The git protocol every session in this repo follows — how work moves from a branch to a pull request — plus the harness's own work tracking.

* [Branch Discipline](branch-discipline.md) — every session gets one designated branch; you develop, commit, and push there and nowhere else without explicit permission.
* [Commit Etiquette](commit-etiquette.md) — when to commit, message format, the Claude co-author trailer, staging carefully.
* [Push and Retry](push-and-retry.md) — `git push -u origin <branch>` with 2/4/8/16s exponential backoff for network errors only; not a retry loop for real failures.
* [PR Creation](pr-creation.md) — never create a PR unless the user explicitly asks; when you do, discover and populate the repo's PR template.
* [Merged PR Follow-ups](merged-pr-followups.md) — if the designated branch's PR was already merged, restart the branch from the default branch — do not stack new commits on merged history.

## Harness work tracking (PDLC)

How work on the harness itself is planned and recorded — the same files every project gets
under its own `kb/process/`. They start blank; the [worked example](../pdlc/worked-example.md)
shows them filled in. Cold start: read the handoff first.

* [Handoff](handoff.md) — where harness work stands right now, the next step, and a paste-ready cold-start prompt.
* [Roadmap](roadmap.md) — the harness's milestones, each with its todos, exit criterion, and owner check-in.
* [Backlog](backlog/index.md) — `CCH-*` work items (epics, stories, spikes, tickets); each item's own `state:` is the truth.
* [Running Journal](journal/index.md) — one entry per working session, newest first.

A `coverage-audit.md` is added here at the harness's first [coverage audit](../pdlc/coverage-audit.md) sweep.
