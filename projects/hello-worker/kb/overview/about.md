---
type: "Concept"
title: "About Hello Worker"
description: "A minimal Cloudflare Worker — one fetch handler, no bindings — for anyone deploying a first Worker from this repo, and the fixture the deploy recipes are checked against."
resource: "../../README.md"
tags: ["project", "overview"]
timestamp: "2026-09-29"
---

# About Hello Worker

Hello Worker is the smallest Cloudflare Worker that deploys: `src/index.js` exports a `fetch`
handler that returns a one-line greeting, and `wrangler.jsonc` names it, points at the entry
file, and pins a compatibility date. The repo's
[minimal Worker recipe](../../../../kb/platforms/cloudflare-workers-minimal.md) was written from
it, so it doubles as the fixture that shows the recipe — local verify, then deploy — still works.

Its spec is that recipe: what it must do is exactly what the recipe describes.

## Out of scope

Bindings (KV, R2, D1), routes, secrets, a build step, tests beyond the local-verify curl. Anything
that needs them is a new project, not a change to this one — the recipe depends on it staying
minimal.

## Where it stands

The [handoff](../process/handoff.md) — the one place that says where the project is right now.
