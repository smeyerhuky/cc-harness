# Chain Mail — Project Handoff

**One document to pick up this project cold.** It covers what we're building, every decision and
measured result so far, the tools and how to run them, what's done vs. in progress, and the
concrete next steps. Authoritative detail lives in the files this points to; this is the map.

- **Status:** M1 complete (physically printed & validated). M2 (woven sheet) in progress.
- **Locked design clearance:** `GAP = 0.30 mm`.
- **Last updated:** 2026-07-30.
- **Branch:** `claude/chain-mail-project-euamyr`.

---

## 1. What we're building

A **single parametric OpenSCAD model** that prints **as one job, fully articulated, with zero
assembly** (print-in-place) and yields a **wide, flexible European 4-in-1 chainmail sheet**.
Because the unfolded sheet is larger than the printer's footprint, it is printed **pre-folded**
(accordion) to pack maximum area into the build volume, then hand-unfolded into the flat sheet.
Intended for **dwarf / gnome cosplay**.

**Non-negotiables:**
- **Print-in-place** — no post-print assembly of rings.
- **Controlled tolerance** — links articulate, never fuse.
- **Classic European 4-in-1** weave.
- **Math + kinematic validation as we go** — measured, never assumed.

**Target machine/material:** Bambu Lab **P1S** + **AMS 2**, **CMYK PLA**. Build volume 256³ mm
(usable ~**230 × 230 × 236 mm** with buffer). **0.4 mm** nozzle, **0.2 mm** layers.

**Authoritative sources this handoff digests:**
- `spec/SPEC.md` — the **FROZEN** specification (governs all decisions).
- `src/config.scad` — the **single source of truth** for every numeric parameter.
- `DESIGN_REPORT.md` — the measured engineering log, one section per milestone.
- `kb/` — the project knowledge base (OKF); start at `kb/index.md`.

---

## 2. Project layout

```
projects/chain-mail/
├── HANDOFF.md            # this document
├── CLAUDE.md             # rules for working in this project
├── README.md  version.json
├── spec/
│   ├── SPEC.md           # FROZEN specification
│   └── fit_checks.json   # automated clearance checks (consumed by verify.py)
├── src/
│   ├── config.scad       # SINGLE SOURCE OF TRUTH — all numbers
│   ├── ring.scad         # parametric torus ring
│   ├── coupon.scad       # M1 interlinked pair (opposite tilt), parametric
│   └── coupon_plate.scad # M1 printable test plate (3 gap pairs)
├── tools/
│   ├── linking_number.py # Gauss linking-number gate (proves interlink)
│   └── check_fit.py check_mesh.py verify.py measure_aperture.py  # skill tooling copies
├── stl/ renders/         # exported meshes + iso/top/section PNGs
├── kb/                   # OKF knowledge base (overview/design/findings/process/structure)
└── libs/BOSL2/           # vendored (gitignored; re-clone if absent)
```

---

## 3. Design decisions (from the frozen spec)

| # | Decision | Value / approach |
|---|---|---|
| 1 | Ring gauge | **finer**: `WD 1.6 / ID 8 / OD 11.2 mm`, `AR 5` |
| 2 | Primary output | one large **drape strip**, maximized via engineered fold |
| 3 | Color | **image-to-surface mapping** is core (`color_mode` off/band/image); prototypes default `off` |
| 4 | Fold aggressiveness | **engineered crease/hinge links** decouple fold radius from drape gauge; target hinge `Rmin ≈ 8 mm` (~15× area) |
| 5 | WebGPU physics visualizer | in scope — cloth-fidelity digital twin that crossvalidates the analytic fold kinematics |

**Distinctive subsystems (spec §5, §7, §8):**
- **Engineered hinge folding** — a dedicated crease row folds tight while the field keeps the
  authentic gauge. Feasibility: hinge `Rmin ≈ 8 mm` → ~15 accordion layers → **~3.4 m** unfolded
  strip. Honest cost: that strip is **~17,000 rings** → multi-day prints, heavy slicing, many AMS
  swaps. Strip length stays a dial; prove per-panel first.
- **Image-to-surface color** — every ring carries a stable **unfolded `(u,v)`** coordinate; sample
  an SVG/JPG/PNG at `(u,v)`, quantize to the ≤4-ink AMS palette, and the color rides with the ring
  through the fold so the picture appears only when unfolded.
- **WebGPU visualizer** — XPBD cloth simulation at ring fidelity, sharing the SCAD data contract;
  its *emergent* minimum fold radius must agree with the analytic `Rmin` (a cross-check).

---

## 4. Configuration (current values in `src/config.scad`)

