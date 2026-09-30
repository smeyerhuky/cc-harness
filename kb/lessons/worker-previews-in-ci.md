---
type: "Lesson"
title: "Worker Previews in CI — nothing is inherited, and --json isn't only JSON"
description: "A Worker Preview inherits no bindings or vars from the top level of wrangler.jsonc, so an env binding missing from the previews block makes the Worker fail only in previews; and `wrangler preview --json` prints progress lines ahead of its JSON, so parse from the first `{`."
resource: "projects/garbage-day/kb/process/journal/2026-09-30-scaffold.md"
tags: ["cloudflare", "wrangler", "deploy", "lesson"]
timestamp: "2026-09-30"
---

# Worker Previews in CI — nothing is inherited, and --json isn't only JSON

Garbage Day deploys one [Worker Preview](https://developers.cloudflare.com/workers/previews/) per
pull request (open beta since 2026-09-22) with `wrangler preview`. Its first previews, on
2026-09-30, hit two walls after the [account's subdomain](first-deploy-new-account.md) was
sorted out. The context is in `projects/garbage-day/kb/process/backlog/GD-TICKET-011.md`.

## 1. `wrangler preview --json` isn't only JSON

The preview deployed, and then the job failed reading its URL:

```
jq: parse error: Invalid numeric literal at line 1, column 6
```

**Why:** Wrangler 4.143.0 still writes its progress lines to stdout ahead of the JSON document
(`Using redirected Wrangler configuration.`, `🌀 Building list of assets...`, …). The
"redirected configuration" lines appear because `@cloudflare/vite-plugin` built the Worker; the
asset lines come from Wrangler itself. `jq` reads the first word, `Using`, as a bad number.

**What to do:** parse from the line that opens the document, and fail the job on an empty URL so
a future change to the output fails loudly instead of posting a blank link:

```
url=$(sed -n '/^{/,$p' "$RUNNER_TEMP/preview.out" | jq -r '.preview.urls[0] // empty')
```

## 2. A preview inherits no bindings

With the URL commented, the preview served the page, but `/api/health` answered **500**. The
Worker calls `env.LOBBY` and `env.MATCH`, and they were undefined. The deployment record in the
job log showed why: its `env` held only `ASSETS` and `ENVIRONMENT`, with no Durable Object
bindings.

**Why:** Cloudflare's [Previews configuration](https://developers.cloudflare.com/workers/previews/configuration/)
says "Previews do not inherit production settings". Only `assets`, the compatibility settings,
`placement` and observability carry over from the top level. Vars and every binding the Worker
reads from `env` must be declared again in the `previews` block. For Durable Objects, keep the
classes and migrations at the top level; each preview automatically gets its own namespace and
storage. Local dev, `vite preview` and the Workers test pool all use the top-level config, so none
of them can catch this.

**What to do:** declare each `env` binding again under `previews`, and test that the two lists
match. Garbage Day's `src/app/test/wrangler-config.test.ts` reads `wrangler.jsonc` with Wrangler's
own `experimental_readRawConfig` and compares `previews.durable_objects.bindings` with the top
level (and the var names). Wrangler's declarations for that reader don't resolve (they import the
bundled `@cloudflare/workers-utils`), so the test types the part it reads. The alternative
Cloudflare recommends is to reach Durable Objects through `ctx.exports` instead of `env`, which
needs no preview binding at all.

## Related

- [First deploy on a new account](first-deploy-new-account.md) — the wall before these.
- [Sandbox egress limits](sandbox-egress-limits.md) — a sandboxed agent can't open the preview
  (1042); the owner checks it in a browser, which is how the 500 was found.
- [Verification vs deployment](../concepts/verification-vs-deployment.md) — the job was green and
  the page loaded, but the preview wasn't working until the health check said so.
