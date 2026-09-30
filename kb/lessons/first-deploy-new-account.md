---
type: "Lesson"
title: "First Deploy on a New Account — no workers.dev subdomain yet"
description: "A Cloudflare account can't deploy a Worker until it has a workers.dev subdomain (code 10063), which only the owner can create by opening Workers & Pages in the dashboard once; then rerun the failed job."
resource: "projects/garbage-day/kb/process/journal/2026-09-30-scaffold.md"
tags: ["cloudflare", "wrangler", "deploy", "lesson"]
timestamp: "2026-09-30"
---

# First Deploy on a New Account — no workers.dev subdomain yet

The first wall the first CI deploy of Garbage Day hit on 2026-09-30, on a Cloudflare account that
had never deployed a Worker. The context is in
`projects/garbage-day/kb/process/backlog/GD-TICKET-011.md`; the walls after it are in
[Worker Previews in CI](worker-previews-in-ci.md).

## What happened

The token and account ID were right: `wrangler preview` authenticated, created the preview, and
then failed on the deployment call:

```
A request to the Cloudflare API (/accounts/***/workers/workers/garbage-day/previews/…/deployments) failed.
  You need a workers.dev subdomain in order to proceed. Please go to the dashboard and open the
  Workers menu. Opening the Workers landing page for the first time will create a workers.dev
  subdomain automatically. [code: 10063]
```

## Why

A new account has no `<name>.workers.dev` subdomain until someone opens **Workers &
Pages** in the dashboard. Every Worker URL, previews included, lives under it.

## What to do

Ask the owner to open Workers & Pages once (the subdomain then shows under
Account details → Subdomain), then **rerun the failed job**. Don't change the workflow and don't
push an empty commit. An agent can't do this step: it needs the dashboard, and a Workers-scoped CI
token shouldn't be widened to set the subdomain through the API.

## Related

- [Worker Previews in CI](worker-previews-in-ci.md) — what came next: bindings a preview doesn't
  inherit, and `--json` output that isn't only JSON.
- [Sandbox egress limits](sandbox-egress-limits.md) — once the preview is up, a sandboxed agent
  still can't open it (1042); the owner checks it in a browser.
- [Cloudflare credentials](../platforms/cloudflare-credentials.md) — the token that got this far.
- [Deploy lifecycle](../concepts/deploy-lifecycle.md) — this wall is in the deploy stage, after
  local verify passed.
