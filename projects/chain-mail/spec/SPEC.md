# SPEC — Chain-Mail: Parametric Print-in-Place Folding European 4-in-1

**Status:** DRAFT — awaiting sign-off. Do not write SCAD until frozen.
**Target machine:** Bambu Lab P1S + AMS 2, CMYK PLA
**Skill:** `scad-design-to-print`
**Date:** 2026-07-30

---

## 1. Intent

A single parametric OpenSCAD design that prints **as one job, fully articulated, with zero
assembly** (print-in-place) and yields a **wide, flexible European 4-in-1 chainmail sheet**.
Because the unfolded sheet is larger than the build footprint, the part is printed
**pre-folded (accordion / mountain-valley)** to pack maximum unfolded area into the build
volume, then hand-expanded into the flat sheet. Intended use: **dwarf / gnome cosplay** —
chunky ring gauge is on-theme and helps printability.

Non-negotiables (from user):
- **Print-in-place is mandatory** — no post-print assembly of individual rings.
- **Controlled tolerance / gaps** so links articulate and do not fuse.
- **Classic European 4-in-1** weave (authentic drape/look).
- **Math + kinematic validation as we go** — every geometric and motion claim is checked,
  not assumed.

---

## 2. Machine & material constraints (fixed inputs)

| Parameter | Value | Source / consequence |
|---|---|---|
| Printer | Bambu Lab P1S | CoreXY, enclosed, good for PLA |
| Build volume | 256 × 256 × 256 mm | hard ceiling |
| **Usable volume (with buffer)** | **~230 × 230 × 236 mm** | 13 mm XY edge buffer, 20 mm Z headroom |
| Nozzle | 0.4 mm | sets min feature & clearance floor |
| Layer height | 0.2 mm | sets Z resolution of gaps & overhang quality |
| Extrusion width (assumed) | ~0.45 mm | clearance is measured in multiples of this |
| Material | PLA (CMYK spools via AMS 2) | color plan in §7; low warp, brittle-ish |
| Supports | **None permitted** | print-in-place articulation forbids support in the weave |

---

## 3. Ring geometry (the unit cell)

A ring is a torus: **wire diameter `WD`** (cross-section) and **inner diameter `ID`**, with
**outer diameter `OD = ID + 2·WD`** and **aspect ratio `AR = ID / WD`**.

### 3.1 Selected ring — FINER GAUGE (user pick)
| Symbol | Value | Rationale |
|---|---|---|
| `WD` (wire dia) | **1.6 mm** | ~3.5× extrusion width; refined look, still printable print-in-place. Fragility risk is real → validated on M1 coupon before scale-up |
| `AR` (aspect ratio) | **5.0** | E4-1 closes for AR ≳ 3.0–3.5; AR 5 gives good drape + clearance room |
| `ID` | **8.0 mm** | = AR·WD |
| `OD` | **11.2 mm** | = ID + 2·WD; refined, denser drape than the chunky option |

Finer gauge chosen for a more authentic maille look. Cost: **denser weave (~1147 rings/flat
panel vs ~725 chunky)** and tighter gaps → print-in-place margin is smaller, so the M1 gap
coupon is a hard gate. `WD`/`AR` stay **parametric** — if 1.6 mm proves fragile or fuses, we
step back up without redesign.

### 3.2 Print-in-place clearance model
Gap `G` between the wire surfaces of two linked rings must exceed what the slicer can resolve
as a *void* rather than fuse:

