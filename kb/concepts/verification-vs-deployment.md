---
type: "Concept"
title: "Verification vs Deployment"
description: "\"Deployed\" and \"working\" are two different claims; conflating them causes false-success reports to the user."
resource: "session:2026-07-15 hello-worker verify attempts"
tags: ["verification", "deploy", "reporting"]
timestamp: "2026-07-15"
---

# Verification vs Deployment

## The two claims are not the same

A successful deploy command means: *the platform accepted the upload and activated it.* It does **not** mean: *a real client can hit the URL and get the intended response.* Anything that runs between the two — DNS, TLS, edge cache warm-up, environment variables not present in the deploy artifact, downstream service outages, feature flags — can break the second claim while the first is still true.

Reporting "deployed successfully" without evidence of the second claim is a false-success. The user finds out; you don't.

## The three-level verification ladder

Not every verification level is possible in every environment. Pick the highest level you can actually execute, and be explicit about which level you got to.

1. **Runtime verify (local).** Run the artifact in the same runtime the platform will run it in — `wrangler dev` for a Worker, `vercel dev` for Vercel, docker-compose against the same image for a container platform. This catches code bugs. It does not catch anything about the deploy pipeline itself. See [platforms/cloudflare-local-verify](../platforms/cloudflare-local-verify.md).

2. **HTTP verify (remote, from CI/sandbox).** After deploy, `curl` the live URL and check the response. This catches most deploy-pipeline problems. It does not catch region-specific breakage or bugs that depend on real user headers/geo.

3. **User verify (remote, from the actual user).** The user opens the URL in their browser. This is the ground truth and the only source of some evidence (cookies, region, real user-agent behavior).

## When you can't do HTTP verify from where you are

Some environments — including Claude Code Remote sessions running behind a Cloudflare Workers egress proxy — can complete level 1 but *cannot* complete level 2 for certain destinations. See [lessons/sandbox-egress-limits](../lessons/sandbox-egress-limits.md) for the specific case (Cloudflare's own worker-to-worker fetch restriction that blocks `curl` to `*.workers.dev` from inside a CCR sandbox with error 1042).

The rule when this happens: **do not claim the deploy is working**. Report exactly what you verified and what you couldn't, and hand off level 3 to the user with the URL. Example wording:

> Deployed to `<URL>`. Verified locally in workerd (level 1). Could not curl the live URL from this sandbox (egress blocked by 1042); please open the URL in your browser to confirm.

That is a truthful report. "Deployed successfully" without the caveat is not.

## Corollary: don't retry-loop your way past a real failure

If the verification `curl` returns 522/1042/403 from a sandbox, additional retries won't clear it — it's a structural block, not a transient one. Diagnose the response (Cloudflare error codes tell you exactly what's up: 1042 = worker→worker blocked, 522 = origin unreachable, etc.) before deciding whether to retry. See [deploy-lifecycle](deploy-lifecycle.md) stage 4 for where this fits in the overall flow.
