---
type: "Reference"
title: "Hello Worker"
description: "A minimal Cloudflare Worker — one fetch handler, no bindings — and the worked example the repo's deploy recipes were written from; a finished demo and a known-good deploy fixture."
resource: "../../hello-worker/CLAUDE.md"
tags: ["project", "cloudflare", "workers"]
timestamp: "2026-09-29"
---

# Hello Worker

The smallest Cloudflare Worker that deploys: `src/index.js` returns a one-line greeting, and
`wrangler.jsonc` names it and pins a compatibility date. The repo's
[minimal Worker recipe](../../../kb/platforms/cloudflare-workers-minimal.md) was written from
it, so it is also the fixture for checking that the recipe — local verify, then deploy — still
works. It is finished and deliberately minimal.

## PDLC

| | |
|---|---|
| Prefix | `HW` |
| Handoff — where it stands now | [`kb/process/handoff.md`](../../hello-worker/kb/process/handoff.md) |
| Backlog | [`kb/process/backlog/`](../../hello-worker/kb/process/backlog/index.md) |

Static fields only: current milestone and open work are read from the handoff and backlog.

## Getting started

[`projects/hello-worker/README.md`](../../hello-worker/README.md) — run it locally and deploy it;
[`projects/hello-worker/CLAUDE.md`](../../hello-worker/CLAUDE.md) — how work on it is done.
