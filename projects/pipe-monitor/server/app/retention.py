"""Storage retention (server/storage-and-retention.md).

Continuous features roll off at 90 days; event clips are kept indefinitely (they
ARE the training corpus). THE SUBTLE BUG this guards against: calibration-session
features must be PINNED, or the holdout evaluation loses its test set after 90
days — the retention job is written in Phase 1, the holdout eval in Phase 2, and
the interaction only bites three months later.

Pure function over a repository so it is unit-tested without a database.
"""
from __future__ import annotations

FEATURE_RETENTION_US = 90 * 86_400_000_000  # 90 days in microseconds


def features_to_delete(feature_rows: list[dict], now_utc_us: int,
                       pinned_session_ids: set[int]) -> list[dict]:
    """feature_rows: [{node_id, t_utc_us, session_id, path}, ...].
    Delete rows older than 90 days EXCEPT those belonging to a pinned
    (calibration/validation) session — those are the holdout test set."""
    cutoff = now_utc_us - FEATURE_RETENTION_US
    out = []
    for r in feature_rows:
        if r["t_utc_us"] >= cutoff:
            continue                       # within window, keep
        if r.get("session_id") in pinned_session_ids:
            continue                       # pinned calibration data, keep [THE BUG GUARD]
        out.append(r)
    return out
