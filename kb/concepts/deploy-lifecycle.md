---
type: "Concept"
title: "Deploy Lifecycle"
description: "The six-stage abstract flow every deploy follows, from empty repo to pushed-and-verified change."
resource: "session:2026-07-15 hello-worker cloudflare deploy"
tags: ["deploy", "workflow", "lifecycle"]
timestamp: "2026-07-15"
---

# Deploy Lifecycle

Every deploy — Cloudflare Worker, Vercel site, Fly app, ssh-and-restart — follows the same six-stage shape. Knowing the shape means you can spot when you've skipped a stage (and paid for it later).

## The six stages

1. **Scaffold.** Produce the artifact that could be deploy: source files + config file. See [platforms/cloudflare-workers-minimal](../platforms/cloudflare-workers-minimal.md) for the exact shapes.

2. **Local verify.** Run the artifact against the target runtime *locally* before shipping it to the network. Skipping this stage is the single biggest source of "why is my deploy broken" questions — the deploy is fine, the code is wrong. For Cloudflare, `wrangler dev` runs the actual workerd runtime with no auth required; see [platforms/cloudflare-local-verify](../platforms/cloudflare-local-verify.md).

3. **Deploy.** Upload to the platform. This is usually one command (`wrangler deploy`, `vercel`, `fly deploy`). The output tells you what got deployed and where; capture the URL and the version identifier.

4. **Remote verify.** Confirm the live URL responds correctly. This is a distinct check from stage 2 — different runtime instance, different network path, different config resolution. See [concepts/verification-vs-deployment](verification-vs-deployment.md) for why "the API returned 200" is not the same claim as "the deploy is working" — and see [lessons/sandbox-egress-limits](../lessons/sandbox-egress-limits.md) for why remote verify from *inside* a Claude Code Remote sandbox may not be possible for Workers URLs at all.

5. **Commit.** Only after the artifact is verified do you commit it. Before committing, check what's actually staged — build tools frequently drop cache directories that shouldn't be in version control ([lessons/wrangler-cache-pollution](../lessons/wrangler-cache-pollution.md) is the concrete case that bit this session). Follow [process/commit-etiquette](../process/commit-etiquette.md).

6. **Push.** Push to the designated branch ([process/branch-discipline](../process/branch-discipline.md)) using the retry protocol in [process/push-and-retry](../process/push-and-retry.md). Do not open a PR unless explicitly asked ([process/pr-creation](../process/pr-creation.md)).

## What "skipping a stage" looks like

- **Skip local verify → remote verify fails.** You now have an unknown mixture of code bugs and deploy bugs to untangle. Wasted work every time.
- **Skip remote verify → false success.** You report "deployed successfully" and the URL is 500ing. The user finds out, not you.
- **Skip the pre-commit check → dirty commit.** You ship `.wrangler/` or `node_modules/` or a `.env` file to the branch. You then need a second cleanup commit ([lessons/wrangler-cache-pollution](../lessons/wrangler-cache-pollution.md) — this happened on 2026-07-15).
- **Deploy before commit** is fine on temporary/preview accounts, but for production you almost always want the reverse: commit → PR → CI deploys. Which order to use depends on the platform's release model, not on convenience.

## The lifecycle is a rhythm, not a checklist

Once you internalize the shape, the point is not to tick six boxes — it's that when something goes wrong, you can immediately name which stage failed and stop there instead of thrashing across the whole pipeline. Deployed but not verified? Stage 4. Verified locally but failing remotely? Stage 3 or config resolution. Committed a cache directory? You skipped the pre-commit check inside stage 5.
