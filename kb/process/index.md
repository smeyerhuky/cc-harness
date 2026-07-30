# Process

The git protocol that governs how work moves through this repo. Lifted from the session-level instructions given to Claude at the start of the `2026-07-15 hello-worker` session, plus a few things we learned by actually doing it.

* [Branch Discipline](branch-discipline.md) — every session gets one designated branch; you develop, commit, and push there and nowhere else without explicit permission.
* [Commit Etiquette](commit-etiquette.md) — when to commit, message format, the Claude co-author trailer, staging carefully.
* [Push and Retry](push-and-retry.md) — `git push -u origin <branch>` with 2/4/8/16s exponential backoff for network errors only; not a retry loop for real failures.
* [PR Creation](pr-creation.md) — never create a PR unless the user explicitly asks; when you do, discover and populate the repo's PR template.
* [Merged PR Follow-ups](merged-pr-followups.md) — if the designated branch's PR was already merged, restart the branch from the default branch — do not stack new commits on merged history.
