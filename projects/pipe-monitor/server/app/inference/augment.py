"""Synthetic data augmentation (inference/synthetic-data-augmentation.md).

Solves the 2^N combinatorial coverage problem: because the DFT is linear, the
spectrum of simultaneous sources is the sum of their individual spectra, so
overlapped training examples are synthesized by linearly combining single-fixture
recordings.

HYGIENE [HARD]: the augmentation function takes ONLY the training-session subset
as input and has no handle on the holdout partition — composing a synthetic
example from a holdout recording leaks the holdout invisibly (the synthetic
example is not literally in the test set, so no leakage check catches it). This
is enforced structurally here: there is simply no parameter through which holdout
data could enter.
"""
from __future__ import annotations

import numpy as np

# Fixtures whose operation is a temporal SEQUENCE (surge/refill/stop) must NOT be
# randomly combined frame-wise — it destroys the pattern. Excluded from mixing.
SEQUENCE_FIXTURES = frozenset({"toilet"})


def synthesize_overlaps(
    train_singles: dict[str, np.ndarray],
    n_synth: int,
    rng: np.random.Generator,
    max_sources: int = 3,
    alpha_range: tuple[float, float] = (0.5, 1.0),
    gamma: float = 0.05,
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Compose overlapped spectra from single-fixture training frames only.

    train_singles: {fixture_name: (n_frames, n_bins)} — TRAINING partition only.
    Returns (X, Y, fixture_order): X (n_synth, n_bins), Y multi-label (n_synth, F).

    Composition model (published): FFT_new = sum_i(FFT_i * a_i) + noise,
    noise ~ N(0, (gamma*std)^2). Vary a_i for quieter/masked sources; gamma sets
    the SNR (gamma 0.03-0.1 ~ 20-30 dB; 0.3 ~ 10 dB; >=0.6 < 5 dB)."""
    fixtures = [f for f in train_singles]
    if not fixtures:
        raise ValueError("no training singles provided")
    n_bins = next(iter(train_singles.values())).shape[1]
    order = sorted(fixtures)
    idx = {f: i for i, f in enumerate(order)}

    X = np.zeros((n_synth, n_bins))
    Y = np.zeros((n_synth, len(order)))
    mixable = [f for f in order if f not in SEQUENCE_FIXTURES]

    for s in range(n_synth):
        k = rng.integers(1, max_sources + 1)
        chosen = list(rng.choice(mixable, size=min(k, len(mixable)), replace=False))
        acc = np.zeros(n_bins)
        for f in chosen:
            frames = train_singles[f]
            row = frames[rng.integers(0, frames.shape[0])]
            a = rng.uniform(*alpha_range)          # attenuation (quieter/masked source)
            acc = acc + a * row
            Y[s, idx[f]] = 1.0
        noise = rng.normal(0.0, gamma * (acc.std() + 1e-9), size=n_bins)
        X[s] = acc + noise
    return X, Y, order
