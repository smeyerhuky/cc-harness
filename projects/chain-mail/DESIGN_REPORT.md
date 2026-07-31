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

---

## M2 — flat E4-1 weave (in progress): linking rules + tiling constraint

Characterized the weave geometry with the M1 tools (`check_fit` + `linking_number`):

**Linking rules (opposite-tilt +T / −T rings):**
- Pure **X** offset `(cx, 0)` → **no link** (Lk 0) at any tilt/spacing tested.
- Pure **Y** offset `(0, cy)` → **links** (Lk +1), clearance grows with `cy`.
- **Diagonal** `(dx, dy)` → **links** (Lk +1) — this is the M1 pair, and the real E4-1 link
  (each ring threads 4 diagonal neighbors in the rows above/below).

**Tiling constraint (measured):**
- Same-row, same-tilt rings clear at **px ≥ 7.4 mm** (collision 0). Good.
- Same-tilt rings **two rows apart** `(0, 6 mm)` **collide** (5.5 mm³) and don't clear until
  ~12 mm. But the diagonal link needs `dy ≈ 3 mm` → same-tilt repeats every `2·dy = 6 mm` →
  collision.

**Conclusion:** a **perfectly flat** E4-1 (all rings at one Z) cannot tile at this gauge
(OD 11.2 rings are too fat for the tight weave). The real solution — used by both metal and
printed maille — is a **woven over-under sheet ~2 wire-diameters thick**: rings alternate Z so
same-tilt neighbors clear vertically. Still print-in-place: elevated rings **rest on** lower
rings (contact, printable), so nothing floats. Next M2 step: build the woven-height E4-1 unit
cell and verify all-links-Lk1 + all-pairs-collision-free + every-ring-bed-or-rest-supported.

### M2 research pivot — printed foldable fabrics (NASA / Daraio)

Grounded the fold/pack concept in the literature ([KB lesson](../../kb/additive-engineering/metamaterials/printed-foldable-fabrics.md)):
NASA JPL "space fabric" (one-piece printed, *"small squares strung together,"* foldable) and
Caltech/Daraio *Nature* 2021 structured fabrics (one-piece interlocking octahedra/particles;
drape → jam-pack → 25× stiffer). Both prove the vision but use **powder-bed** processes where
un-sintered powder supports every overhang; **our FDM (P1S) print-in-place-without-support is the
real remaining work**. Decision (user): **prototype both unit shapes on FDM, stay on the P1S**.

**Unit comparison (`compare/`).** The M1 opposite-tilt interlink applied to **round rings** vs
**square box-links** (the NASA "small squares" aesthetic). A woven zigzag band of each is verified
manifold, bed-contacting (z 0.000–6.400 mm), round pair `Lk = +1`. Renders:
`renders/compare_round.png`, `renders/compare_square.png`. Print both to compare drape/pack/print.

### Whole-assembly collision gate (`tools/collision_scan.py`) — REQUIRED

Per the tolerance/no-fusing requirement, collision detection is now a first-class **whole-assembly**
gate, not pairwise spot-checks. `collision_scan.py` splits an assembly STL into every link and
checks all spatially-near pairs for (1) **fusion** (intersection volume ≤ eps → no meshed walls)
and (2) **tolerance** (min surface clearance ≥ tol−margin everywhere). Results:

| Band | components | pairs | fused | min clearance | verdict |
|---|---|---|---|---|---|
| round | 9 | 30 | 0 | 0.289 mm | **PASS** |
| square | 9 | 30 | 0 | 0.708 mm | **PASS** |

No walls meshed; tolerance honored across the whole assembly. **Next:** extend to a *kinematic*
sweep (articulate links through their range of motion and re-scan) so no collision occurs at any
reachable pose, not just at rest.

---

## M2 — flat European 4-in-1 weave SOLVED (round + square plates)

**Result:** a valid, printable, flat E4-1 sheet for both round and square links — collision-free,
genuinely interlinked, and validated kinematically at full-plate scale.

### The unlock
Rigid tiling had failed because early attempts used row pitch `py ≈ 3 mm`, placing same-tilt
neighbours 6 mm apart → fusion. Measuring the link envelope showed the opposite-tilt interlink
**survives to `dy = 6 mm`** (Lk +1), while same-tilt rings clear at **≥ 12 mm**. Row pitch
**`py = 6`** satisfies both, and the sheet stays **flat** (every ring on the bed — no
woven-height, no support).

### Verified weave (row-brick, rows lean ±30°, odd rows staggered px/2)
| Unit | px | py | min clearance | interior links |
|---|---|---|---|---|
| round | 6.8 | 6.0 | 0.58 mm | all 4 `|Lk|=1` |
| square | 7.5 | 6.5 | 0.69 mm | all 4 `|Lk|=1` |
Locked in `src/config.scad` (`WEAVE_*`).

### Full-plate validation (all gates green)
| Plate | rings | footprint | fused | min clr | interlinked | watertight | kinematic ±12° |
|---|---|---|---|---|---|---|---|
| round | 957 (29×33) | 204×203 mm | 0 | 0.58 mm | all 4 ✓ | 957/957 ✓ | no collision ✓ |
| square | 780 (26×30) | 201×200 mm | 0 | 0.69 mm | all 4 ✓ | 780/780 ✓ | no collision ✓ |

### New tooling
- `tools/build_plate.py` — instances one unit link across the weave to export a printable
  full-bed plate STL (CGAL can't handle ~1000 rings). Reports rings, footprint, watertightness.
- `tools/sheet_scan.py` — rewritten to the verified row-brick lattice; adds `--links` (interior
  interlink check, parity-aware) and `--flex-sweep` (kinematic ROM gate).

### Next
Physically print both plates (0.4 nozzle / 0.2 layer, GAP 0.30) and confirm drape/no-fuse; then
carry the winning unit into the folding/packing work (M3+).
