"""Training-pipeline logic (server/training-pipeline.md, evaluation/session-holdout.md).

The single most important discipline in the project lives here: models are
evaluated by holding out ENTIRE sessions, both metrics are always reported, and
the GAP between them is the primary diagnostic. Enforced three ways:
  1. holdout_session_id is REQUIRED at the API boundary (routes/models.py)
  2. both metrics written to models.metrics (build_metrics below)
  3. activation refuses a model whose gap exceeds AC2 without an explicit override

The augmentation step composes ONLY from training-session singles (augment.py has
no handle on the holdout partition) — closing the invisible synthetic-leak path.
"""
from __future__ import annotations

from dataclasses import dataclass

AC2_GAP_THRESHOLD = 0.08     # random-split minus session-holdout accuracy


class HoldoutError(ValueError):
    """Raised when a train request omits or misuses the holdout session."""


def validate_train_request(session_ids: list[int], holdout_session_id: int) -> None:
    """A training run that cannot start without naming a held-out session cannot
    silently degrade into a random split."""
    if holdout_session_id is None:
        raise HoldoutError("holdout_session_id is required (session-holdout is a [HARD] gate)")
    if holdout_session_id not in session_ids:
        raise HoldoutError("holdout_session_id must be one of session_ids")
    if len(session_ids) < 2:
        raise HoldoutError("need >=2 sessions so at least one can be held out")


def training_sessions(session_ids: list[int], holdout_session_id: int) -> list[int]:
    """The subset that augmentation and fitting may see — holdout excluded
    entirely. This is the ONLY list handed to augment.synthesize_overlaps()."""
    return [s for s in session_ids if s != holdout_session_id]


def build_metrics(random_split_acc: float, session_holdout_acc: float,
                  holdout_session_id: int, per_fixture: dict, confusion: list,
                  n_train: int, n_holdout: int) -> dict:
    gap = round(random_split_acc - session_holdout_acc, 4)
    return {
        "random_split_acc": random_split_acc,
        "session_holdout_acc": session_holdout_acc,
        "gap": gap,
        "holdout_session_id": holdout_session_id,
        "per_fixture": per_fixture,
        "confusion": confusion,
        "n_train": n_train,
        "n_holdout": n_holdout,
    }


def gap_interpretation(gap: float) -> str:
    if gap <= 0.08:
        return "learned fixture identity — proceed"
    if gap <= 0.20:
        return "substantial session-nuisance learning — more sessions or stronger normalization"
    return "learned the recording session, not the plumbing — do not deploy"


@dataclass
class ActivationDecision:
    allowed: bool
    reason: str


def can_activate(metrics: dict, override: bool = False) -> ActivationDecision:
    """Refuse a model whose gap exceeds AC2 without an explicit override; log
    loudly when overridden. A gate that can be bypassed but records the bypass is
    the right strength — hard-blocking would be wrong (dev needs imperfect
    models), silent activation would let the central quality signal be ignored."""
    gap = metrics.get("gap")
    if gap is None:
        return ActivationDecision(False, "metrics missing 'gap' — cannot evaluate AC2")
    if gap <= AC2_GAP_THRESHOLD:
        return ActivationDecision(True, f"gap {gap:.3f} <= {AC2_GAP_THRESHOLD} (AC2 met)")
    if override:
        return ActivationDecision(True, f"OVERRIDE: gap {gap:.3f} > {AC2_GAP_THRESHOLD} activated anyway")
    return ActivationDecision(False, f"gap {gap:.3f} > {AC2_GAP_THRESHOLD} (AC2 failed) — pass override to force")
