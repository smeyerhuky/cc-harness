# Lessons

Real gotchas from real deploys. Read the relevant one *before* you hit the same wall, not after.

* [Wrangler Cache Pollution](wrangler-cache-pollution.md) — `.wrangler/` is a local dev cache; must be gitignored *before* the first `wrangler dev` run or it lands in your first commit.
* [Sandbox Egress Limits](sandbox-egress-limits.md) — Claude Code Remote's HTTPS proxy is itself a Cloudflare Worker, so `curl` to `*.workers.dev` from inside the sandbox returns error 1042.
* [Temp Deploy Claim Window](temp-deploy-claim-window.md) — `wrangler deploy --temporary` gives you a 60-minute window to claim the account before it evaporates; not a substitute for production credentials.
* [MCP Tools Read-Only for Deploy](mcp-tools-read-only-for-deploy.md) — the Cloudflare MCP server can inspect workers/D1/KV/R2 but cannot deploy anything; `wrangler` on the command line remains the only path.
* [First Deploy on a New Account](first-deploy-new-account.md) — a new Cloudflare account needs a `workers.dev` subdomain before any Worker deploys (code 10063); the owner opens Workers & Pages once.
* [Worker Previews in CI](worker-previews-in-ci.md) — a Worker Preview inherits no bindings or vars, so each `env` binding goes in the `previews` block too; and `wrangler preview --json` prints progress lines ahead of its JSON.
* [A Skipped Job Upstream Skips the Deploy](skipped-job-skips-deploy.md) — in GitHub Actions a plain `if:` means `success()`, and a skip anywhere up the `needs` chain (even behind an `always()` summary job) skips the deploy; gate it on `!cancelled()` and the summary job's result.
