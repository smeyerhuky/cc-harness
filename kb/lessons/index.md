# Lessons

Real gotchas from real deploys. Read the relevant one *before* you hit the same wall, not after.

* [Wrangler Cache Pollution](wrangler-cache-pollution.md) — `.wrangler/` is a local dev cache; must be gitignored *before* the first `wrangler dev` run or it lands in your first commit.
* [Sandbox Egress Limits](sandbox-egress-limits.md) — Claude Code Remote's HTTPS proxy is itself a Cloudflare Worker, so `curl` to `*.workers.dev` from inside the sandbox returns error 1042.
* [Temp Deploy Claim Window](temp-deploy-claim-window.md) — `wrangler deploy --temporary` gives you a 60-minute window to claim the account before it evaporates; not a substitute for production credentials.
* [MCP Tools Read-Only for Deploy](mcp-tools-read-only-for-deploy.md) — the Cloudflare MCP server can inspect workers/D1/KV/R2 but cannot deploy anything; `wrangler` on the command line remains the only path.
