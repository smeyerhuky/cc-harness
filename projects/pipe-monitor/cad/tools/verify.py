#!/usr/bin/env python3
"""
verify.py — Master orchestrator for the scad-design-to-print verification suite.

Usage:
    python3 verify.py [project_root] [--checks mesh,aperture,fit] [--strict]

    project_root defaults to the current working directory.

Output (stdout, JSON):
    {
      "project_root": "<abs path>",
      "timestamp": "<ISO 8601>",
      "overall": "pass" | "fail" | "warn",
      "summary": { "pass": N, "fail": N, "warn": N, "skip": N },
      "checks": [
        {
          "name": "<check name>",
          "status": "pass" | "fail" | "warn" | "skip",
          "detail": { ... }   // raw output from the sub-script
        },
        ...
      ],
      "errors": ["..."],
      "warnings": ["..."]
    }

What it checks:
    1. mesh   — Runs check_mesh.py on every .stl under stl/
    2. render — Verifies that renders/ contains at least top.png, section.png, iso.png
    3. spec   — Verifies spec/SPEC.md exists and is non-empty
    4. tree   — Verifies the required deliverable tree (stl/, src/, spec/, renders/)
    5. aperture — Runs measure_aperture.py on every .dxf under stl/ (if any)
    6. fit    — Runs check_fit.py on pairs listed in spec/fit_checks.json (if present)

Exit code: 0 = all pass (or only warnings), 1 = one or more failures.

Dependencies:
    Same as check_mesh.py, measure_aperture.py, check_fit.py.
    No extra deps needed for tree/spec/render checks.
"""

import argparse
import datetime
import importlib.util
import json
import subprocess
import sys
from pathlib import Path


SKILL_DIR = Path(__file__).parent


def _run_script(script_name: str, args: list[str]) -> tuple[bool, dict]:
    """Run a sibling script as a subprocess, capture its JSON output."""
    script_path = SKILL_DIR / script_name
    cmd = [sys.executable, str(script_path), "--quiet"] + args
    try:
        proc = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120
        )
        try:
            data = json.loads(proc.stdout)
        except json.JSONDecodeError:
            data = {"raw_stdout": proc.stdout.strip(), "raw_stderr": proc.stderr.strip()}
        passed = proc.returncode == 0
        return passed, data
    except subprocess.TimeoutExpired:
        return False, {"error": f"{script_name} timed out after 120 s."}
    except Exception as exc:  # noqa: BLE001
        return False, {"error": str(exc)}


def _check_tree(project_root: Path) -> dict:
    required_dirs = ["stl", "src", "spec", "renders"]
    missing = [d for d in required_dirs if not (project_root / d).is_dir()]
    optional_dirs = ["libs/BOSL2", "step", "3mf", "tools"]
    missing_optional = [d for d in optional_dirs if not (project_root / d).exists()]
    passed = len(missing) == 0
    return {
        "pass": passed,
        "missing_required": missing,
        "missing_optional": missing_optional,
        "errors": [f"Missing required directory: {d}" for d in missing],
        "warnings": [f"Missing optional directory: {d}" for d in missing_optional],
    }


def _check_spec(project_root: Path) -> dict:
    spec_path = project_root / "spec" / "SPEC.md"
    if not spec_path.exists():
        return {"pass": False, "errors": ["spec/SPEC.md not found."], "warnings": []}
    content = spec_path.read_text(encoding="utf-8").strip()
    if len(content) < 100:
        return {
            "pass": False,
            "errors": [f"spec/SPEC.md appears stub (only {len(content)} chars). Write a real spec."],
            "warnings": [],
        }
    return {"pass": True, "size_chars": len(content), "errors": [], "warnings": []}


def _check_renders(project_root: Path) -> dict:
    renders_dir = project_root / "renders"
    required = ["top.png", "section.png", "iso.png"]
    missing = [r for r in required if not (renders_dir / r).exists()]
    found = [r for r in required if (renders_dir / r).exists()]
    passed = len(missing) == 0
    return {
        "pass": passed,
        "found": found,
        "missing": missing,
        "errors": [f"Missing render: renders/{r}" for r in missing],
        "warnings": [],
    }


def _check_all_meshes(project_root: Path) -> list[dict]:
    stl_dir = project_root / "stl"
    results = []
    if not stl_dir.is_dir():
        return results
    for stl_file in sorted(stl_dir.glob("**/*.stl")):
        passed, detail = _run_script("check_mesh.py", [str(stl_file)])
        results.append({
            "name": f"mesh:{stl_file.name}",
            "status": "pass" if passed else "fail",
            "detail": detail,
        })
    return results


