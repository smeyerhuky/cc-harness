#!/usr/bin/env python3
"""
build_plate.py — generate a printable full-bed flat E4-1 maille plate by instancing.

OpenSCAD/CGAL can't export ~1000 rotate_extrude rings in reasonable time, so we
instance one exported unit link across the VERIFIED flat E4-1 lattice (same as
sheet_scan.py / src/config.scad) and concatenate in trimesh. Reports ring count,
footprint, and that every ring is its own watertight component.

Usage:
    python3 build_plate.py --shape round  --width 200 --height 200 -o stl/plate_round.stl
    python3 build_plate.py --shape square --width 200 --height 200 -o stl/plate_square.stl
"""

import argparse, json, sys, math
from pathlib import Path

WD, ID = 1.6, 8.0
R = (ID + WD) / 2
TILT = 30.0
PARAMS = {"round": (6.8, 6.0), "square": (7.5, 6.5)}
LIFT = R * math.sin(math.radians(TILT)) + WD / 2

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shape", choices=["round", "square"], default="round")
    ap.add_argument("--width", type=float, default=200.0, help="target X footprint (mm)")
    ap.add_argument("--height", type=float, default=200.0, help="target Y footprint (mm)")
    ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--unit", default=None)
    ap.add_argument("--check", action="store_true", help="verify every component is watertight")
    args = ap.parse_args()

    import trimesh
    from trimesh.transformations import translation_matrix, rotation_matrix

    px, py = PARAMS[args.shape]
    cols = max(1, int(args.width // px))
    rows = max(1, int(args.height // py))

    unit_path = Path(args.unit) if args.unit else Path(__file__).resolve().parents[1] / "compare" / f"unit_{args.shape}.stl"
    unit = trimesh.load(str(unit_path), force="mesh")

    parts = []
    for r in range(rows):
        tilt = TILT if r % 2 == 0 else -TILT
        Mr = rotation_matrix(math.radians(tilt), [0, 1, 0])
        for c in range(cols):
            x = c * px + (r % 2) * (px / 2)
            y = r * py
            m = unit.copy()
            m.apply_transform(translation_matrix([x, y, LIFT]) @ Mr)
            parts.append(m)
    plate = trimesh.util.concatenate(parts)

    out = Path(args.out); out.parent.mkdir(parents=True, exist_ok=True)
    plate.export(str(out))
    bb = plate.bounds
    report = {
        "shape": args.shape, "out": str(out), "px": px, "py": py, "tilt": TILT,
        "grid": f"{cols}x{rows}", "rings": cols * rows,
        "footprint_mm": [round(bb[1][0] - bb[0][0], 1), round(bb[1][1] - bb[0][1], 1)],
        "height_mm": round(bb[1][2] - bb[0][2], 2),
        "faces": int(len(plate.faces)),
    }
    if args.check:
        comps = plate.split(only_watertight=False)
        report["components"] = len(comps)
        report["all_watertight"] = all(c.is_watertight for c in comps)
    print(json.dumps(report, indent=2))
    return 0

if __name__ == "__main__":
    sys.exit(main())
