---
type: "Lesson"
title: "First Deploy on a New Account — the workers.dev subdomain, and JSON that isn't"
description: "A Cloudflare account can't deploy a Worker until it has a workers.dev subdomain (code 10063), which only the owner can create in the dashboard; and `wrangler preview --json` prints progress lines ahead of its JSON, so parse from the first `{`."
resource: "projects/garbage-day/kb/process/journal/2026-09-30-scaffold.md"
tags: ["cloudflare", "wrangler", "deploy", "lesson"]
timestamp: "2026-09-30"
---

# First Deploy on a New Account — the workers.dev subdomain, and JSON that isn't

Two walls the first CI deploy of Garbage Day hit on 2026-09-30, one after the other, on a
Cloudflare account that had never deployed a Worker. Both are one-time or one-line fixes once you
know them. The context is in `projects/garbage-day/kb/process/backlog/GD-TICKET-011.md`.

## 1. No workers.dev subdomain yet: code 10063

The token and account ID were right: `wrangler preview` authenticated, created the preview, and
then failed on the deployment call:

```
A request to the Cloudflare API (/accounts/***/workers/workers/garbage-day/previews/…/deployments) failed.
  You need a workers.dev subdomain in order to proceed. Please go to the dashboard and open the
  Workers menu. Opening the Workers landing page for the first time will create a workers.dev
  subdomain automatically. [code: 10063]
```

**Why:** a new account has no `<name>.workers.dev` subdomain until someone opens **Workers &
Pages** in the dashboard. Every Worker URL, previews included, lives under it.

**What to do:** ask the owner to open Workers & Pages once (the subdomain then shows under
Account details → Subdomain), then **rerun the failed job**. Don't change the workflow and don't
push an empty commit. An agent can't do this step: it needs the dashboard, and a Workers-scoped CI
token shouldn't be widened to set the subdomain through the API.

## 2. `wrangler preview --json` isn't only JSON

With the subdomain in place the preview deployed, and then the job failed on its own parsing:

```
jq: parse error: Invalid numeric literal at line 1, column 6
```

**Why:** Wrangler 4.143.0 still writes its progress lines to stdout ahead of the JSON document
(`Using redirected Wrangler configuration.`, `🌀 Building list of assets...`, …). The
"redirected configuration" lines appear because `@cloudflare/vite-plugin` built the Worker; the
asset lines come from Wrangler itself. `jq` reads the first word, `Using`, as a bad number.

**What to do:** parse from the line that opens the document:

```
url=$(sed -n '/^{/,$p' "$RUNNER_TEMP/preview.out" | jq -r '.preview.urls[0] // empty')
```

Keep the `// empty` and a check that fails the job when the URL is empty. Then a future change to
the output fails loudly instead of posting a blank link.

## Related

- [Sandbox egress limits](sandbox-egress-limits.md) — once the preview is up, a sandboxed agent
  still can't open it (1042); the owner checks it in a browser.
- [Cloudflare credentials](../platforms/cloudflare-credentials.md) — the token that got this far.
- [Deploy lifecycle](../concepts/deploy-lifecycle.md) — both walls are in the deploy stage, after
  local verify passed.
