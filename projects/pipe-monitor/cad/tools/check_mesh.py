#!/usr/bin/env python3
"""
check_mesh.py — Watertight / manifold mesh verification.

Usage:
    python3 check_mesh.py <path/to/file.stl> [--strict]

Output (stdout, JSON):
    {
      "file": "<path>",
      "pass": true | false,
      "watertight": true | false,
      "is_volume": true | false,
      "triangles": <int>,
      "vertices": <int>,
      "open_edges": <int>,
      "non_manifold_edges": <int>,
      "degenerate_faces": <int>,
      "errors": ["..."],
      "warnings": ["..."]
    }

Exit code: 0 = pass, 1 = fail, 2 = usage/dependency error.

Dependencies (all in stdlib + trimesh):
    pip install trimesh numpy
    For full mesh repair: pip install trimesh[easy]
"""

import argparse
import json
import sys
from pathlib import Path


def check(stl_path: Path, strict: bool = False) -> dict:
    result = {
        "file": str(stl_path),
        "pass": False,
        "watertight": False,
        "is_volume": False,
        "triangles": 0,
        "vertices": 0,
        "open_edges": 0,
        "non_manifold_edges": 0,
        "degenerate_faces": 0,
        "errors": [],
        "warnings": [],
    }

    # --- dependency check ---
    try:
        import trimesh  # noqa: PLC0415
        import numpy as np  # noqa: PLC0415
    except ImportError as exc:
        result["errors"].append(
            f"Missing dependency: {exc}. Run: pip install trimesh numpy"
        )
        return result

    # --- file existence ---
    if not stl_path.exists():
        result["errors"].append(f"File not found: {stl_path}")
        return result
    if stl_path.suffix.lower() != ".stl":
        result["warnings"].append(
            f"Expected .stl extension, got '{stl_path.suffix}'. Attempting load anyway."
        )

    # --- load mesh ---
    try:
        mesh = trimesh.load(str(stl_path), force="mesh")
    except Exception as exc:  # noqa: BLE001
        result["errors"].append(f"Failed to load mesh: {exc}")
        return result

    if not isinstance(mesh, trimesh.Trimesh):
        result["errors"].append(
            "Loaded object is not a Trimesh (possibly a Scene with multiple bodies). "
            "Export as a single merged mesh."
        )
        return result

    result["triangles"] = len(mesh.faces)
    result["vertices"] = len(mesh.vertices)

    # --- manifold / watertight ---
    result["watertight"] = bool(mesh.is_watertight)
    result["is_volume"] = bool(mesh.is_volume)

    # Count edge types
    edges_unique = mesh.edges_unique
    edge_face_count = np.zeros(len(edges_unique), dtype=int)
    for face_edges in mesh.faces_unique_edges:
        for eidx in face_edges:
            edge_face_count[eidx] += 1

    open_edges = int(np.sum(edge_face_count == 1))
    non_manifold = int(np.sum(edge_face_count > 2))
    result["open_edges"] = open_edges
    result["non_manifold_edges"] = non_manifold

    # Degenerate faces (zero-area)
    areas = mesh.area_faces
    degen = int(np.sum(areas < 1e-10))
    result["degenerate_faces"] = degen

    # --- populate errors/warnings ---
    if not result["watertight"]:
        result["errors"].append(
            f"Mesh is not watertight: {open_edges} open edge(s), "
            f"{non_manifold} non-manifold edge(s)."
        )
    if degen > 0:
        msg = f"{degen} degenerate (zero-area) face(s) detected."
        if strict:
            result["errors"].append(msg)
        else:
            result["warnings"].append(msg)
    if result["triangles"] == 0:
        result["errors"].append("Mesh has no triangles (empty geometry).")

    # --- final pass/fail ---
    result["pass"] = len(result["errors"]) == 0
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Check STL mesh for watertight / manifold properties."
    )
    parser.add_argument("stl", help="Path to the .stl file.")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat degenerate faces as errors rather than warnings.",
    )
    parser.add_argument(
        "--quiet", "-q", action="store_true", help="Suppress pretty-print; raw JSON only."
    )
    args = parser.parse_args()

    result = check(Path(args.stl), strict=args.strict)
    indent = None if args.quiet else 2
    print(json.dumps(result, indent=indent))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
