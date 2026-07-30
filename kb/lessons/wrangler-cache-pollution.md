---
type: "Lesson"
title: "Wrangler Cache Pollution"
description: "`.wrangler/` is a local dev cache created by `wrangler dev`; if you don't gitignore it before running wrangler, it gets committed."
resource: "session:2026-07-15 commits 77f012e → c122163"
tags: ["cloudflare", "wrangler", "git", "gitignore", "gotcha"]
timestamp: "2026-07-15"
---

# Wrangler Cache Pollution

## What happened

On 2026-07-15, the first commit adding `projects/hello-worker/` accidentally included four files that had no business being in version control:

```
projects/hello-worker/.wrangler/cache/cf.json
projects/hello-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite
projects/hello-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-shm
projects/hello-worker/.wrangler/state/v3/cache/miniflare-CacheObject/metadata.sqlite-wal
```

These were created by `wrangler dev` when the worker was verified locally in workerd. The subsequent `git add projects/hello-worker` picked them up along with the intended source files, and they went into commit `77f012e`. A cleanup commit (`c122163`) had to remove them from tracking and add a `.gitignore`.

## Why

`wrangler dev` creates `.wrangler/` next to `wrangler.jsonc` as a runtime cache for the local miniflare instance (Cloudflare API metadata, SQLite files for KV/D1 emulation). This is a *local dev* artifact — regenerated on next run — and does not belong in the repo. Wrangler does not create the cache directory during `wrangler deploy`; the surprise is only for anyone who did local verify (stage 2 of the [deploy lifecycle](../concepts/deploy-lifecycle.md)) before their first commit — which they should have done.

## The fix (do this before your first `wrangler dev` run)

Add `projects/<name>/.gitignore` **before** you run wrangler for the first time:

```
.wrangler/
node_modules/
```

If you've already run wrangler and are about to commit, `git status` will show `.wrangler/` as untracked. Add the `.gitignore` first, then commit. If it's already been committed:

```bash
git rm -r --cached projects/<name>/.wrangler
# add the .gitignore
git commit -m "Remove wrangler local dev cache from version control"
```

## The general form

This isn't specific to wrangler. Every build tool that creates cache/state directories has a similar failure mode:

| Tool | Directory to gitignore |
|---|---|
| Wrangler | `.wrangler/` |
| Next.js | `.next/` |
| npm | `node_modules/` |
| Vercel CLI | `.vercel/` |
| Vite | `dist/`, `.vite/` |
| Cargo | `target/` |
| Python | `__pycache__/`, `.venv/`, `venv/` |

The right time to add a `.gitignore` is before running the tool for the first time in a new project directory. See [process/commit-etiquette](../process/commit-etiquette.md) on staging carefully.

## Related

- [Minimal Cloudflare Worker Deploy](../platforms/cloudflare-workers-minimal.md) mentions the `.gitignore` step up front so future projects don't hit this again.
- [Deploy lifecycle](../concepts/deploy-lifecycle.md) stage 5 (Commit) calls out the pre-commit `git status` scan that would have caught this earlier.
