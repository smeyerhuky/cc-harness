# Chain Mail

Parametric, **print-in-place**, **folding** European 4-in-1 chainmail for the **Bambu Lab P1S**
(0.4 mm nozzle, 0.2 mm layers, CMYK PLA via AMS 2). Prints as one job, pre-folded into the build
volume, then unfolds into a wide flexible maille sheet. For dwarf/gnome cosplay.

## Status

**M1 complete (physical, G = 0.30 mm).** M2 (woven sheet) in progress.

**New here? Read [`HANDOFF.md`](HANDOFF.md)** — the full documented handoff covering everything
designed and tested and the current/future stages. Deep detail: [`DESIGN_REPORT.md`](DESIGN_REPORT.md);
spec (governs, **FROZEN**): [`spec/SPEC.md`](spec/SPEC.md).

## Design highlights

- **Finer gauge:** wire 1.6 mm, ID 8 mm, OD 11.2 mm — authentic drape.
- **Engineered hinge folding:** dedicated crease links fold tight (target Rmin ≈ 8 mm),
  decoupling fold radius from drape gauge → up to ~15× area (~3 m strip) per print.
- **Image-to-surface color:** map any SVG/JPG/PNG onto the unfolded sheet, preserved per-ring
  through the fold (`color_mode` = off / band / image; prototypes default to off).
- **WebGPU physics twin:** cloth-fidelity XPBD visualizer that shares the print data contract
  and crossvalidates the analytic fold kinematics.

## Layout

```
src/config.scad     all parameters (single source of truth)
src/ring.scad       parametric torus ring
src/coupon*.scad    M1 print-in-place linkage coupons
spec/SPEC.md        frozen specification
spec/fit_checks.json  automated clearance checks
renders/            iso / top / section
DESIGN_REPORT.md    per-milestone engineering log
```

## Reproduce M1

```bash
# from projects/chain-mail/
git clone --depth=1 https://github.com/BelfrySCAD/BOSL2.git libs/BOSL2   # if not present
SKILL=$(git rev-parse --show-toplevel)/.claude/skills/scad-design-to-print/scripts
xvfb-run -a openscad -o stl/coupon_plate.stl src/coupon_plate.scad
python3 "$SKILL/verify.py" .    # exit 0 = all green
```

## Next

M2 — flat E4-1 swatch + color-map pipeline, and the printable *lean* orientation.
