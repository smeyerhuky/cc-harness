---
type: "Lesson"
title: "Sandbox Egress Limits — the CCR proxy is itself a Worker"
description: "Claude Code Remote routes outbound HTTPS through a Cloudflare Worker, and Cloudflare blocks Worker-to-Worker fetches to `*.workers.dev` with error 1042. HTTP verify from inside the sandbox can't reach your own deployed Worker."
resource: "session:2026-07-15 remote-verify attempts"
tags: ["sandbox", "ccr", "cloudflare", "egress", "verify", "gotcha"]
timestamp: "2026-07-15"
---

# Sandbox Egress Limits — the CCR proxy is itself a Worker

## What happened

On 2026-07-15 after deploying `hello-worker` successfully to Cloudflare, `curl https://hello-worker.immediate-purchase.workers.dev` from inside the CCR sandbox returned:

```
error code: 1042
HTTP 403
```

WebFetch to the same URL: `HTTP 403 Forbidden`.
Third-party mirrors (`allorigins.win`, `r.jina.ai`) either returned `error 522` or blocked the anonymous request outright.

The deploy was fine. The URL was fine. Verifying it from *this* sandbox was blocked.

## Why

Cloudflare error **1042** is `RequestNotRetryable — Worker cannot make a request through another Worker`. The CCR HTTPS egress proxy is itself implemented as a Cloudflare Worker, so any `fetch` from inside the sandbox to a `*.workers.dev` origin is a Worker-to-Worker call — which Cloudflare blocks. This is a structural block, not transient. Retrying with backoff never clears it.

## What to do

**Do not claim the deploy is broken.** The deploy is (almost certainly) fine; the sandbox just can't confirm it. Instead:

1. Do local verify (stage 2) properly with `wrangler dev` — see [platforms/cloudflare-local-verify](../platforms/cloudflare-local-verify.md). This gives you real signal that the code works in the runtime.
2. After deploy, report to the user: "Deployed to `<URL>`. Verified locally in workerd. Could not curl the live URL from this sandbox (egress blocked by 1042); please open the URL in your browser to confirm."
3. Hand off remote verify (level 3) to the user's actual browser.

See [concepts/verification-vs-deployment](../concepts/verification-vs-deployment.md) for the general principle.

## What error codes to distinguish

Different Cloudflare error codes mean different things — don't lump them:

| Code | Meaning | Retry? |
|---|---|---|
| 1042 | Worker→Worker fetch blocked | Never — structural |
| 522 | Origin unreachable | Rarely — usually origin actually is down |
| 1020 | Access denied by firewall rule | Never — policy block |
| 502/504 | Upstream timeout | Once, then investigate |
| 403 (with 1042 body) | Same as 1042 | Never |
| 403 (without a Cloudflare error code) | Real auth/authz issue | Not by retry |

## Domains this affects

- `*.workers.dev` — blocked from CCR.
- `*.pages.dev` — likely blocked (same underlying restriction; not tested on 2026-07-15).
- Cloudflare-fronted domains you own via Cloudflare — likely blocked.
- Non-Cloudflare origins — reachable normally.

## Related

- [Verification vs deployment](../concepts/verification-vs-deployment.md) — the general principle that "cannot verify" ≠ "not working".
- [Deploy lifecycle](../concepts/deploy-lifecycle.md) stage 4 (remote verify) is where this bites.
- The CCR proxy documentation lives at `/root/.ccr/README.md` inside the sandbox — check there for updates if the behavior changes.
