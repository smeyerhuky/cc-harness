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
- `src/coupon.scad` — printable linked pair in the real E4-1 lean pose.
- `src/coupon_plate.scad` — the M1 test plate (3 gap pairs).

### Two bugs found and fixed during M1

**Bug 1 — floating parts (print orientation).** The first coupon used a perpendicular link
(ring A flat, ring B axis-vertical) and lifted the whole plate, so rings hovered above the bed
and the slicer flagged **floating parts**. Inherent to an *isolated* print-in-place link: with
sub-millimetre clearances every ring is its own island, and any island not touching the bed
cannot print. **Every ring needs its own bed-contact point.**

**Bug 2 — not actually interlinked (topology).** The first "fix" gave both rings the *same*
30° tilt. Two circles in **parallel planes can never link** — they were just two separate rings
sitting 0.4 mm apart. `check_fit.py` reported collision 0 and clearance 0.4, but **collision-free
≠ linked**; my XY-overlap heuristic was invalid. Caught by inspection of the side elevation.

**Fix (both bugs):** rings lean in **opposite** directions — ring A **+30°**, ring B **−30°** —
offset diagonally. Opposite tilt gives non-parallel planes, so the rings **genuinely interlink**,
while each ring's low point still rests on the bed (z = 0). This mirrors how real European 4-in-1
alternates ring lean. Plate z-range **0.000 – 6.400 mm** → sits on the bed, no support, no
floating, only 6.4 mm tall.

### New verification: topological linking number
Added [`tools/linking_number.py`](tools/linking_number.py) — the discrete **Gauss linking
integral** over the two ring centrelines. `|Lk| = 1` proves a true interlink; `Lk = 0` means
not linked. This is now a required gate alongside `check_fit.py`, because non-collision alone
does not prove a link. Sanity: same-tilt pair → **Lk 0.000**; opposite-tilt pair → **Lk +1.000**.

### Key results (all MEASURED, not asserted)
Tilt +30/−30, dy 3 mm; the crossing gap is set by dx; every rung is a verified interlink:

| Target gap | dx (mm) | Measured clearance | Collision | Linking number |
|---|---|---|---|---|
| 0.30 (tight) | 3.7 | 0.306 mm | 0.000 mm³ | **Lk +1.000** |
| 0.40 (nominal) | 3.4 | 0.403 mm | 0.000 mm³ | **Lk +1.000** |
| 0.50 (safe) | 3.1 | ~0.51 mm | 0.000 mm³ | **Lk +1.000** |

All three go on the plate so one physical print reveals which gap the P1S/PLA/profile resolves
without fusing.

### Verification
`verify.py .` → **exit 0, all checks pass**: tree, spec, renders, every mesh watertight/manifold,
all 3 `fit_checks.json` pairs within tolerance. Independent linkage pass: all three pairs
**Lk +1.000**. Fit spec: [`spec/fit_checks.json`](spec/fit_checks.json).

### M1 PHYSICAL RESULT — PASSED (2026-07-30)
All three pairs printed on the P1S (0.4 nozzle / 0.2 layer): **every pair released and
articulated freely, none fused.** User selected the tightest, **GAP = 0.30 mm (dx 3.7)**, as
the locked design clearance. Recorded in `config.scad` as `GAP`, `LINK_TILT`, `LINK_DX/DY`.
The fusing floor is at or below 0.30 mm for this machine/material/profile.

### Finding carried to M2 (weave tiling)
While validating the pair I confirmed the **diagonal** neighbor (dx 4, dy 3) links cleanly, but
naïvely tiling a full grid **collides on same-column neighbors** (offset (0,3) → 9 mm³, (0,6) →
5.5 mm³ at a single global tilt/height). So a valid E4-1 sheet needs a proper sublattice /
woven height structure, not a uniform grid — this is the core M2 problem, now scoped concretely.

**Status: M1 printable + verified. Awaiting physical print to pick `G`.**
