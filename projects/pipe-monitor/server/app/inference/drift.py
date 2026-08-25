"""Drift monitoring (inference/drift-monitoring.md).

Nightly impulse-response comparison, reporting TWO metrics SEPARATELY [HARD]:
  - coupling drift: broad, smooth deviation across frequency -> recalibrate
  - structural change: discrete reflection at a specific delay -> leak/rupture alert
Conflating them makes the drift metric useless as a leak indicator and vice versa.

Also the higher-value use — deconvolution: divide the measured pipe+coupling
response out of the templates to make them coupling-invariant.
"""
from __future__ import annotations

import numpy as np


def separate_drift(ref_logmag: np.ndarray, cur_logmag: np.ndarray, poly_order: int = 4
                   ) -> tuple[float, float, int]:
    """Split the log-magnitude deviation into a smooth (coupling drift) component
    and a residual (structural change). Returns
    (coupling_drift, structural_peak, structural_delay_bin)."""
    dev = cur_logmag.astype(np.float64) - ref_logmag.astype(np.float64)
    x = np.linspace(-1, 1, dev.size)
    coeffs = np.polyfit(x, dev, poly_order)
    smooth = np.polyval(coeffs, x)
    residual = dev - smooth
    coupling = float(np.sqrt(np.mean(smooth ** 2)))         # RMS of smooth part
    peak_bin = int(np.argmax(np.abs(residual)))
    structural = float(np.abs(residual[peak_bin]))
    return coupling, structural, peak_bin


def deconvolve_template(template: np.ndarray, current_irf: np.ndarray,
                        reg: float = 1e-3) -> np.ndarray:
    """Frequency-domain division of the current pipe+coupling response out of a
    template, regularized. If this improves matching accuracy on an old holdout
    session, adopt it as standard (converts the worst long-term failure mode into
    a bounded nightly computation)."""
    T = np.fft.rfft(template)
    H = np.fft.rfft(current_irf, n=template.shape[-1])
    G = T * np.conj(H) / (np.abs(H) ** 2 + reg)
    return np.fft.irfft(G, n=template.shape[-1])
