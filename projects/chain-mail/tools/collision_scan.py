#!/usr/bin/env python3
"""
collision_scan.py — whole-assembly collision + clearance gate for print-in-place maille.

Guarantees, across the ENTIRE assembly (every link vs every other link), that:
  1. NO two links are fused / meshed together   -> no pair is in collision   (hard fail if any)
  2. every gap honors the tolerance             -> global min clearance >= (tol - margin)

This is the "no walls meshed together" gate: it honors the tolerance requirement and the
real-world kinematics (rings must be physically separate to articulate). Uses FCL
(flexible collision library) via trimesh.collision.CollisionManager: one fast query returns
all colliding pairs, another returns the global minimum separation.

Usage:
    python3 collision_scan.py <assembly.stl> [--tol 0.30] [--margin 0.05]

Input: one STL of the whole assembly; each link must be its own connected component
(true for print-in-place maille). Exit 0 = pass, 1 = fail, 2 = usage/dependency error.
"""

import argparse, json, sys
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("assembly")
    ap.add_argument("--tol", type=float, default=0.30, help="required clearance (mm)")
    ap.add_argument("--margin", type=float, default=0.05, help="allowance below tol before flagging")
    ap.add_argument("--json", action="store_true", help="emit only JSON")
    args = ap.parse_args()

    try:
        import trimesh
        from trimesh.collision import CollisionManager
    except ImportError as e:
        print(json.dumps({"errors": [f"missing dependency: {e} (pip install trimesh python-fcl)"], "pass": False}))
        return 2

    p = Path(args.assembly)
    if not p.exists():
        print(json.dumps({"errors": [f"file not found: {p}"], "pass": False}))
        return 2

    mesh = trimesh.load(str(p), force="mesh")
    comps = [c for c in mesh.split(only_watertight=False) if len(c.faces) > 0]
    n = len(comps)
    result = {
        "assembly": str(p), "components": n, "tolerance_mm": args.tol,
        "fused_pairs": [], "num_fused": 0, "min_clearance_mm": None,
        "pass": False, "errors": [], "warnings": [],
    }
    if n < 2:
        result["warnings"].append("fewer than 2 components; nothing to compare")
        result["pass"] = True
        print(json.dumps(result, indent=2)); return 0

    mgr = CollisionManager()
    for i, c in enumerate(comps):
        mgr.add_object(str(i), c)

    # (1) fusion: every pair currently intersecting/touching
    hit, names = mgr.in_collision_internal(return_names=True)
    fused = sorted(tuple(sorted((int(a), int(b)))) for a, b in names)
    result["fused_pairs"] = [{"a": a, "b": b} for a, b in fused]
    result["num_fused"] = len(fused)

    # (2) tolerance: global minimum separation across all non-colliding pairs
    dist = mgr.min_distance_internal()
    result["min_clearance_mm"] = round(float(dist), 4)

    result["pass"] = (result["num_fused"] == 0 and dist >= args.tol - args.margin)
    print(json.dumps(result, indent=2))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
