---
type: "Playbook"
title: "Local Verify with `wrangler dev`"
description: "Run the actual Cloudflare workerd runtime locally with no auth required — the correct stage-2 verify before any deploy."
resource: "https://developers.cloudflare.com/workers/wrangler/commands/#dev"
tags: ["cloudflare", "workers", "verify", "workerd"]
timestamp: "2026-07-15"
---

# Local Verify with `wrangler dev`

## What it does

`wrangler dev` starts a local server backed by **workerd**, the actual Cloudflare Workers runtime. It's not a mock — the runtime binaries are the same ones the edge runs. Bindings that don't exist locally (KV, R2, D1) are emulated by miniflare; anything that does exist locally (your JS entry, headers, streams, `Response` semantics) executes for real.

No auth is required to run it. You do not need a `CLOUDFLARE_API_TOKEN` and you do not need `wrangler login`.

## Command

```bash
cd projects/<name>
npx wrangler dev --port 8787
```

Then, from another shell or a background process:

```bash
curl -s http://127.0.0.1:8787/
```

On 2026-07-15 this returned `hello world from cc-harness` from the same code that was about to deploy — the correct signal to proceed to stage 3.

## `--remote` variant

`npx wrangler dev --remote` runs the worker on the actual Cloudflare edge (not local workerd) while streaming logs back to your terminal. It **requires auth**. In a CCR sandbox without `CLOUDFLARE_API_TOKEN`, this fails with `You are not authenticated`. Use plain `wrangler dev` (local workerd) instead.

## Bind the port explicitly

If you don't pass `--port`, wrangler picks a random one and prints it. In a background process this is annoying to recover. Explicit port makes cleanup and reconnection deterministic.

## Backgrounding pattern

For a scripted local verify that starts the server, curls it, and tears it down:

```bash
(npx wrangler dev --port 8787 > /tmp/wrangler-local.log 2>&1 &)
for i in $(seq 1 24); do
  sleep 5
  resp=$(curl -s -m 5 http://127.0.0.1:8787/ 2>/dev/null) && [ -n "$resp" ] && break
done
echo "RESPONSE: $resp"
pkill -f "wrangler dev" 2>/dev/null
```

This is what verified `hello-worker` locally on 2026-07-15. Adjust the port and the request URL for your worker.

## What it doesn't catch

Local verify catches code bugs. It does not catch:

- Deploy pipeline issues (auth, script size limit, unsupported compatibility flags).
- Real-network problems (DNS, TLS, upstream service outages).
- Config that only resolves in the deployed environment (secrets, env-specific bindings).

That's why the deploy lifecycle has both local verify (stage 2) *and* remote verify (stage 4) — they're checking different things. See [concepts/verification-vs-deployment](../concepts/verification-vs-deployment.md).

## Related

- [Minimal Cloudflare Worker Deploy](cloudflare-workers-minimal.md) — the deploy step this local verify precedes.
- [Deploy lifecycle](../concepts/deploy-lifecycle.md) — the six-stage flow.