| Gap `G` | ≈ extrusion widths | verdict |
|---|---|---|
| 0.30 mm | 0.7 | risky (image's number — treat as stretch goal, must be proven on a coupon) |
| **0.40 mm** | **0.9** | **nominal design clearance** |
| 0.50 mm | 1.1 | safe fallback if 0.40 fuses |

**Design gap = 0.40 mm nominal**, printed both at 0.30 and 0.50 on the first test coupon to
find the real floor for this specific P1S/PLA/profile combination before committing.

---

## 4. Weave: European 4-in-1

- Each interior ring passes through **exactly 4** neighbors (2 in the row above, 2 below).
- Rings sit at an alternating **tilt angle θ** (rows of "left-leaning" and "right-leaning"
  rings). θ is derived from `WD`, `ID`, and the row/column pitch so that all four linkages
  seat without interference — **θ is computed, then verified by collision test, never guessed.**
- Weave parameters (`row_pitch`, `col_pitch`, θ) live in `config.scad` and are validated by
  the aperture/fit scripts, not eyeballed.

---

## 5. Folding & packing (the hard part — honestly scoped)

Folding trades build-volume Z for unfolded area. The naïve estimate (Z ÷ sheet-thickness ≈ 30+
layers) is **wrong** because chainmail cannot fold to a zero-radius crease — each 180°
accordion U-turn consumes ~`2·Rmin` of Z, and `Rmin` sets everything.

**Key architectural decision (user):** we do **not** accept the bulk weave's natural bend
radius (`Rmin ≈ k·OD`). Because the design **places every cell explicitly**, the fold happens
only along **dedicated crease rows** — a single engineered **hinge column** between accordion
panels. These crease links get their **own geometry** (thinner section / higher AR / oriented
axis) tuned purely to fold tightly, while the flat field keeps the authentic E4-1 gauge. This
**decouples fold radius from drape gauge** and is what unlocks aggressive folding.

Feasibility (finer ring OD = 11.2 mm, usable Z = 236 mm):

| Fold model | `Rmin` | Accordion layers | Unfolded run | Area multiplier |
|---|---|---|---|---|
| Bulk-limited, conservative (k≈2.5) | 28 mm | ~5 | ~1.15 m | ~5× |
| Bulk-limited, aggressive (k≈1.5) | 17 mm | ~7 | ~1.6 m | ~7× |
| **Hinge-limited R≈8 mm (target)** | **8 mm** | **~15** | **~3.4 m** | **~15×** |
| Hinge-limited R≈5 mm (stretch) | 5 mm | ~24 | ~5.5 m | ~24× |

**Target single-print output:** a strip on the order of **~3 m long × ~0.23 m wide** if the
hinge design reaches R≈8 mm. `Rmin` is now a **property of the engineered hinge**, pinned by
the M3 fold coupon — not a fixed limit of the weave.

**Scope caveat — cost of aggression (must accept before M5):** a ~15× strip is **~17,000
rings**. That means **multi-day print times**, heavy mesh/slice load, and many AMS filament
swaps. Mitigations baked into the plan: prove per-panel first (M1–M4), keep the model
parametric so strip length is a dial, and treat "one giant print" as optional vs. several
hinge-joinable panels. **Milestones stay small until the hinge and gap are proven.**

Full-garment coverage beyond one strip: print multiple strips and **join at seams with
hand-closed jump rings** (standard maille practice) — does not violate print-in-place *within*
a strip.

Flat panel (no fold, reference): ~226 × 228 mm ≈ **1147 rings**.

### 5.1 Printability of the fold
The accordion is a bellows: each fold layer prints above the last across the gap `G`. Two
candidate strategies, to be decided by test:
- **(A) Rest-contact fold** — upper fold layers physically rest on the rings below (contact,
  not fused via `G`), so every layer is self-supported. Preferred; no bridging over air.
- **(B) Bridged fold** — small spans bridged in air. Only if (A) can't hold the fold geometry.

---

## 6. Kinematic & math validation plan ("as we go")

Every claim below is a **gate**, checked with the skill's tooling (`verify.py`, `check_fit.py`,
`measure_aperture.py`, `check_mesh.py`) plus purpose-built OpenSCAD motion renders:

1. **Ring manifold** — each ring watertight/manifold (`check_mesh.py`).
2. **Link clearance at rest** — min gap between linked rings ≥ `G` (`check_fit.py`,
   expected-clearance = G). No fused pairs.
3. **Weave closure** — θ, pitches produce a valid E4-1 cell with all 4 linkages seated and no
   interference (`check_fit.py` across the 4 neighbors).
4. **Articulation range-of-motion** — sweep each ring through its hinge range; confirm the
   sheet reaches **flat state** with no self-collision (parametric angle sweep → collision test
   at sampled angles).
5. **Fold collapse** — confirm the accordion collapses into `≤ 230×230×236` at fold angle,
   with inter-layer gaps ≥ `G` maintained (packing check).
6. **Fold expand** — confirm continuous motion folded→flat exists without collision (sampled
   ROM along the fold DOF) → this pins the **engineered hinge `Rmin`**.
7. **Crease-link integrity** — the tuned hinge links must survive folding without exceeding
   PLA strain and must still be manifold + non-fused (`check_mesh.py` + `check_fit.py` on the
   crease row specifically).
8. **No-support check** — every overhang in the *as-printed folded* orientation ≤ printable
   angle or bridge length; no support required inside the weave.
9. **Color-map fidelity** — rendered per-ring color map, sampled in unfolded (u,v), matches the
   source image within the quantized palette; verify the map is invariant through the fold
   transform (a ring keeps its unfolded-space color when moved to its folded print position).

A check is **green only when `verify.py` returns pass** — typed numbers are never the proof.

---

## 7. Print / color strategy (P1S + AMS 2, CMYK PLA)

- **Orientation:** as-printed = folded block; flat Z growth = accordion stack. No brim inside
  weave; minimal bed adhesion feature at the folded footprint only.
- **Profile:** 0.2 mm layers, 0.4 mm nozzle, tuned for clean cold-bridging of gap `G`.

### 7.1 Image-to-surface color mapping (user feature — core, not debug)

Color is a **first-class parametric subsystem**: map an arbitrary **SVG / JPG / PNG** onto the
**unfolded** sheet, and preserve that color per-ring **through the fold** so the folded print
carries the picture that appears only when expanded.

