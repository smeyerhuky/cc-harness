---
type: "Reference"
title: "Source spec pointer"
description: "Where the authoritative pipe-monitor design spec lives, and the rule for keeping the scaffold faithful to it."
resource: "pipe-monitor deep-wiki (pipemonitorwikiflat.md)"
tags: ["spec", "provenance"]
timestamp: "2026-08-24"
---

# Source spec pointer

The authoritative design is the **`pipe-monitor` OKF deep-wiki** — 59 cross-linked files
decomposing `pipe-acoustic-monitor-spec.md` v1.0, with web-researched corrections and four added
techniques. A flattened single-file copy (`pipemonitorwikiflat.md`) was the input to this scaffold.

This project KB deliberately does **not** duplicate the spec. When you need the *why* behind a
design choice — the physics, the noise budget, the leak-band correction, the session-holdout
argument — read the corresponding spec file. This KB records only what the *scaffold* does and
where it diverges.

## Load-bearing spec facts the scaffold encodes

| Spec fact | Where in scaffold |
|---|---|
| Log-power spectrogram, 257 bins int8, hop 1024, 15.6 fps | `firmware/main/feature_stream.c` |
| `scale_db` carries absolute level for leak detection | `firmware/main/proto.c`, `server/app/proto.py` |
| Feature batch binary layout (v1) | `firmware/main/proto.h`, `server/app/proto.py` |
| STE/LTE edge detector, server-configurable θ | `firmware/main/edge_detect.c` |
| 30 s PSRAM ring buffer, 10 s pre-roll | `firmware/main/ring_buffer.c` |
| Postgres schema (fixtures…models) | `server/app/schema.sql` |
| `holdout_session_id` required; dual metrics; activation gate | `server/app/routes/models.py` |
| Calibration-session feature pinning in retention | `server/app/retention.py` |
| Leak band 50–700 Hz (corrected), server-configurable | `server/app/inference/leak.py` |
| Two-path inference + explicit state machine | `server/app/inference/state_machine.py` |
| Hybrid enclosure substituting for die-cast aluminium | `cad/enclosure.scad`, `kb/decisions/enclosure-hybrid.md` |

## Rule

If a change would contradict a `[HARD]` marker in the source spec, surface what depends on it
before making the change. `[SOFT]` markers (stack choices, broker, board) are substitutable.
