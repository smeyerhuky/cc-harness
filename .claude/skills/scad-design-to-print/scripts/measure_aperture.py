#!/usr/bin/env python3
"""
measure_aperture.py — Measure a functional dimension from a DXF cross-section projection.

Usage:
    python3 measure_aperture.py --dxf <path.dxf> --feature <name>
                                [--tolerance <mm>] [--axis {x,y,z}]

Output (stdout, JSON):
    {
      "file": "<path>",
      "feature": "<name>",
      "actual_mm": <float>,
      "tolerance_mm": <float>,
      "axis": "<x|y|z>",
      "pass": true | false,
      "bounding_box": {"x_min": ..., "x_max": ..., "y_min": ..., "y_max": ...},
      "errors": ["..."],
      "warnings": ["..."]
    }

How it works:
    Reads all LINE, CIRCLE, ARC, LWPOLYLINE, and POLYLINE entities from the DXF.
    Computes the bounding box of all geometry.
    "actual_mm" is the bounding-box span along the requested axis.
    For circular features (CIRCLE entities), reports the diameter directly.

    This is a geometric extraction, not semantic: it measures what's drawn,
    not what's labelled.  Use OpenSCAD's 'projection(cut=true)' + DXF export
    to generate the input, then use '--feature' as a label for the JSON report.

Exit code: 0 = pass (within tolerance of bounding-box measurement, or no
           tolerance given), 1 = fail / error.

Dependencies:
    pip install ezdxf numpy
"""

import argparse
import json
import math
import sys
from pathlib import Path


def _entities_to_points(dxf_path: Path) -> tuple[list[tuple[float, float]], list[float]]:
    """Return (xy_points, circle_diameters) extracted from all 2-D entities."""
    import ezdxf  # noqa: PLC0415

    doc = ezdxf.readfile(str(dxf_path))
    msp = doc.modelspace()

    points: list[tuple[float, float]] = []
    circle_diameters: list[float] = []

    for entity in msp:
        dxftype = entity.dxftype()
        if dxftype == "LINE":
            points.append((entity.dxf.start.x, entity.dxf.start.y))
            points.append((entity.dxf.end.x, entity.dxf.end.y))
        elif dxftype == "CIRCLE":
            cx, cy = entity.dxf.center.x, entity.dxf.center.y
            r = entity.dxf.radius
            circle_diameters.append(r * 2)
            # Include AABB contribution
            points.append((cx - r, cy - r))
            points.append((cx + r, cy + r))
        elif dxftype == "ARC":
            cx, cy = entity.dxf.center.x, entity.dxf.center.y
            r = entity.dxf.radius
            start_a = math.radians(entity.dxf.start_angle)
            end_a = math.radians(entity.dxf.end_angle)
            for a in (start_a, end_a):
                points.append((cx + r * math.cos(a), cy + r * math.sin(a)))
            # Add axis-crossing points if arc spans them
            for cardinal in (0, 90, 180, 270):
                ca = math.radians(cardinal)
                if _angle_between(start_a, end_a, ca):
                    points.append((cx + r * math.cos(ca), cy + r * math.sin(ca)))
        elif dxftype in ("LWPOLYLINE", "POLYLINE"):
            for pt in entity.get_points():
                points.append((pt[0], pt[1]))

    return points, circle_diameters


def _angle_between(start: float, end: float, angle: float) -> bool:
    """True if angle (radians) is within the arc from start to end (CCW)."""
    start = start % (2 * math.pi)
    end = end % (2 * math.pi)
    angle = angle % (2 * math.pi)
    if start <= end:
        return start <= angle <= end
    return angle >= start or angle <= end


def measure(dxf_path: Path, feature: str, tolerance_mm: float, axis: str) -> dict:
    result = {
        "file": str(dxf_path),
        "feature": feature,
        "actual_mm": None,
        "tolerance_mm": tolerance_mm,
        "axis": axis,
        "pass": False,
        "bounding_box": {},
        "errors": [],
        "warnings": [],
    }

    try:
        import ezdxf  # noqa: PLC0415, F401
        import numpy as np  # noqa: PLC0415
    except ImportError as exc:
        result["errors"].append(f"Missing dependency: {exc}. Run: pip install ezdxf numpy")
        return result

    if not dxf_path.exists():
        result["errors"].append(f"File not found: {dxf_path}")
        return result

    try:
        points, circle_diameters = _entities_to_points(dxf_path)
    except Exception as exc:  # noqa: BLE001
        result["errors"].append(f"Failed to parse DXF: {exc}")
        return result

    if not points:
        result["errors"].append("No geometry found in DXF file.")
        return result

    import numpy as np  # noqa: PLC0415

    pts = np.array(points)
    x_min, y_min = pts.min(axis=0)
    x_max, y_max = pts.max(axis=0)

    result["bounding_box"] = {
        "x_min": round(float(x_min), 4),
        "x_max": round(float(x_max), 4),
        "y_min": round(float(y_min), 4),
        "y_max": round(float(y_max), 4),
    }

    # For a single circle, prefer diameter over bounding box
    if len(circle_diameters) == 1:
        actual = circle_diameters[0]
        result["warnings"].append(
            f"Single CIRCLE entity detected; reporting diameter ({actual:.4f} mm) "
            "rather than bounding-box span."
        )
    else:
        if axis == "x":
            actual = float(x_max - x_min)
        else:
            actual = float(y_max - y_min)

    result["actual_mm"] = round(actual, 4)

    if tolerance_mm > 0:
        # Pass if measurement is within ±tolerance of itself (always true unless
        # a nominal value is provided). When used with --nominal, compare there.
        # Here we just record the measurement; pass = no errors encountered.
        pass

    result["pass"] = len(result["errors"]) == 0
    return result


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Measure a functional aperture dimension from a DXF projection."
    )
    parser.add_argument("--dxf", required=True, help="Path to the .dxf file.")
    parser.add_argument(
        "--feature", default="aperture", help="Logical name for this measurement (label only)."
    )
    parser.add_argument(
        "--tolerance", type=float, default=0.0,
        help="Acceptable deviation in mm (recorded in output; used by verify.py)."
    )
    parser.add_argument(
        "--axis", choices=["x", "y"], default="x",
        help="Bounding-box axis to report when multiple entities are present."
    )
    parser.add_argument(
        "--nominal", type=float, default=None,
        help="Nominal target dimension (mm). If given, pass/fail is |actual - nominal| <= tolerance."
    )
    parser.add_argument("--quiet", "-q", action="store_true")
    args = parser.parse_args()

    result = measure(Path(args.dxf), args.feature, args.tolerance, args.axis)

    if args.nominal is not None and result["actual_mm"] is not None:
        deviation = abs(result["actual_mm"] - args.nominal)
        result["nominal_mm"] = args.nominal
        result["deviation_mm"] = round(deviation, 4)
        if args.tolerance > 0:
            within = deviation <= args.tolerance
            result["pass"] = within and len(result["errors"]) == 0
            if not within:
                result["errors"].append(
                    f"Dimension out of tolerance: actual={result['actual_mm']:.4f} mm, "
                    f"nominal={args.nominal:.4f} mm, deviation={deviation:.4f} mm > "
                    f"tolerance={args.tolerance:.4f} mm."
                )

    indent = None if args.quiet else 2
    print(json.dumps(result, indent=indent))
    return 0 if result["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
