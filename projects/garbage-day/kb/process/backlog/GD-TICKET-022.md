---
type: "Work Item"
title: "GD-TICKET-022: Replace the Cloudflare API token before it expires on 2026-12-29"
description: "Create a new account API token with the same scope before the current one expires on 2026-12-29, swap the repository secret, revoke the old token, and prove the deploy jobs still work."
resource: "../coverage-audit.md"
tags: ["backlog", "deploy", "security"]
timestamp: "2026-09-30"
state: "open"
milestone: "M2"
relationships:
  - type: PART_OF
    target: GD-EPIC-001.md
  - type: DERIVED_FROM
    target: ../coverage-audit.md
---

# GD-TICKET-022: Replace the Cloudflare API token before it expires on 2026-12-29

## Description

Found by the [coverage audit of the M1 exit](../coverage-audit.md). The token behind
`CLOUDFLARE_API_TOKEN` is an account API token from the "Edit Cloudflare Workers" template, for
one account, expiring on **2026-12-29** ([`GD-TICKET-011`](GD-TICKET-011.md)). Only the handoff
mentioned it, and nothing carried it. When it expires, every preview and production deploy fails.
It is placed in M2 because that is the active milestone; the date governs, whichever milestone is
active then.

## Acceptance Criteria

- Before 2026-12-29, the owner creates a new account API token (Manage Account → Account API
  tokens) from the "Edit Cloudflare Workers" template, scoped to the one account, with an expiry
  the owner chooses. The owner replaces the `CLOUDFLARE_API_TOKEN` repository secret with it, and
  revokes the old token.
- A `deploy-preview` run after the swap passes; no token value appears in any file, log or chat.
- `stack-and-ci.md` ("Deployment", credentials) and the handoff give the new expiry, and a follow-up
  item is minted for that date.

## Linked Artifacts

- [Stack and CI — deployment](../../design/stack-and-ci.md#deployment),
  `/kb/platforms/cloudflare-credentials.md`
- [Coverage audit — M1 exit](../coverage-audit.md)

## AI PDLC Prompt

Goal: get the token replaced before it expires. This is an owner action: an agent session must
never see or store the token. Remind the owner in time, with the steps (the same settings as the
first token, per `/kb/platforms/cloudflare-credentials.md`). Once the owner says the secret is
swapped, rerun the latest `deploy-preview` job or push the next change, and confirm it passes.
Then update `stack-and-ci.md` and the handoff with the new expiry and mint the next reminder.
Done when the criteria hold, the KB gates pass, this item is `done` with a Resolution, and the
journal records it.
