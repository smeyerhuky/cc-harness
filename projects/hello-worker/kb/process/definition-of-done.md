---
type: "Policy"
title: "Hello Worker Definition of Done"
description: "This project's additions to the repo-wide definition of done; the generic three tiers are linked, not copied."
resource: "../../../../kb/pdlc/definition-of-done.md"
tags: ["verification", "governance"]
timestamp: "2026-09-29"
---

# Hello Worker Definition of Done

Every work item, dependency change, and milestone in this project meets the repo-wide
[definition of done](../../../../kb/pdlc/definition-of-done.md) **plus** the items below. Don't copy
the generic tiers here — add only what is specific to this project.

## Project-specific items

- **A change to the Worker is verified locally before it is deployed** —
  [`wrangler dev` and a `curl`](../../../../kb/platforms/cloudflare-local-verify.md) — and the
  `.gitignore` keeps `wrangler dev`'s `.wrangler/` cache out of git
  ([the lesson](../../../../kb/lessons/wrangler-cache-pollution.md)).
- **It stays minimal** — the repo's deploy recipe depends on it matching the recipe's two files.

## This project's gates

The project [KB gates](../../../../kb/pdlc/definition-of-done.md#gates) on this bundle, plus the
local verify for any change to `src/` or `wrangler.jsonc`:

```bash
cd projects/hello-worker && npx wrangler dev --port 8787   # then: curl -s http://127.0.0.1:8787/
```
