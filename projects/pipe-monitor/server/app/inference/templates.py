"""Transient classification by template matching (inference/transient-classification.md).

The PRIMARY classifier: "which fixture just changed state?" Normalized
cross-correlation against per-fixture template banks (median of aligned training
examples). Interpretable when it fails, trains in seconds — a legitimate endpoint
at this data scale, not a warm-up (HydroSense reached 97.9% with templates).

Separate open/close banks per fixture (do not assume symmetry). Emits confidence
and ABSTAINS below threshold rather than forcing a wrong label.

Stub status: the algorithm is complete; the bank is empty until calibration clips
exist. add_template() populates it from real data.
"""
from __future__ import annotations

import numpy as np


def align_on_onset(clip_spec: np.ndarray, onset_frame: int, win: int) -> np.ndarray:
    """Align a 500 ms window on the ENERGY ONSET, not the detector trigger (which
    lags by the >=3-frame confirmation). The 10 s pre-roll guarantees the onset is
    inside the clip."""
    a = max(0, onset_frame)
    return clip_spec[a:a + win]


def normalized_xcorr(a: np.ndarray, b: np.ndarray) -> float:
    a = a.ravel().astype(np.float64); b = b.ravel().astype(np.float64)
    n = min(a.size, b.size)
    a, b = a[:n] - a[:n].mean(), b[:n] - b[:n].mean()
    den = (np.linalg.norm(a) * np.linalg.norm(b))
    return float(a @ b / den) if den > 1e-12 else 0.0


class TemplateBank:
    def __init__(self, abstain_below: float = 0.6):
        # key: (fixture, direction) -> template matrix (win, bins)
        self._bank: dict[tuple[str, str], np.ndarray] = {}
        self.abstain_below = abstain_below

    def add_template(self, fixture: str, direction: str, examples: list[np.ndarray]) -> None:
        """Template = median of aligned training examples (robust to outliers)."""
        stack = np.stack([e.astype(np.float64) for e in examples], axis=0)
        self._bank[(fixture, direction)] = np.median(stack, axis=0)

    def classify(self, window: np.ndarray) -> tuple[str | None, str | None, float]:
        """Returns (fixture, direction, confidence). fixture=None => ABSTAIN.
        An abstention still tells the state machine *something* changed."""
        best, best_rho = None, -1.0
        for (fx, dr), tmpl in self._bank.items():
            rho = normalized_xcorr(window, tmpl)
            if rho > best_rho:
                best, best_rho = (fx, dr), rho
        if best is None or best_rho < self.abstain_below:
            return None, None, max(best_rho, 0.0)
        return best[0], best[1], best_rho

    def __len__(self) -> int:
        return len(self._bank)
