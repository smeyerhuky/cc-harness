#!/usr/bin/env python3
"""Render per-fixture spectrogram panels — the Phase 0 DELIVERABLE.

Phase 0 produces no code; its output is the plots that let a human confirm
fixtures are visually separable at the sensor position. This CLI takes stacked
per-fixture spectra (.npz: name -> (frames, bins)) and writes a PNG grid.

matplotlib is imported lazily so the rest of the server has no hard dep on it.
"""
import argparse
import sys


def main(argv=None):
    ap = argparse.ArgumentParser(description="Render Phase-0 spectrogram panels")
    ap.add_argument("npz", help=".npz mapping fixture name -> (frames, bins) array")
    ap.add_argument("-o", "--out", default="phase0_spectrograms.png")
    a = ap.parse_args(argv)

    import numpy as np
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        print("matplotlib not installed: pip install matplotlib", file=sys.stderr)
        return 2

    data = np.load(a.npz)
    names = list(data.files)
    cols = min(3, len(names)) or 1
    rows = (len(names) + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(4 * cols, 3 * rows), squeeze=False)
    for i, name in enumerate(names):
        ax = axes[i // cols][i % cols]
        ax.imshow(data[name].T, aspect="auto", origin="lower", cmap="magma")
        ax.set_title(name); ax.set_xlabel("frame"); ax.set_ylabel("bin")
    for j in range(len(names), rows * cols):
        axes[j // cols][j % cols].axis("off")
    fig.tight_layout(); fig.savefig(a.out, dpi=120)
    print(f"wrote {a.out} ({len(names)} fixtures) — inspect: are fixtures visually separable?")
    return 0


if __name__ == "__main__":
    sys.exit(main())
