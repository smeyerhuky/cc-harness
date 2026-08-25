"""Leak detection (inference/leak-detection.md). Two independent detectors;
alert on EITHER. Both are implemented in shape; thresholds/baseline are Phase-4
placeholders tuned against an induced leak.

Passive: band energy (50-700 Hz metallic; <200 Hz plastic — CORRECTED from the
spec's 200 Hz-2 kHz) during periods the state machine reports all fixtures
closed, using ABSOLUTE level (scale_db), sustained over 3 nights.

Active: nightly chirp IRF compared against a stored reference (more sensitive;
small leaks never clear the passive noise floor). Handled with drift.py.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class PassiveLeakDetector:
    band_lo_hz: int = 50           # server-configurable; sweep vs induced leak in Phase 4
    band_hi_hz: int = 700
    margin_db: float = 3.0         # rise above baseline that counts
    persist_nights: int = 3        # main false-alarm defence (AC6)
    baseline_db: float | None = None
    _nights_over: int = 0
    history: list[float] = field(default_factory=list)

    def set_baseline(self, nightly_min_db: float) -> None:
        self.baseline_db = nightly_min_db

    def observe_night(self, nightly_min_db: float, all_closed: bool) -> bool:
        """Feed one night's minimum band energy (from scale_db) measured while all
        fixtures were closed. Returns True when a sustained leak is declared."""
        self.history.append(nightly_min_db)
        if self.baseline_db is None or not all_closed:
            return False
        if nightly_min_db > self.baseline_db + self.margin_db:
            self._nights_over += 1
        else:
            self._nights_over = 0
        return self._nights_over >= self.persist_nights
