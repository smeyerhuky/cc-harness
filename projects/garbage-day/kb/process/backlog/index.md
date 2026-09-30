# Backlog — Garbage Day (`GD`)

Work items for this project: epics, stories, spikes, and tickets, one markdown file each,
`GD-<KIND>-<NNN>.md`, following the [work-item template](../../../../../kb/pdlc/templates/work-item.md).
Each item's own frontmatter is the source of truth — its `state:`, `milestone:`, and
`relationships:`; this page is a view of them. Rules: [work items](../../../../../kb/pdlc/work-items.md).

## Next free ID per kind

| Kind | Next number |
|---|---|
| `GD-EPIC` | 002 |
| `GD-STORY` | 001 |
| `GD-SPIKE` | 002 |
| `GD-TICKET` | 020 |

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
- [GD-TICKET-011](GD-TICKET-011.md) — Deploy the app shell with preview and production pipelines · blocked (on the owner)
- [GD-TICKET-019](GD-TICKET-019.md) — Run the golden replays in real browsers · active

*Later milestones (gaps from the [coverage audit](../coverage-audit.md), part of GD-EPIC-001):*

- [GD-TICKET-014](GD-TICKET-014.md) — App flow machine, routes and contexts · open (M2)
- [GD-TICKET-015](GD-TICKET-015.md) — Touch visual feedback · open (M2)
- [GD-TICKET-018](GD-TICKET-018.md) — Name the four-row clear without the Tetris name · open (M2)
- [GD-TICKET-013](GD-TICKET-013.md) — Client outbox and reconnect with backoff · open (M3)
- [GD-TICKET-016](GD-TICKET-016.md) — Label bots as bots everywhere · open (M3)
- [GD-TICKET-017](GD-TICKET-017.md) — Show connection quality and degrade visibly above 150 ms · open (M3)
- [GD-TICKET-012](GD-TICKET-012.md) — Delete a match's stored state when its session ends · open (M4)
