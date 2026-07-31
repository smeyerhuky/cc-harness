#!/usr/bin/env python3
"""
sheet_scan.py — wide-sheet + kinematic collision/clearance gate (scalable).

Instances one exported link mesh across the E4-1 lattice (no CGAL for the whole
sheet) and runs FCL collision over the whole assembly:
  * fusion:    NO two links may be in collision  (no meshed walls)
  * tolerance: global min clearance >= tol - margin  (honors the print gap)
  * kinematics: with --flex-sweep, re-checks across a range of articulation so no
    collision occurs at ANY reachable pose, not just at rest.

Lattice mirrors compare/sheet.scad: link (a,b) at ((a+b)*VX, (a-b)*VY, LIFT+ZW*(a%2)),
lean +T if (a+b) even else -T, plus an articulation offset FLEX (alternating sign).

Usage:
    python3 sheet_scan.py --shape round --cols 6 --rows 6 --zw 0 --tol 0.30
    python3 sheet_scan.py --shape round --cols 6 --rows 6 --zw 5 --flex-sweep -12:12:7
"""

import argparse, json, sys, math
from pathlib import Path

# --- constants mirror src/config.scad (single source of truth) --------------
WD, ID = 1.6, 8.0
T  = 30.0            # LINK_TILT
VX = 3.7            # LINK_DX
VY = 3.0            # LINK_DY
LIFT0 = (ID + WD) / 2 * math.sin(math.radians(T)) + WD / 2   # base lift to bed


def transforms(cols, rows, zw, flex):
    import numpy as np
    from trimesh.transformations import rotation_matrix, translation_matrix
    out = []
    lift = LIFT0 + zw
    for a in range(cols):
        for b in range(rows):
            even = ((a + b) % 2 == 0)
            tilt = T if even else -T
            ft = tilt + (flex if even else -flex)
            x = (a + b) * VX
            y = (a - b) * VY
            z = lift + zw * (a % 2)
            M = translation_matrix([x, y, z]) @ rotation_matrix(math.radians(ft), [0, 1, 0])
            out.append((f"{a}_{b}", M))
    return out


def scan(unit_mesh, cols, rows, zw, flex, tol, margin):
    from trimesh.collision import CollisionManager
    mgr = CollisionManager()
    for name, M in transforms(cols, rows, zw, flex):
        mgr.add_object(name, unit_mesh, transform=M)
    hit, names = mgr.in_collision_internal(return_names=True)
    fused = sorted(tuple(sorted((a, b))) for a, b in names)
    dist = float(mgr.min_distance_internal())
    return {"flex": flex, "num_fused": len(fused), "fused": fused[:20],
            "min_clearance_mm": round(dist, 4),
            "pass": (len(fused) == 0 and dist >= tol - margin)}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shape", choices=["round", "square"], default="round")
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--rows", type=int, default=6)
    ap.add_argument("--zw", type=float, default=0.0, help="woven-height Z offset")
    ap.add_argument("--tol", type=float, default=0.30)
    ap.add_argument("--margin", type=float, default=0.05)
    ap.add_argument("--flex", type=float, default=0.0)
    ap.add_argument("--flex-sweep", default=None, help="min:max:steps articulation sweep (deg)")
    ap.add_argument("--unit", default=None, help="path to single-link STL (default compare/unit_<shape>.stl)")
    args = ap.parse_args()

    try:
        import trimesh
    except ImportError as e:
        print(json.dumps({"errors": [f"missing dependency: {e}"], "pass": False})); return 2

    unit_path = Path(args.unit) if args.unit else Path(__file__).resolve().parents[1] / "compare" / f"unit_{args.shape}.stl"
    if not unit_path.exists():
        print(json.dumps({"errors": [f"unit mesh not found: {unit_path}"], "pass": False})); return 2
    unit = trimesh.load(str(unit_path), force="mesh")

    report = {"shape": args.shape, "grid": f"{args.cols}x{args.rows}", "links": args.cols * args.rows,
              "zw": args.zw, "tolerance_mm": args.tol}

    if args.flex_sweep:
        lo, hi, steps = args.flex_sweep.split(":")
        lo, hi, steps = float(lo), float(hi), int(steps)
        vals = [lo + (hi - lo) * k / (steps - 1) for k in range(steps)] if steps > 1 else [lo]
        poses = [scan(unit, args.cols, args.rows, args.zw, f, args.tol, args.margin) for f in vals]
        worst_clear = min(p["min_clearance_mm"] for p in poses)
        any_fused = any(p["num_fused"] > 0 for p in poses)
        report.update({
            "mode": "kinematic-sweep",
            "flex_range_deg": [lo, hi], "poses": len(poses),
            "worst_min_clearance_mm": worst_clear,
            "any_pose_fused": any_fused,
            "fused_poses": [p["flex"] for p in poses if p["num_fused"] > 0],
            "pass": (not any_fused),                 # no collision at ANY reachable pose
            "per_pose": poses,
        })
        print(json.dumps(report, indent=2))
        return 0 if report["pass"] else 1
    else:
        r = scan(unit, args.cols, args.rows, args.zw, args.flex, args.tol, args.margin)
        report.update({"mode": "static", **r})
        print(json.dumps(report, indent=2))
        return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
