---
type: "Lesson"
title: "Temporary Deploy Claim Window"
description: "`wrangler deploy --temporary` gives you a 60-minute window to claim the auto-created account, after which the deployment goes away."
resource: "session:2026-07-15 hello-worker deploy"
tags: ["cloudflare", "wrangler", "temp-deploy", "gotcha"]
timestamp: "2026-07-15"
---

# Temporary Deploy Claim Window

## What happened

The 2026-07-15 `hello-worker` deploy used `wrangler deploy --temporary`. The output included:

```
Temporary account ready:
	Account: Immediate Purchase (created)
	Claim within: 60 minutes
	Claim URL: https://dash.cloudflare.com/claim-preview?claimToken=<token>
```

The URL worked immediately. **The account, the URL, and the deployment all disappear after 60 minutes unless someone opens the claim URL and links it to a real Cloudflare account.**

## Why

`--temporary` is a demo/preview facility. Cloudflare creates a fresh account for the deploy so no credentials are needed, but the account is transient by default. Claiming binds it to a Cloudflare user; unclaimed accounts get reaped.

## What this is good for

- Proving the deploy pipeline works before you've set up real credentials.
- Sharing a URL for a 60-minute demo or a quick sanity check.
- Verifying a code change reaches the runtime unchanged (stage 3 of the [deploy lifecycle](../concepts/deploy-lifecycle.md)).

## What this is not good for

- Production. Full stop. The URL evaporates.
- Anything the user is expected to bookmark or use over multiple sessions.
- Anything you'd want to iterate on across multiple deploy commands — each `--temporary` invocation creates a *new* account with a *new* random subdomain (`<name>.<random-slug>.workers.dev`).

## The upgrade path

To deploy to a persistent account, add a `CLOUDFLARE_API_TOKEN` to the environment and re-run `wrangler deploy` without `--temporary`. See [platforms/cloudflare-credentials](../platforms/cloudflare-credentials.md) for the three auth options and their trade-offs.

## Reporting to the user

When you use `--temporary`, always mention:

1. The claim URL.
2. That it expires in 60 minutes.
3. That this is not a substitute for production credentials.

Example wording from the 2026-07-15 session:

> Deployed to `<URL>` on a Cloudflare *temporary preview account*. It's on the temp account since there's no `CLOUDFLARE_API_TOKEN` in this environment. The temp deployment expires unless claimed within ~60 minutes via [this claim URL](https://dash.cloudflare.com/claim-preview?claimToken=...). To deploy to your real account from here, add a `CLOUDFLARE_API_TOKEN` env var to this environment.

## Related

- [Cloudflare credentials](../platforms/cloudflare-credentials.md) — full breakdown of the three auth modes.
- [Deploy lifecycle](../concepts/deploy-lifecycle.md) — where `--temporary` fits in stage 3.
