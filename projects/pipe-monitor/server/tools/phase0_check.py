#!/usr/bin/env python3
"""Phase 0 numeric gate checks (kb/plan/phase-0-bringup.md).

Given per-fixture clip spectra (and a mains-hum estimate), report the three
numeric Phase-0 criteria so the gate is decided by numbers, not vibes:
  - within-fixture valve-closure cross-correlation rho > 0.8
  - mains-hum band energy >= 20 dB below flow-noise band energy
  - CV sanity: most bins should have HIGH coefficient of variation
    (if most are low-CV, the sensor is not seeing the fixtures)

This is a scaffold CLI: it operates on .npy inputs so it runs before any server
DB exists. Wire it to the clip store once Phase 0 recordings are in.
"""
import argparse
import sys
import numpy as np


def within_fixture_rho(examples: np.ndarray) -> float:
    """Mean pairwise normalized cross-correlation of aligned closure windows."""
    n = examples.shape[0]
    if n < 2:
        return float("nan")
    X = examples.reshape(n, -1)
    X = X - X.mean(axis=1, keepdims=True)
    norms = np.linalg.norm(X, axis=1, keepdims=True)
    X = X / np.where(norms > 1e-12, norms, 1.0)
    C = X @ X.T
    iu = np.triu_indices(n, k=1)
    return float(C[iu].mean())


def hum_margin_db(spectrum: np.ndarray, freqs: np.ndarray,
                  hum_hz=60.0, flow_band=(50, 700)) -> float:
    hum_mask = np.abs((freqs % hum_hz)) < 2.0
    flow_mask = (freqs >= flow_band[0]) & (freqs <= flow_band[1])
    hum = spectrum[hum_mask].mean() if hum_mask.any() else 1e-12
    flow = spectrum[flow_mask].mean() if flow_mask.any() else 1e-12
    return float(10 * np.log10((flow + 1e-12) / (hum + 1e-12)))


def cv_fraction_informative(spectra: np.ndarray, keep_cv=0.05) -> float:
    mean = spectra.mean(axis=0); std = spectra.std(axis=0)
    cv = np.divide(std, np.abs(mean), out=np.zeros_like(std), where=np.abs(mean) > 1e-9)
    return float((cv >= keep_cv).mean())


def main(argv=None):
    ap = argparse.ArgumentParser(description="Phase 0 numeric gate checks")
    ap.add_argument("--closures", help=".npy (n_examples, win, bins) aligned closure windows")
    ap.add_argument("--spectrum", help=".npy (bins,) a representative flow spectrum")
    ap.add_argument("--freqs", help=".npy (bins,) frequency of each bin (Hz)")
    ap.add_argument("--corpus", help=".npy (n_frames, bins) for CV sanity")
    a = ap.parse_args(argv)

    ok = True
    if a.closures:
        rho = within_fixture_rho(np.load(a.closures))
        passed = rho > 0.8
        ok &= passed
        print(f"[{'PASS' if passed else 'FAIL'}] within-fixture rho = {rho:.3f} (need > 0.8)")
    if a.spectrum and a.freqs:
        m = hum_margin_db(np.load(a.spectrum), np.load(a.freqs))
        passed = m >= 20.0
        ok &= passed
        print(f"[{'PASS' if passed else 'FAIL'}] hum margin = {m:.1f} dB (need >= 20)")
    if a.corpus:
        frac = cv_fraction_informative(np.load(a.corpus))
        passed = frac >= 0.5
        ok &= passed
        print(f"[{'PASS' if passed else 'FAIL'}] informative-bin fraction = {frac:.2f} "
              f"(low ⇒ sensor not seeing fixtures)")
    if not (a.closures or a.spectrum or a.corpus):
        ap.print_help(); return 2
    print("\nPhase 0 gate:", "PASS" if ok else "FAIL — do not proceed; reposition or pivot")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
