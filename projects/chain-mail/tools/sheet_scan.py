#!/usr/bin/env python3
"""
sheet_scan.py — flat E4-1 sheet/plate collision + interlink + kinematic gate (scalable).

Instances one exported link mesh across the VERIFIED flat European 4-in-1 lattice
(row-brick: adjacent rows lean +/-tilt, odd rows staggered px/2, all rings on the bed)
and runs FCL collision over the whole assembly:
  * fusion:    NO two links in collision              (no meshed walls)
  * tolerance: global min clearance >= tol - margin   (honors the print gap)
  * interlink: interior ring must link all 4 neighbours (|Lk|=1)   [--links]
  * kinematics: --flex-sweep re-checks across an articulation range (ROM gate)

Params mirror src/config.scad (round: px6.8/py6.0, square: px7.5/py6.5, tilt 30).

Usage:
    python3 sheet_scan.py --shape round --cols 30 --rows 34 --tol 0.30 --links
    python3 sheet_scan.py --shape square --cols 6 --rows 6 --flex-sweep=-12:12:7
"""

import argparse, json, sys, math, importlib.util
from pathlib import Path

WD, ID = 1.6, 8.0
R = (ID + WD) / 2
TILT = 30.0
PARAMS = {"round": (6.8, 6.0), "square": (7.5, 6.5)}   # (px, py)
LIFT = R * math.sin(math.radians(TILT)) + WD / 2       # flat: every ring on the bed

_ln = None
def _linking():
    global _ln
    if _ln is None:
        p = Path(__file__).resolve().parent / "linking_number.py"
        spec = importlib.util.spec_from_file_location("ln", p)
        _ln = importlib.util.module_from_spec(spec); spec.loader.exec_module(_ln)
    return _ln

def pose(r, c, px, py, flex=0.0):
    tilt = TILT if r % 2 == 0 else -TILT
    ft = tilt + (flex if r % 2 == 0 else -flex)
    center = (c * px + (r % 2) * (px / 2), r * py, LIFT)
    return center, tilt, ft

def transforms(cols, rows, px, py, flex):
    from trimesh.transformations import translation_matrix, rotation_matrix
    out = []
    for r in range(rows):
        for c in range(cols):
            center, _tilt, ft = pose(r, c, px, py, flex)
            out.append((f"{r}_{c}",
                        translation_matrix(center) @ rotation_matrix(math.radians(ft), [0, 1, 0])))
    return out

def scan(unit, cols, rows, px, py, flex, tol, margin):
    from trimesh.collision import CollisionManager
    mgr = CollisionManager()
    for name, M in transforms(cols, rows, px, py, flex):
        mgr.add_object(name, unit, transform=M)
    _, names = mgr.in_collision_internal(return_names=True)
    fused = sorted(tuple(sorted((a, b))) for a, b in names)
    dist = float(mgr.min_distance_internal())
    return {"flex": flex, "num_fused": len(fused), "fused": fused[:20],
            "min_clearance_mm": round(dist, 4),
            "pass": (len(fused) == 0 and dist >= tol - margin)}

def interior_links(cols, rows, px, py):
    ln = _linking()
    r, c = rows // 2, cols // 2
    (cC, tC, _) = pose(r, c, px, py)
    # brick stagger: an even row's up/down neighbours sit at columns {c, c-1};
    # an odd row's sit at {c, c+1}. Pick the correct pair by parity.
    dcs = (0, -1) if r % 2 == 0 else (0, 1)
    out = []
    for dr in (1, -1):
        for dc in dcs:
            (cN, tN, _) = pose(r + dr, c + dc, px, py)
            lk = ln.linking_number(ln.ring_centreline(R, tC, cC), ln.ring_centreline(R, tN, cN))
            out.append(round(lk, 2))
    return out

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--shape", choices=["round", "square"], default="round")
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--rows", type=int, default=6)
    ap.add_argument("--tol", type=float, default=0.30)
    ap.add_argument("--margin", type=float, default=0.05)
    ap.add_argument("--flex", type=float, default=0.0)
    ap.add_argument("--flex-sweep", default=None, help="min:max:steps articulation sweep (deg)")
    ap.add_argument("--links", action="store_true", help="also verify interior ring links all 4 neighbours")
    ap.add_argument("--unit", default=None)
    args = ap.parse_args()

    try:
        import trimesh
    except ImportError as e:
        print(json.dumps({"errors": [f"missing dependency: {e}"], "pass": False})); return 2

    px, py = PARAMS[args.shape]
    unit_path = Path(args.unit) if args.unit else Path(__file__).resolve().parents[1] / "compare" / f"unit_{args.shape}.stl"
    if not unit_path.exists():
        print(json.dumps({"errors": [f"unit mesh not found: {unit_path}"], "pass": False})); return 2
    unit = trimesh.load(str(unit_path), force="mesh")

    report = {"shape": args.shape, "grid": f"{args.cols}x{args.rows}", "links": args.cols * args.rows,
              "px": px, "py": py, "tilt": TILT, "tolerance_mm": args.tol}

    if args.flex_sweep:
        lo, hi, steps = args.flex_sweep.split(":")
        lo, hi, steps = float(lo), float(hi), int(steps)
        vals = [lo + (hi - lo) * k / (steps - 1) for k in range(steps)] if steps > 1 else [lo]
        poses = [scan(unit, args.cols, args.rows, px, py, f, args.tol, args.margin) for f in vals]
        report.update({
            "mode": "kinematic-sweep", "flex_range_deg": [lo, hi], "poses": len(poses),
            "worst_min_clearance_mm": min(p["min_clearance_mm"] for p in poses),
            "any_pose_fused": any(p["num_fused"] > 0 for p in poses),
            "fused_poses": [p["flex"] for p in poses if p["num_fused"] > 0],
            "pass": not any(p["num_fused"] > 0 for p in poses),
            "per_pose": poses,
        })
        print(json.dumps(report, indent=2)); return 0 if report["pass"] else 1

    r = scan(unit, args.cols, args.rows, px, py, args.flex, args.tol, args.margin)
    report.update({"mode": "static", **r})
    if args.links:
        lks = interior_links(args.cols, args.rows, px, py)
        report["interior_links_Lk"] = lks
        report["all_4_interlinked"] = all(abs(x) >= 0.9 for x in lks)
        report["pass"] = report["pass"] and report["all_4_interlinked"]
    print(json.dumps(report, indent=2)); return 0 if report["pass"] else 1

if __name__ == "__main__":
    sys.exit(main())
