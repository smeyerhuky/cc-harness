#!/usr/bin/env python3
"""
check_fit.py — Interference / clearance test between two STL meshes.

Usage:
    python3 check_fit.py <part_a.stl> <part_b.stl>
                         [--expected-clearance <mm>] [--tolerance <mm>]

Output (stdout, JSON):
    {
      "part_a": "<path>",
      "part_b": "<path>",
      "collision_volume_mm3": <float>,
      "min_clearance_mm": <float | null>,
      "expected_clearance_mm": <float>,
      "tolerance_mm": <float>,
      "interference": true | false,
      "pass": true | false,
      "errors": ["..."],
      "warnings": ["..."]
    }

How it works:
    1. Loads both meshes with trimesh.
    2. Computes the boolean intersection volume.  If > 0 → interference.
    3. If no intersection, samples the Hausdorff-like closest-point distance
       to estimate minimum clearance.
    4. Compares minimum clearance against expected_clearance ± tolerance.

Exit code: 0 = pass, 1 = fail, 2 = usage/dependency error.

Dependencies:
    pip install trimesh numpy scipy
    For boolean ops: pip install trimesh[boolean] (requires OpenSCAD or manifold3d on PATH)
"""

import argparse
import json
import sys
from pathlib import Path


def _load_mesh(path: Path, label: str, errors: list[str]):
    try:
        import trimesh  # noqa: PLC0415
        mesh = trimesh.load(str(path), force="mesh")
        if not isinstance(mesh, trimesh.Trimesh):
            errors.append(f"{label}: not a single mesh (got {type(mesh).__name__}).")
            return None
        if not mesh.is_watertight:
            errors.append(
                f"{label}: mesh is not watertight — boolean ops may be unreliable. "
                "Run check_mesh.py first."
            )
        return mesh
    except Exception as exc:  # noqa: BLE001
        errors.append(f"{label}: failed to load — {exc}")
        return None


def _intersection_volume(mesh_a, mesh_b) -> float | None:
    """Return intersection volume in mm³, or None if backend unavailable."""
    try:
        import trimesh  # noqa: PLC0415
        intersection = trimesh.boolean.intersection([mesh_a, mesh_b])
        if intersection is None or len(intersection.faces) == 0:
            return 0.0
        return float(intersection.volume)
    except Exception:  # noqa: BLE001
        return None


def _min_clearance(mesh_a, mesh_b, n_samples: int = 2000) -> float:
    """Approximate minimum clearance by sampling surface points on A and querying B."""
    import numpy as np  # noqa: PLC0415

    samples_a, _ = mesh_a.sample(n_samples, return_index=True)
    closest, distances, _ = mesh_b.nearest.on_surface(samples_a)  # noqa: F841
    return float(np.min(distances))


def check(
    path_a: Path,
    path_b: Path,
    expected_clearance: float = 0.0,
    tolerance: float = 0.05,
) -> dict:
    result = {
        "part_a": str(path_a),
        "part_b": str(path_b),
        "collision_volume_mm3": None,
        "min_clearance_mm": None,
        "expected_clearance_mm": expected_clearance,
        "tolerance_mm": tolerance,
        "interference": None,
        "pass": False,
        "errors": [],
        "warnings": [],
    }

    try:
        import trimesh  # noqa: PLC0415, F401
        import numpy as np  # noqa: PLC0415, F401
    except ImportError as exc:
        result["errors"].append(f"Missing dependency: {exc}. Run: pip install trimesh numpy")
        return result

    for p in (path_a, path_b):
        if not p.exists():
            result["errors"].append(f"File not found: {p}")
    if result["errors"]:
        return result

    mesh_a = _load_mesh(path_a, "part_a", result["errors"])
    mesh_b = _load_mesh(path_b, "part_b", result["errors"])
    if result["errors"]:
        return result

    # --- Boolean intersection ---
    vol = _intersection_volume(mesh_a, mesh_b)
    if vol is None:
        result["warnings"].append(
            "Boolean intersection backend unavailable (install manifold3d or OpenSCAD). "
            "Falling back to clearance-only check."
        )
    else:
        result["collision_volume_mm3"] = round(vol, 6)
        result["interference"] = vol > 1e-6  # 1 µm³ threshold

    # --- Clearance estimation ---
    try:
        min_cl = _min_clearance(mesh_a, mesh_b)
        result["min_clearance_mm"] = round(min_cl, 4)
    except Exception as exc:  # noqa: BLE001
        result["warnings"].append(f"Could not compute clearance: {exc}")

    # --- Pass/Fail logic ---
    interference_fail = result["interference"] is True
    clearance_fail = False
    if result["min_clearance_mm"] is not None and expected_clearance > 0:
        deviation = abs(result["min_clearance_mm"] - expected_clearance)
        if deviation > tolerance:
            clearance_fail = True
            result["errors"].append(
                f"Clearance out of spec: min_clearance={result['min_clearance_mm']:.4f} mm, "
                f"expected={expected_clearance:.4f} mm ± {tolerance:.4f} mm."
            )

    if interference_fail:
        result["errors"].append(
            f"Interference detected: {result['collision_volume_mm3']:.6f} mm³ overlap."
        )

    result["pass"] = not interference_fail and not clearance_fail and len(result["errors"]) == 0
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Interference / clearance test between two STL meshes."
    )
    parser.add_argument("part_a", help="First STL file path.")
    parser.add_argument("part_b", help="Second STL file path.")
    parser.add_argument(
        "--expected-clearance", type=float, default=0.0,
        help="Nominal gap between parts in mm (0 = press-fit / mating surface)."
    )
    parser.add_argument(
        "--tolerance", type=float, default=0.05,
        help="Acceptable deviation from expected clearance in mm (default: 0.05)."
    )
    parser.add_argument("--quiet", "-q", action="store_true")
    args = parser.parse_args()

    result = check(
        Path(args.part_a),
        Path(args.part_b),
        expected_clearance=args.expected_clearance,
        tolerance=args.tolerance,
    )
    indent = None if args.quiet else 2
    print(json.dumps(result, indent=indent))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