```
WD 1.6   ID 8.0   OD 11.2   AR 5           # ring geometry (finer gauge)
GAP 0.30            (GAP_ALT_04 0.40, GAP_ALT_05 0.50)   # chosen at M1
LINK_TILT 30   LINK_DX 3.7   LINK_DY 3.0   # M1-calibrated interlink basis (Lk +1)
HINGE_WD 1.2   HINGE_AR 6.5   HINGE_RMIN 8 # engineered crease links (M3 tunes)
COLOR_MODE "off"                           # off | band | image
BED 256   USABLE 230×230×236               # P1S with buffer
NOZZLE 0.4   LAYER_H 0.2   EXTRUSION_W 0.45
```

Edit numbers **here**, never downstream.

---

## 5. What's been built and tested — M1 (DONE, physical)

**Goal:** a print-in-place linked pair that releases, articulates, and doesn't fuse → pick the
real design clearance `G`.

### Two bugs found and fixed (the important learnings)
1. **Floating parts.** An *isolated* print-in-place link floats: with sub-mm clearances **every
   ring is its own island**, and any island not touching the bed can't print. → **Every ring needs
   its own bed-contact point.**
2. **Not actually interlinked.** The first "fix" used the **same** tilt on both rings — two circles
   in **parallel planes can never link**. `check_fit` said collision 0 / gap 0.4, but **collision-free
   ≠ linked**. → **Prove interlink with a topological linking number**, not a clearance check.

### The fix
Rings lean in **opposite** directions (+30° / −30°), offset diagonally → non-parallel planes →
genuine interlink, with each ring's low point resting on the bed. Plate sits flat (z 0.000–6.400 mm),
no support, no floating.

### Measured tolerance ladder (tilt +30/−30, dy 3 mm)
| Target gap | dx | Measured clearance | Collision | Linking number |
|---|---|---|---|---|
| 0.30 (tight) | 3.7 | 0.306 mm | 0.000 mm³ | **Lk +1.000** |
| 0.40 (nominal) | 3.4 | 0.403 mm | 0.000 mm³ | **Lk +1.000** |
| 0.50 (safe) | 3.1 | ~0.51 mm | 0.000 mm³ | **Lk +1.000** |

### Physical result & decision
All three printed on the P1S (0.4 / 0.2): **every pair released and articulated, none fused.**
Chosen: **`GAP = 0.30 mm` (dx 3.7)** — locked in `config.scad`. The fusing floor is at or below
0.30 mm for this machine/material/profile. Print file: `stl/coupon_plate.stl`.

---

## 6. Verification methodology ("trust the boolean, not the typed number")

Every quantitative claim is **measured**, using:

| Tool | Proves |
|---|---|
| `tools/check_mesh.py` | mesh is watertight / manifold |
| `tools/check_fit.py` | collision volume + min clearance between two parts |
| `tools/linking_number.py` | **topological interlink** — Gauss `Lk`; `|Lk|=1` linked, `0` not linked |
| `tools/collision_scan.py` | **whole-assembly** gate — splits an assembly STL into every link and checks all near pairs for fusion (no meshed walls) and tolerance (min clearance ≥ tol everywhere) |
| `tools/verify.py` | master orchestrator — runs tree/spec/render/mesh/fit; **exit 0 = green** |

Run the full check:
```bash
cd projects/chain-mail
SKILL=$(git rev-parse --show-toplevel)/.claude/skills/scad-design-to-print/scripts
python3 "$SKILL/verify.py" .        # exit 0 = all pass
```
`verify.py` reads `spec/fit_checks.json` (a **bare JSON array** of pairs — note: not wrapped in an
object; that quirk bit us once). A geometry change is not accepted until it renders correctly *and*
passes verification.

**Toolchain setup (if starting from a fresh container):**
```bash
apt-get update && apt-get install -y --no-install-recommends openscad   # 2021.01
pip install trimesh numpy scipy manifold3d rtree
git clone --depth=1 https://github.com/BelfrySCAD/BOSL2.git projects/chain-mail/libs/BOSL2
# headless renders/exports use: xvfb-run -a openscad ...
```

---

## 7. Findings that constrain the design

Full detail in `kb/findings/`. The load-bearing ones:

- **Floating-islands rule** — every ring must reach the bed (or rest on a lower ring). Isolated
  links can't print in place. (spec §5.0)
- **Collision-free ≠ interlinked** — always verify with the linking number.
- **Weave linking rules (measured):** opposite-tilt rings **don't** link on pure-X offsets; **do**
  link on pure-Y and **diagonal** offsets. E4-1 = each ring threads its 4 **diagonal** neighbors,
  tilt alternating per row.
