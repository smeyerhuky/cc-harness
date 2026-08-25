---
type: "Concept"
title: "Stubbed inference"
description: "Why the template matcher, NMF unmixing, and leak/drift detectors are honest scaffolding rather than working models in this scaffold."
resource: "../../server/app/inference"
tags: ["ml", "inference", "divergence", "honesty"]
timestamp: "2026-08-24"
---

# Stubbed inference

## The situation

The spec is emphatic (`overview/phase-plan.md`): the models are **fit to one installation**, and
Phase 0 — proving fixture signatures are separable at *your* sensor position — is a gate that
produces spectrograms, not code. Every published accuracy number (96%, 97.9%, 98.6%) is from a
different pipe network. **There is nothing to train against until your hardware produces
recordings.**

## What that means for the scaffold

The inference modules in `server/app/inference/` are **structurally complete and honest stubs**:

| Module | What's real | What's stubbed |
|---|---|---|
| `templates.py` | Normalized cross-correlation, per-fixture open/close banks, alignment on energy onset, confidence + abstention | The template bank is empty until calibration clips exist |
| `nmf.py` | Supervised NMF (fixed bases, non-negative activation solve), **multi-label sigmoid** output | Bases are learned from single-fixture recordings you don't have yet |
| `state_machine.py` | Full arbitration logic (transient trusted immediately, steady-state overrides after 60 s), correction-rate logging | Nothing — this is complete and testable with synthetic events |
| `leak.py` | Passive band-energy (50–700 Hz) on `scale_db`, 3-night persistence, active-chirp comparison | Baseline/thresholds are placeholders tuned in Phase 4 |
| `drift.py` | IRF comparison, smooth-vs-discrete separation | Reference IRF established after Phase 1 calibration |

The state machine and the protocol/storage layers are genuinely done. The learned components are
scaffolding with correct **shape** (interfaces, invariants, hygiene) but no trained weights.

## The hygiene that IS enforced now, in code

Even with no data, the scaffold encodes the anti-leakage rules the spec calls `[HARD]`:

- `augment.py` takes the **training-session subset** as input and has no handle on the holdout
  partition — leakage is structurally impossible, not merely discouraged.
- The CV bin mask is computed once from the training partition (`features.py`), never per-batch.
- `POST /models/train` **requires** `holdout_session_id`; `retention.py` pins calibration-session
  features so the holdout set survives the 90-day roll-off.

## The rule

Do not present these modules as validated. A green unit test on synthetic data proves the
*plumbing*, not the *accuracy*. Accuracy lives on the far side of Phase 0 with real water.
