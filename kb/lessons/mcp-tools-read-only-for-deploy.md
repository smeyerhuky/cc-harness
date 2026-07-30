---
type: "Lesson"
title: "Cloudflare MCP tools are read-only for deploy"
description: "The Cloudflare Developer Platform MCP server exposes inspection tools but no deploy tool — you still need `wrangler` on the command line."
resource: "session:2026-07-15 mcp__Cloudflare_Developer_Platform__* enumeration"
tags: ["cloudflare", "mcp", "deploy", "gotcha"]
timestamp: "2026-07-15"
---

# Cloudflare MCP tools are read-only for deploy

## What happened

Before running `wrangler deploy` on 2026-07-15, the Cloudflare Developer Platform MCP server was searched for a deploy tool. It exposes these:

- `workers_list`, `workers_get_worker`, `workers_get_worker_code` — inspection only.
- `d1_databases_list`, `d1_database_get`, `d1_database_create`, `d1_database_delete`, `d1_database_query` — D1 lifecycle *plus* deploy of data, no worker deploy.
- `kv_namespace_create`, `kv_namespace_delete`, `kv_namespaces_list`, etc. — KV lifecycle.
- `r2_bucket_create`, `r2_bucket_delete`, `r2_buckets_list`, etc. — R2 lifecycle.
- `hyperdrive_config_*` — Hyperdrive config CRUD.
- `search_cloudflare_documentation` — docs search.
- `migrate_pages_to_workers_guide` — a static guide.

Notably absent: any tool named `workers_deploy`, `workers_upload`, `workers_publish`, `workers_create_worker`. Calling `workers_list` on the (unauthenticated / demo) account returned `{"workers":[],"count":0}` — inspection worked, deploy was not on offer.

## What this means

Even in an environment with the Cloudflare MCP server connected, you still need `wrangler` on the command line to deploy a Worker. MCP can tell you *what's on the account* but cannot ship anything to it.

For associated resources (KV namespaces, D1 databases, R2 buckets, Hyperdrive configs), MCP *can* create/delete/query them — but the Worker code itself remains a wrangler-only operation.

## Where MCP is useful in a deploy flow

- **Before deploy**: `workers_list` shows what's already on the account (helpful for finding name conflicts or seeing what was left from previous sessions).
- **After deploy**: `workers_get_worker` and `workers_get_worker_code` let you inspect what actually landed on Cloudflare's side, including the deployed bundle — a form of remote verification that doesn't depend on egress ([lessons/sandbox-egress-limits](sandbox-egress-limits.md) doesn't apply, because MCP tools talk to Cloudflare's API directly).
- **For associated resources**: create the D1 database or KV namespace via MCP, get the ID, then reference it in `wrangler.jsonc`.

## Don't skip the tool check

The right pattern is still: search MCP for what might cover your task first, then fall back to command line if there's nothing there. On 2026-07-15 the search itself was cheap (one `ToolSearch` call) and confirmed what wasn't available — which is signal, not wasted effort.

## Related

- [Cloudflare credentials](../platforms/cloudflare-credentials.md) — the wrangler auth modes for the actual deploy step.
- [Verification vs deployment](../concepts/verification-vs-deployment.md) — MCP inspection is a form of remote verify that doesn't share the egress limits of `curl`.
