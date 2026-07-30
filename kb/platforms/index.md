# Platforms

Concrete per-platform deploy recipes. Each file assumes you've read [concepts/deploy-lifecycle](../concepts/deploy-lifecycle.md) and just want the platform-specific how-to.

## Cloudflare Workers

* [Minimal Worker](cloudflare-workers-minimal.md) — smallest viable `src/index.js` + `wrangler.jsonc` combo that deploys.
* [Credentials](cloudflare-credentials.md) — `wrangler deploy --temporary` (no auth), `CLOUDFLARE_API_TOKEN` (real account), and why the Cloudflare MCP tools can inspect but not deploy.
* [Local Verify](cloudflare-local-verify.md) — running the worker in workerd locally with `wrangler dev` (no auth required).

## Adding a new platform

When you deploy to Vercel / Fly / GitHub Pages / anything else for the first time, add a sibling directory of files here (`platforms/vercel-*.md`, `platforms/fly-*.md`, etc.) following the same "minimal / credentials / local-verify" split, and link them from this index. Anything you learned the hard way that isn't obviously platform-specific belongs in [lessons/](../lessons/index.md).
