"""Steady-state unmixing by supervised NMF (inference/steady-state-unmixing.md).

The CONFIRMATORY path: "which fixtures are running right now?" Learn one spectral
basis per fixture from single-fixture recordings, hold the basis FIXED at
inference, solve for non-negative activations.

[HARD] Multi-label, not multi-class: output is an independent probability per
fixture (sigmoid-like threshold on activation), never softmax. A shower and a tap
can run simultaneously; forcing a single choice is a modelling error.

Prerequisite [HARD]: validate additivity (A4) before trusting this. Building on
violated superposition produces confident nonsense rather than clean failure.

Stub status: the NNLS solve is real; bases are learned from single-fixture data
you don't have yet.
"""
from __future__ import annotations

import numpy as np


class SupervisedNMF:
    def __init__(self, activation_threshold: float = 0.5, iters: int = 200):
        self.W: np.ndarray | None = None          # (n_bins, n_fixtures) fixed bases
        self.fixtures: list[str] = []
        self.activation_threshold = activation_threshold
        self.iters = iters

    def fit_bases(self, singles: dict[str, np.ndarray]) -> None:
        """One basis column per fixture = mean single-fixture spectrum (>=0)."""
        self.fixtures = sorted(singles)
        cols = [np.clip(singles[f].mean(axis=0), 0, None) for f in self.fixtures]
        W = np.stack(cols, axis=1)
        # normalize columns so activations are comparable across fixtures
        norms = np.linalg.norm(W, axis=0, keepdims=True)
        self.W = W / np.where(norms > 1e-9, norms, 1.0)

    def unmix(self, spectrum: np.ndarray) -> dict[str, float]:
        """Multiplicative-update NNLS for activations h >= 0 s.t. W h ~= x."""
        if self.W is None:
            raise RuntimeError("bases not fit (no calibration data yet)")
        x = np.clip(spectrum.astype(np.float64), 0, None)
        W = self.W
        h = np.full(W.shape[1], 0.1)
        WT = W.T
        for _ in range(self.iters):
            wh = W @ h + 1e-9
            h *= (WT @ x) / (WT @ wh + 1e-9)
        return {f: float(a) for f, a in zip(self.fixtures, h)}

    def active_set(self, spectrum: np.ndarray) -> set[str]:
        """Multi-label: every fixture whose activation clears the threshold."""
        acts = self.unmix(spectrum)
        mx = max(acts.values()) if acts else 0.0
        if mx <= 1e-9:
            return set()
        return {f for f, a in acts.items() if a / mx >= self.activation_threshold}
