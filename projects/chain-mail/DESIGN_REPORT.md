# Chain-Mail — Design Report

Engineering justification and verification log. Grows one section per milestone.
Governing spec: [`spec/SPEC.md`](spec/SPEC.md) (FROZEN 2026-07-30).

---

## M1 — Two-ring print-in-place linkage coupon

**Goal (SPEC §9):** prove print-in-place linkage releases and articulates, and find the
wire-to-wire gap floor before the fusing risk at scale. Gate: moves freely, no fuse, not
fragile → pick real `G`.

### Toolchain
- OpenSCAD 2021.01 (headless via `xvfb-run`), BOSL2 vendored, trimesh/manifold3d for checks.
- All numbers flow from [`src/config.scad`](src/config.scad) (single source of truth).

### What was built
- `src/ring.scad` — parametric torus ring (`WD` 1.6, `ID` 8.0, `OD` 11.2 finer gauge).
- `src/coupon.scad` — canonical perpendicular linked pair, offset + lateral-shift parametric.
- `src/coupon_plate.scad` — the printable M1 test plate (4 pairs).

### Key results (MEASURED with `check_fit.py`, not asserted)
1. **Linkage is collision-free and topologically valid.** Offset sweep 4.0–6.0 mm → collision
   volume **0.000 mm³** at every step; rings are linked, not fused.
2. **Slack pose has ~3.19 mm of play** at the centred pose (offset 4.8) — matches the geometric
   maximum `(ID − WD)/2 = 3.2 mm`, confirming the model behaves exactly as the math predicts.
   This is far above the printable floor → free articulation is guaranteed.
3. **Tolerance ladder calibrated.** Lateral shift of the threaded ring maps monotonically to
   the tightest wire gap:

   | Target gap | Shift (mm) | Measured min clearance (mm) |
   |---|---|---|
   | 0.50 (safe) | 2.70 | 0.525 |
   | 0.40 (nominal) | 2.80 | 0.413 |
   | 0.30 (tight) | 2.90 | 0.305 |

   These three go on the plate so a single physical print reveals which gap the P1S/PLA/profile
   resolves without fusing.

### Verification
`verify.py .` → **exit 0, all checks pass**: tree, spec, renders, every mesh watertight/manifold
(0 non-manifold edges, 0 degenerate faces), and all 4 `fit_checks.json` pairs within tolerance.
Fit spec: [`spec/fit_checks.json`](spec/fit_checks.json). Renders in `renders/`.

### Open item carried to M2
- **Print orientation.** The coupon's threaded ring currently prints axis-vertical (overhang-
  heavy). The printable E4-1 *lean* pose (rings tilted ~30–60° to the bed, self-supporting)
  is finalized at the M2 swatch, where real weave clearances are also measured. The M1 plate
  remains valid for topology + the fusing-floor test as printed.

**Status: M1 geometry + verification complete. Awaiting physical print to pick `G`.**
