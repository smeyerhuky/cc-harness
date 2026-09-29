# Hello Worker

A minimal Cloudflare Worker that answers every request with a one-line greeting — the worked
example behind the repo's Cloudflare deploy recipes, and a known-good fixture for checking them.

## Getting started

From this directory:

```bash
npx wrangler dev --port 8787            # run it locally on the real Workers runtime
curl -s http://127.0.0.1:8787/          # → the greeting
npx wrangler deploy --temporary         # deploy to a temporary preview account, no auth needed
```

The full recipes — credentials, local verification, lessons from real deploys — are in the repo's
deploy KB: [`/kb/platforms/`](../../kb/platforms/index.md).

How work on the project is planned and recorded, and where its knowledge base starts:
[`CLAUDE.md`](CLAUDE.md).