def _check_all_apertures(project_root: Path) -> list[dict]:
    stl_dir = project_root / "stl"
    results = []
    if not stl_dir.is_dir():
        return results
    for dxf_file in sorted(stl_dir.glob("**/*.dxf")):
        passed, detail = _run_script(
            "measure_aperture.py", ["--dxf", str(dxf_file), "--feature", dxf_file.stem]
        )
        results.append({
            "name": f"aperture:{dxf_file.name}",
            "status": "pass" if passed else "fail",
            "detail": detail,
        })
    return results


def _check_fit_pairs(project_root: Path) -> list[dict]:
    fit_spec = project_root / "spec" / "fit_checks.json"
    results = []
    if not fit_spec.exists():
        return results
    try:
        pairs = json.loads(fit_spec.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        return [{
            "name": "fit:config",
            "status": "fail",
            "detail": {"error": f"Could not parse spec/fit_checks.json: {exc}"},
        }]
    for pair in pairs:
        a = str(project_root / pair.get("part_a", ""))
        b = str(project_root / pair.get("part_b", ""))
        extra = []
        if "expected_clearance" in pair:
            extra += ["--expected-clearance", str(pair["expected_clearance"])]
        if "tolerance" in pair:
            extra += ["--tolerance", str(pair["tolerance"])]
        passed, detail = _run_script("check_fit.py", [a, b] + extra)
        label = pair.get("name", f"{Path(a).stem}_vs_{Path(b).stem}")
        results.append({
            "name": f"fit:{label}",
            "status": "pass" if passed else "fail",
            "detail": detail,
        })
    return results


def run_all(project_root: Path, enabled_checks: set[str], strict: bool) -> dict:
    checks: list[dict] = []
    top_errors: list[str] = []
    top_warnings: list[str] = []

    # --- structural checks (always run) ---
    if "tree" in enabled_checks:
        tree = _check_tree(project_root)
        checks.append({"name": "tree", "status": "pass" if tree["pass"] else "fail", "detail": tree})
        top_warnings.extend(tree.get("warnings", []))

    if "spec" in enabled_checks:
        spec = _check_spec(project_root)
        checks.append({"name": "spec", "status": "pass" if spec["pass"] else "fail", "detail": spec})

    if "render" in enabled_checks:
        renders = _check_renders(project_root)
        checks.append({
            "name": "render",
            "status": "pass" if renders["pass"] else ("warn" if not strict else "fail"),
            "detail": renders,
        })
        if renders["missing"]:
            top_warnings.extend([f"Missing render: {r}" for r in renders["missing"]])

    # --- geometry checks ---
    if "mesh" in enabled_checks:
        checks.extend(_check_all_meshes(project_root))

    if "aperture" in enabled_checks:
        aperture_results = _check_all_apertures(project_root)
        if not aperture_results:
            checks.append({
                "name": "aperture",
                "status": "skip",
                "detail": {"reason": "No .dxf files found under stl/"},
            })
        else:
            checks.extend(aperture_results)

    if "fit" in enabled_checks:
        fit_results = _check_fit_pairs(project_root)
        if not fit_results:
            checks.append({
                "name": "fit",
                "status": "skip",
                "detail": {"reason": "No spec/fit_checks.json found"},
            })
        else:
            checks.extend(fit_results)

    # --- summary ---
    summary = {"pass": 0, "fail": 0, "warn": 0, "skip": 0}
    for c in checks:
        summary[c["status"]] = summary.get(c["status"], 0) + 1

    overall = "pass"
    if summary["fail"] > 0:
        overall = "fail"
    elif summary["warn"] > 0:
        overall = "warn"

    return {
        "project_root": str(project_root.resolve()),
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "overall": overall,
        "summary": summary,
        "checks": checks,
        "errors": top_errors,
        "warnings": top_warnings,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Master orchestrator: run all verification checks on an OpenSCAD project."
    )
    parser.add_argument(
        "project_root",
        nargs="?",
        default=".",
        help="Path to the project root directory (default: current directory).",
    )
    parser.add_argument(
        "--checks",
        default="tree,spec,render,mesh,aperture,fit",
        help=(
            "Comma-separated list of checks to run. "
            "Options: tree, spec, render, mesh, aperture, fit. "
            "Default: all."
        ),
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat warnings as failures (render missing → fail, not warn).",
    )
    parser.add_argument("--quiet", "-q", action="store_true")
    args = parser.parse_args()

    project_root = Path(args.project_root).resolve()
    if not project_root.is_dir():
        print(
            json.dumps({"error": f"Project root not found: {project_root}"}),
            file=sys.stderr,
        )
        return 2

    enabled = {c.strip() for c in args.checks.split(",") if c.strip()}
    report = run_all(project_root, enabled, strict=args.strict)

    indent = None if args.quiet else 2
    print(json.dumps(report, indent=indent))
    return 0 if report["overall"] in ("pass", "warn") else 1


if __name__ == "__main__":
    sys.exit(main())
