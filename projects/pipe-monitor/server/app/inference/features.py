"""Feature preprocessing (inference/feature-selection.md).

Three cheap techniques that substitute for model capacity: CV-based bin pruning,
a dual moving average (a hand-specified 2-D convolution), and per-vector min-max
normalization. All published on this exact task (Comai et al. 2025).

Leakage discipline: the CV mask is computed ONCE from the training partition and
frozen. Recomputing per-batch would leak test statistics into preprocessing — a
subtle variant of the leak session holdout exists to catch.
"""
from __future__ import annotations

import numpy as np


def cv_mask(train_spectra: np.ndarray, keep_cv: float = 0.05) -> np.ndarray:
    """Coefficient of variation per bin over the TRAINING corpus. Returns a
    boolean keep-mask. A bin with CV < keep_cv is invariant → carries no info.

    Also a Phase-0 sanity check: if most bins come back low-CV, the sensor is not
    seeing the fixtures (a failure found numerically rather than visually)."""
    mean = train_spectra.mean(axis=0)
    std = train_spectra.std(axis=0)
    cv = np.divide(std, np.abs(mean), out=np.zeros_like(std), where=np.abs(mean) > 1e-9)
    return cv >= keep_cv


def dual_moving_average(spectra: np.ndarray, m_freq: int = 5, n_time: int = 8) -> np.ndarray:
    """Smooth along frequency (window m) then time (window n). This IS a discrete
    2-D convolution with uniform kernels — the substitute for a CNN's learned
    first layer. m>=15 erases distinguishing features; n>16 adds latency."""
    x = spectra.astype(np.float64)
    if m_freq > 1:
        k = np.ones(m_freq) / m_freq
        x = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), axis=1, arr=x)
    if n_time > 1 and x.shape[0] >= n_time:
        k = np.ones(n_time) / n_time
        x = np.apply_along_axis(lambda c: np.convolve(c, k, mode="same"), axis=0, arr=x)
    return x


def per_vector_minmax(spectra: np.ndarray) -> np.ndarray:
    """Normalize each frame to [0,1] by its own min/max: makes classification
    depend on spectral SHAPE not level (robust to pressure/gain drift).

    NOTE: this destroys absolute level — the leak detector must use scale_db
    separately, never these normalized vectors (feature-batch-format.md)."""
    lo = spectra.min(axis=1, keepdims=True)
    hi = spectra.max(axis=1, keepdims=True)
    rng = np.where((hi - lo) > 1e-9, hi - lo, 1.0)
    return (spectra - lo) / rng


def preprocess(spectra: np.ndarray, mask: np.ndarray,
               m_freq: int = 5, n_time: int = 8) -> np.ndarray:
    """Full chain: CV mask (frozen) -> dual MA -> per-vector min-max."""
    x = spectra[:, mask]
    x = dual_moving_average(x, m_freq, n_time)
    x = per_vector_minmax(x)
    return x
