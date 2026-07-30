---
type: "Policy"
title: "Commit Etiquette"
description: "When to commit, what messages look like, the Claude co-author trailer, and staging carefully to avoid cache pollution."
resource: "session-instructions:2026-07-15"
tags: ["git", "commits", "policy"]
timestamp: "2026-07-15"
---

# Commit Etiquette

## When to commit

Commit when a discrete unit of work is verified working — see [concepts/deploy-lifecycle](../concepts/deploy-lifecycle.md) stage 5. Not before it's verified (you're committing untested code), not so late that one commit contains multiple unrelated changes.

Only commit changes when the user has explicitly asked you to. If unclear, ask first.

## Message format

Short imperative subject, blank line, optional body, then the co-author trailer:

```
Add minimal hello-world Cloudflare Worker deploy test

Co-Authored-By: Claude <your-model-id> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/<session-id>
```

Use a `HEREDOC` when passing the message to `git commit -m` so multi-line formatting is preserved:

```bash
git commit -m "$(cat <<'EOF'
Add minimal hello-world Cloudflare Worker deploy test

Co-Authored-By: Claude <your-model-id> <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/<session-id>
EOF
)"
```

**Do not** put your configured model identifier in the message — it's chat-only. Use the generic "Claude" attribution or whatever wording your current session-level guidance requires.

## Staging carefully

Before every commit, check `git status` and know exactly what's about to go in. Do not use `git add -A` or `git add .` without scanning the output first — they can pick up:

- Cache directories dropped by build tools (`.wrangler/`, `node_modules/`, `.next/`, `dist/`) — see [lessons/wrangler-cache-pollution](../lessons/wrangler-cache-pollution.md) for the specific case this session cleaned up.
- Secret files (`.env`, `credentials.json`, keypair files).
- Editor swap files, OS metadata (`.DS_Store`), coverage reports.

Prefer `git add <specific paths>`. If you need to add a whole directory, first list its contents (`ls -la <dir>`) so you know what's about to be staged.

## Making new commits, not amending

Always create **new** commits rather than amending, unless the user explicitly asks for `--amend`. If a pre-commit hook fails, the commit did not happen — an `--amend` after a hook failure would modify the *previous* (successful) commit, which is not what you want. Fix the issue, re-stage, and create a new commit.

## Related

- [Push and retry](push-and-retry.md) covers the `git push` step that follows commit.
- [Branch discipline](branch-discipline.md) covers *where* the commit ends up.
- [PR creation](pr-creation.md) covers when a commit series becomes a PR.
