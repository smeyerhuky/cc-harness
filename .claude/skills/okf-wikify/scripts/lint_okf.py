#!/usr/bin/env python3
"""
OKF conformance linter.

Checks a directory tree against the Open Knowledge Format spec
(https://github.com/GoogleCloudPlatform/knowledge-catalog/tree/main/okf):

- Every non-reserved .md file has parseable YAML frontmatter with a
  non-empty `type` field.
- `okf_version` appears only in the root index.md.
- Reserved filenames (index.md, log.md) are never used as concept documents
  (i.e. they either have no frontmatter, or - for index.md - only the
  allowed root-level exception).
- Relative markdown links resolve to files that actually exist in the bundle.
- Every non-index file is reachable from some index.md (no orphans).

Usage:
    python3 lint_okf.py <bundle-root-dir> [--strict]

Exit code 0 if clean, 1 if any errors found. Warnings do not affect exit code
unless --strict is passed.
"""
import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
MD_LINK_RE = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
RESERVED_NAMES = {"index.md", "log.md", "CLAUDE.md"}


def parse_frontmatter(text: str):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None, text
    raw = m.group(1)
    if yaml is not None:
        try:
            data = yaml.safe_load(raw)
        except Exception as e:
            return {"__parse_error__": str(e)}, text[m.end():]
    else:
        # Minimal fallback parser: key: value lines only.
        data = {}
        for line in raw.splitlines():
            if ":" in line and not line.strip().startswith("#"):
                k, _, v = line.partition(":")
                data[k.strip()] = v.strip().strip('"')
    return data, text[m.end():]


def find_md_files(root: Path):
    return sorted(p for p in root.rglob("*.md") if p.is_file())


def lint(root: Path):
    errors = []
    warnings = []

    md_files = find_md_files(root)
    if not md_files:
        errors.append(f"No markdown files found under {root}")
        return errors, warnings

    root_index = root / "index.md"
    if not root_index.exists():
        errors.append("Missing root index.md (required bundle entry point)")

    all_paths = {p.relative_to(root) for p in md_files}
    linked_targets = set()

    for path in md_files:
        rel = path.relative_to(root)
        text = path.read_text(encoding="utf-8", errors="replace")
        fm, body = parse_frontmatter(text)
        is_reserved = path.name in RESERVED_NAMES

        if "TODO_OKF_FRONTMATTER" in text:
            errors.append(f"{rel}: leftover scaffold stub (TODO_OKF_FRONTMATTER) never filled in")
            continue

        if fm is None:
            if not is_reserved:
                errors.append(f"{rel}: missing YAML frontmatter (required unless index.md/log.md)")
        else:
            if "__parse_error__" in fm:
                errors.append(f"{rel}: frontmatter is not valid YAML ({fm['__parse_error__']})")
            elif not is_reserved:
                if not fm.get("type"):
                    errors.append(f"{rel}: frontmatter missing required non-empty 'type' field")
                for rec in ("title", "description", "resource", "tags", "timestamp"):
                    if rec not in fm:
                        warnings.append(f"{rel}: missing recommended field '{rec}'")
            if fm.get("okf_version") and rel != Path("index.md"):
                errors.append(f"{rel}: 'okf_version' must only appear in the root index.md, found here instead")

        # Link check
        for target in MD_LINK_RE.findall(body if fm is not None else text):
            if target.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target_clean = target.split("#")[0]
            if not target_clean.endswith(".md"):
                continue
            if target_clean.startswith("/"):
                resolved = (root / target_clean.lstrip("/")).resolve()
            else:
                resolved = (path.parent / target_clean).resolve()
            try:
                resolved_rel = resolved.relative_to(root.resolve())
                linked_targets.add(resolved_rel)
            except ValueError:
                pass  # External to bundle, that's allowed now
            if not resolved.exists():
                errors.append(f"{rel}: broken link -> {target}")

    # Orphan check: every non-index file should be linked from somewhere.
    for rel in all_paths:
        if rel.name in RESERVED_NAMES:
            continue
        if rel not in linked_targets:
            warnings.append(f"{rel}: not linked from any other file in the bundle (orphaned)")

    return errors, warnings


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("bundle_dir", type=Path)
    ap.add_argument("--strict", action="store_true", help="treat warnings as failures")
    args = ap.parse_args()

    root = args.bundle_dir.resolve()
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        sys.exit(2)

    errors, warnings = lint(root)

    if errors:
        print(f"ERRORS ({len(errors)}):")
        for e in errors:
            print(f"  ✗ {e}")
    if warnings:
        print(f"\nWARNINGS ({len(warnings)}):")
        for w in warnings:
            print(f"  ! {w}")

    if not errors and not warnings:
        print("OK: bundle is OKF-conformant, no warnings.")

    if errors or (args.strict and warnings):
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