Pipeline:
1. **Unfolded parameterization** — every ring has a stable unfolded coordinate `(u,v)` (its
   place in the flat sheet), assigned at generation time and carried as metadata through the
   fold transform. This is the invariant that makes "unfolded image, folded print" work.
2. **Image sampling** — rasterize the source (SVG→raster; JPG/PNG direct), sample at each
   ring's `(u,v)` centroid (area-average over the ring's footprint to avoid aliasing).
3. **Palette quantization** — map each sample to the nearest **AMS lane color**. CMYK PLA = up
   to **4 inks (+ base)**; the image is quantized/dithered to that palette. Dithering across
   adjacent rings is available since ring pitch is the pixel grid.
4. **Per-ring color assignment → slicer** — emit the ring→lane assignment as multi-material
   data (per-object color in the 3MF / by-object painting) so Bambu Studio + AMS 2 print each
   ring in its assigned filament. **Banding** (per-row / per-fold-layer) is just the special
   case where the "image" is a gradient/stripe function.
5. **Fold invariance check** — §6.9 verifies a ring's color is a function of `(u,v)` only, so
   folding never scrambles the picture.

Constraints & honesty: palette is small (≤4–5 colors) → images must survive heavy
quantization (bold, high-contrast art reads best; photos will posterize). Per-ring color
changes drive **AMS swap count and print time up steeply** at strip scale — another reason
milestones stay small until the pipeline is proven on a swatch (M2).

---

## 8. Staged milestones (de-risk before the big print)

| # | Milestone | Deliverable | Gate |
|---|---|---|---|
| M0 | **Spec freeze** | this file | user sign-off |
| M1 | **2-ring link coupon** (WD 1.6) | 1 pair, print-in-place, gaps 0.30/0.40/0.50 | moves freely, no fuse, not fragile → pick real `G` |
| M2 | **Flat E4-1 swatch + color** (~5×5) | small flat sheet with a test image mapped | weave closes/drapes; image-map pipeline (§7.1) reads correctly |
| M3 | **Single hinge-fold coupon** | 1 accordion U-turn w/ engineered crease links | prints & unfolds; **pins hinge `Rmin`**; crease survives strain |
| M4 | **Multi-fold panel** | ~half build volume, color preserved through fold | full fold/expand kinematics green; §6.9 color-invariance green |
| M5 | **Full strip** (~3 m unfolded, hinge-limited) | cosplay-scale panel | `verify.py` all-pass; print-time/AMS budget accepted |
| M6 | **Seam/jump-ring join doc** | assembly guide for multi-strip garments | — |

Each milestone runs `verify.py`; results attach to `DESIGN_REPORT.md`.

---

## 9. Decisions — RESOLVED (user, 2026-07-30)

1. **Ring gauge** → **finer: WD 1.6 / ID 8 / OD 11.2 mm** (§3.1). Accept denser weave +
   tighter print-in-place margin; M1 coupon gates fragility/fusing.
2. **Primary output** → **one large drape strip**, maximized via engineered fold.
3. **Color** → **image-to-surface mapping is a core feature** (§7.1): parametric SVG/JPG/PNG
   onto the unfolded surface, preserved per-ring through the fold; banding is a special case.
4. **Fold aggressiveness** → **engineer the crease/"edge" links for aggressive folding** (§5):
   dedicated hinge rows decouple fold radius from drape gauge; target hinge `Rmin ≈ 8 mm`
   (~15× area), pinned by the M3 coupon.

### 9.1 New risks these choices introduce (accepted, tracked)
- **R1 — finer wire fragility:** 1.6 mm PLA links may snap under wear → M1 gate + parametric fallback.
- **R2 — scale explosion:** ~15× strip ≈ 17k rings → multi-day prints, heavy slice, many AMS swaps → keep strip length a dial; prove per-panel first.
- **R3 — hinge strain:** aggressive crease links may over-strain PLA in the fold → §6.7 + M3.
- **R4 — palette posterization:** ≤4–5 inks → only bold art reads; set expectations on source images.

---

## 10. Deliverable tree (per skill)

```
projects/chain-mail/
├── spec/SPEC.md            # this (frozen after sign-off)
├── src/config.scad         # single source of truth for all numbers
├── src/ring.scad           # parametric torus ring (field + crease variants)
├── src/weave.scad          # E4-1 cell + sheet tiling, per-ring (u,v) metadata
├── src/hinge.scad          # engineered crease/fold-line links (§5)
├── src/fold.scad           # accordion transform + as-printed layout
├── src/assembly.scad       # top-level: folded print model
├── tools/colormap.py       # image→(u,v)→AMS-palette per-ring color pipeline (§7.1)
├── stl/ 3mf/ step/ renders/
├── libs/BOSL2/             # vendored
├── tools/                  # copies of verify scripts used
├── build.3mf               # ready-to-slice
├── README.md  DESIGN_REPORT.md
```
```
```
