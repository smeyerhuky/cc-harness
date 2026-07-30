---
type: "Playbook"
title: "Minimal Cloudflare Worker Deploy"
description: "The smallest possible Worker + wrangler.jsonc that deploys successfully, verified 2026-07-15 against wrangler 4.111.0."
resource: "projects/hello-worker/"
tags: ["cloudflare", "workers", "deploy", "playbook"]
timestamp: "2026-07-15"
---

# Minimal Cloudflare Worker Deploy

Verified working on 2026-07-15 with wrangler 4.111.0, Node 22, in a Claude Code Remote sandbox. Deploys in ~8 seconds end-to-end.

## The two files

`projects/<name>/src/index.js`:

```javascript
export default {
  fetch() {
    return new Response("hello world\n");
  },
};
```

`projects/<name>/wrangler.jsonc`:

```jsonc
{
  "name": "<name>",
  "main": "src/index.js",
  "compatibility_date": "2026-07-15"
}
```

That's it. No `package.json`, no `wrangler.toml`, no `.dev.vars`, no bindings.

## The three fields you must set in wrangler.jsonc

- **`name`** — becomes the Worker's script name and the subdomain (`<name>.<account>.workers.dev`). Kebab-case; unique per account.
- **`main`** — path to your entry file, relative to `wrangler.jsonc`. Points at the `export default { fetch }` module.
- **`compatibility_date`** — a date string; picks the runtime behavior set for that date. Use today's date for a new project. Older dates give you older behavior; there's no benefit to picking one unless you need it.

Everything else in `wrangler.jsonc` (bindings, routes, secrets, env-specific overrides) is optional and belongs only when you need it.

## Add `.gitignore` **before** you run wrangler

The `wrangler dev` command creates a `.wrangler/` cache directory next to `wrangler.jsonc` on first run. If you don't have a `.gitignore` in place, this cache ends up committed. See [lessons/wrangler-cache-pollution](../lessons/wrangler-cache-pollution.md) for the postmortem — the fix is to create the `.gitignore` file *before* the first local run:

```
# projects/<name>/.gitignore
.wrangler/
node_modules/
```

## Deploy commands

```bash
cd projects/<name>
npx wrangler deploy --temporary   # no auth needed, temp preview account
# — OR —
npx wrangler deploy               # real account, needs CLOUDFLARE_API_TOKEN
```

See [cloudflare-credentials](cloudflare-credentials.md) for the trade-offs between temp and real deploys.

## Verify before you push

1. **Local verify** — [cloudflare-local-verify](cloudflare-local-verify.md) covers `wrangler dev`.
2. **Remote verify** — `curl <URL>` after deploy. In a CCR sandbox this may hit [lessons/sandbox-egress-limits](../lessons/sandbox-egress-limits.md); if so, hand off to the user's browser for confirmation.

## Related

- [Deploy lifecycle](../concepts/deploy-lifecycle.md) — where this fits in the six-stage flow.
- [Verification vs deployment](../concepts/verification-vs-deployment.md) — don't claim it's working just because `wrangler deploy` printed a URL.