- **Flat-tiling constraint (measured):** same-row rings clear at `px ≥ 7.4 mm`, but same-tilt rings
  **two rows apart (0, 6 mm) collide** (5.5 mm³; don't clear until ~12 mm). The diagonal link needs
  `dy ≈ 3 mm`, so same-tilt repeats every 6 mm and collides → **a perfectly flat weave cannot tile
  at OD 11.2 mm.**

---

## 8. Current stage & immediate next step — M2 (IN PROGRESS)

**M2 = the flat European 4-in-1 swatch + the color pipeline start.**

The unsolved core is the tiling constraint above. **Chosen path: a woven over-under sheet ~2
wire-diameters thick**, rings alternating in **Z** so same-tilt neighbors clear vertically — exactly
how real maille works, and still print-in-place because elevated rings **rest on** lower rings
(contact, not floating).

**Immediate next task:** build the **woven-height E4-1 unit cell** and verify:
1. all 4 diagonal neighbor links are `Lk = 1`,
2. **all** ring pairs are collision-free (including the same-tilt second neighbors that collide when flat),
3. **every ring** is bed-contacting or rests on a lower ring (no floating),
4. crossing clearance ≈ `GAP` (0.30 mm).

Then tile it into a small **swatch** (~5×5) and print. In parallel, stand up **VZ0** — the WebGPU
visualizer skeleton (load ring-graph JSON, instanced render, fold slider) — and the first
`color_mode="image"` map test on the swatch.

---

## 9. Future stages (roadmap)

| # | Milestone | Gate | Status |
|---|---|---|---|
| M0 | Spec freeze | user sign-off | ✅ done |
| M1 | 2-ring link coupon | releases, no fuse, not fragile → pick `G` | ✅ done — **G = 0.30** |
| M2 | Flat E4-1 swatch + color | weave closes/drapes; image-map reads | 🔄 in progress (woven-height) |
| M3 | Single hinge-fold coupon | prints & unfolds; **pins hinge `Rmin`**; crease survives strain | ⏳ |
| M4 | Multi-fold panel | full fold/expand kinematics; color-invariance through fold | ⏳ |
| M5 | Full strip (~3 m unfolded) | `verify.py` all-pass; print-time/AMS budget accepted | ⏳ |
| M6 | Seam/jump-ring join doc | assembly guide for multi-strip garments | ⏳ |

**WebGPU visualizer** (spec §8) matures alongside: VZ0 skeleton with M2; XPBD physics +
`Rmin` crossvalidation with M3/M4.

---

## 10. Open problems & risks (tracked)

- **R0 — woven-height lattice (active):** deriving a tiling that is simultaneously all-linked,
  all-collision-free, and all bed-or-rest-supported. This is the current blocker; M2 solves it.
- **R1 — finer-wire fragility:** 1.6 mm PLA links may snap under wear → parametric fallback to a
  coarser gauge exists.
- **R2 — scale explosion:** ~15× strip ≈ 17k rings → multi-day prints, heavy slice, many AMS swaps
  → keep strip length a dial; prove per-panel first.
- **R3 — hinge strain:** aggressive crease links may over-strain PLA in the fold → §6 gate + M3.
- **R4 — palette posterization:** ≤4–5 inks → only bold art reads; set expectations on source images.
- **R5 — viz vs reality:** WebGPU support varies; XPBD ≠ FEA → feature-detect + degrade; the sim
  validates motion/drape/color and crossvalidates `Rmin`, never replaces coupon prints.

---

## 11. How to continue (checklist for the next session)

1. Read `spec/SPEC.md` (governs) and this handoff; skim `DESIGN_REPORT.md` for measured history.
2. Set up the toolchain (§6) if the container is fresh; confirm `verify.py .` is green.
3. Work M2: build the woven-height unit cell in `src/` (add `weave.scad`, `hinge.scad` per the
   deliverable tree), searching parameters with `linking_number.py` + `check_fit.py` as in M1.
4. **Document as you go:** add findings to `kb/findings/`, update `DESIGN_REPORT.md`, bump
   `version.json`, keep the card `projects/kb/projects/chain-mail.md` in sync, and update this
   handoff's status line.
5. Commit to `claude/chain-mail-project-euamyr`; do not open a PR unless asked.

---

## 12. Pointers

- Spec (governs): `spec/SPEC.md` · Config: `src/config.scad` · Log: `DESIGN_REPORT.md`
- Project KB: `kb/index.md` → overview / design / findings / process / structure
- Reusable technique: `/kb/additive-engineering/scad-cookbook/print-in-place-chainmail.md`
- Repo & project rules: `/CLAUDE.md`, `/projects/CLAUDE.md`, `./CLAUDE.md`
- Note: the **Cloudflare connector** requires authorization (claude.ai connector settings) before
  its tools are usable — not needed for this project, flagged for completeness.
