---
type: "Reference"
title: "Cloudflare Credentials for Deploy"
description: "How to deploy to Cloudflare with no auth (temp preview account), with an API token (real account), and why the Cloudflare MCP tools can't cover deploys."
resource: "https://developers.cloudflare.com/workers/wrangler/commands/#deploy"
tags: ["cloudflare", "credentials", "auth", "deploy"]
timestamp: "2026-07-15"
---

# Cloudflare Credentials for Deploy

## Three ways to deploy — in order of increasing setup cost

### 1. Temporary preview account (`--temporary`)

```bash
npx wrangler deploy --temporary
```

No auth needed. Wrangler solves a proof-of-work challenge, gets a fresh Cloudflare account, and deploys your worker there. Output includes:

- The live URL: `https://<worker-name>.<random-account-slug>.workers.dev`
- A **claim URL** valid for 60 minutes: `https://dash.cloudflare.com/claim-preview?claimToken=...`
- The version ID of the deployment

**Use case**: prove the pipeline works, share a URL for a quick demo, confirm a code change deploys. Not a substitute for production — see [lessons/temp-deploy-claim-window](../lessons/temp-deploy-claim-window.md).

### 2. `wrangler login` (interactive)

```bash
npx wrangler login
npx wrangler deploy
```

Opens a browser to complete OAuth against your Cloudflare account. Only works when a browser is available — **does not work** in a CCR sandbox or CI, where nothing can open a browser window.

### 3. `CLOUDFLARE_API_TOKEN` (headless)

```bash
export CLOUDFLARE_API_TOKEN=<token>
npx wrangler deploy
```

The token must have the `Workers Scripts:Edit` permission (and other resource-specific edits for whatever your worker binds to — KV, R2, D1, etc.). Create tokens at `https://dash.cloudflare.com/profile/api-tokens`.

**This is the mode a CCR sandbox needs for real deploys.** As of 2026-07-15 there is no `CLOUDFLARE_API_TOKEN` in this repo's environment; deploys from here must use `--temporary` unless the user adds one.

## Why the Cloudflare MCP tools don't cover deploys

The Cloudflare MCP server (`mcp__Cloudflare_Developer_Platform__*`) exposes inspection-only tools: `workers_list`, `workers_get_worker`, `workers_get_worker_code`, D1/KV/R2 list/get, docs search. **There is no `workers_deploy` tool.** MCP can tell you what's on your account (in this session on 2026-07-15, that returned `{"workers":[],"count":0}` — the account is empty). It cannot ship anything to it. See [lessons/mcp-tools-read-only-for-deploy](../lessons/mcp-tools-read-only-for-deploy.md).

To deploy, you still need `wrangler` on the command line, and one of the three auth modes above.

## Related

- [Minimal Cloudflare Worker Deploy](cloudflare-workers-minimal.md) — the `wrangler deploy` command that these creds go with.
- [Local verify](cloudflare-local-verify.md) — needs no creds at all; useful for iterating before you burn the deploy quota.
