# Backlog — Garbage Day (`GD`)

Work items for this project: epics, stories, spikes, and tickets, one markdown file each,
`GD-<KIND>-<NNN>.md`, following the [work-item template](../../../../../kb/pdlc/templates/work-item.md).
Each item's own frontmatter is the source of truth — its `state:`, `milestone:`, and
`relationships:`; this page is a view of them. Rules: [work items](../../../../../kb/pdlc/work-items.md).

## Next free ID per kind

| Kind | Next number |
|---|---|
| `GD-EPIC` | 002 |
| `GD-STORY` | 009 |
| `GD-SPIKE` | 002 |
| `GD-TICKET` | 025 |

Update this table in the same change that mints a new item. Numbers are never reused.

## Items

*Epics:*

- [GD-EPIC-001](GD-EPIC-001.md) — Garbage Day v1 · open

*M0 — Stand the project up:*

- [GD-TICKET-001](GD-TICKET-001.md) — Write the spec · done
- [GD-SPIKE-001](GD-SPIKE-001.md) — Prove the no-backend multiplayer design · done
- [GD-TICKET-002](GD-TICKET-002.md) — Write the architecture design from the proof of concept · done
- [GD-TICKET-003](GD-TICKET-003.md) — Write the UI language design notes · done
- [GD-TICKET-004](GD-TICKET-004.md) — Choose the tech stack and design the build and CI pipeline · done
- [GD-TICKET-005](GD-TICKET-005.md) — Design the React client architecture · done

*M1 — Foundations (part of GD-EPIC-001):*

- [GD-TICKET-006](GD-TICKET-006.md) — Scaffold the pnpm workspace with the pinned stack · done
- [GD-TICKET-007](GD-TICKET-007.md) — Add the GitHub Actions pipeline · done
- [GD-TICKET-008](GD-TICKET-008.md) — Port the engine core to TypeScript · done
- [GD-TICKET-009](GD-TICKET-009.md) — Port the referee, bot and local match, with golden replays · done
- [GD-TICKET-010](GD-TICKET-010.md) — Build the protocol package · done
- [GD-TICKET-011](GD-TICKET-011.md) — Deploy the app shell with preview and production pipelines · done
- [GD-TICKET-019](GD-TICKET-019.md) — Run the golden replays in real browsers · done
- [GD-TICKET-020](GD-TICKET-020.md) — Run the browser replays in Playwright's container image · done

*M2 — Play solo (part of GD-EPIC-001; minted at the M1 exit; the owner put `GD-TICKET-021` first, then keyboard play and its settings before the fight layer):*

- [GD-TICKET-021](GD-TICKET-021.md) — Take the next Cloudflare tooling set and delete the undici override · done
- [GD-TICKET-023](GD-TICKET-023.md) — Build the ui commons: tokens, primitives, game widgets and hooks · done
- [GD-TICKET-014](GD-TICKET-014.md) — App flow machine, routes and contexts · done
- [GD-STORY-001](GD-STORY-001.md) — Play a local match at my own pace · done
- [GD-STORY-007](GD-STORY-007.md) — Start from home with a handle and my settings · done
- [GD-STORY-003](GD-STORY-003.md) — Play with the keyboard, my way · done
- [GD-STORY-002](GD-STORY-002.md) — See the fight: garbage, power-ups, showdowns and the result · done
- [GD-STORY-004](GD-STORY-004.md) — Play with swipes and taps on a phone · done
- [GD-STORY-005](GD-STORY-005.md) — Screens that fit: desktop space and phone boards · active
- [GD-STORY-006](GD-STORY-006.md) — Set up a bot: presets or skill and speed · open
- [GD-STORY-008](GD-STORY-008.md) — Accessible by default · open
- [GD-TICKET-024](GD-TICKET-024.md) — Add the developer overlay, off by default · open
- [GD-TICKET-015](GD-TICKET-015.md) — Touch visual feedback · done
- [GD-TICKET-018](GD-TICKET-018.md) — Name the four-row clear without the Tetris name · done ("Quad")
- [GD-TICKET-022](GD-TICKET-022.md) — Replace the Cloudflare API token before it expires on 2026-12-29 · open

*Later milestones (gaps from the [coverage audit](../coverage-audit.md), part of GD-EPIC-001):*

- [GD-TICKET-013](GD-TICKET-013.md) — Client outbox and reconnect with backoff · open (M3)
- [GD-TICKET-016](GD-TICKET-016.md) — Label bots as bots everywhere · open (M3)
- [GD-TICKET-017](GD-TICKET-017.md) — Show connection quality and degrade visibly above 150 ms · open (M3)
- [GD-TICKET-012](GD-TICKET-012.md) — Delete a match's stored state when its session ends · open (M4)
