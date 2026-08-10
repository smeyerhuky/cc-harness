#!/usr/bin/env python3
"""
Collection-development / weeding auditor for the KB (library-science Phase 5).

A knowledge base, like a library collection, stays trustworthy only if it is
tended: material that is superseded or no longer true must be *retired on a
defined, reversible path* — not deleted (which destroys the memory) and not left
to rot silently. This tool enforces that path.

The weeding policy has two hard invariants and one readiness check:

  I1  A record with `status: deprecated` MUST carry a `SUPERSEDED_BY` edge, OR a
      `weeded_reason` field documenting a deliberate removal-without-replacement.
      (No silent tombstones — a reader must be told what to use instead, or why
      nothing replaces it.)
  I2  A record carrying a `SUPERSEDED_BY` edge MUST be marked `status: deprecated`.
      (Supersession and status stay consistent.)
  P   PROVENANCE readiness (warning): a record with no `resource` cannot be
      re-verified before weeding. You can only confidently retire a claim you can
      trace back to its source.

Retirement is reversible: un-weeding is deleting the `status`/`SUPERSEDED_BY`
fields. The record's content is never destroyed by this policy.

Modes
-----
  (default)                 Audit the invariants. Exit 1 on any I1/I2 violation;
                            provenance gaps are warnings (fail only with --strict).
  --candidates [--older-than DAYS]
                            List weeding *review* candidates — records whose
                            `timestamp` is older than DAYS (default 365), oldest
                            first. Advisory: the policy weeds on a trigger (dead
                            platform, fixed gotcha), not on age; this is the
                            shelf-read that prompts you to check if a trigger
                            applies.

Usage:
    python3 weeding.py <bundle-root> [--strict]
    python3 weeding.py <bundle-root> --candidates [--older-than DAYS]
"""
import argparse
import datetime
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
RESERVED_NAMES = {"index.md", "log.md", "CLAUDE.md"}


def records(root):
    """Yield (rel, frontmatter dict) for each content file."""
    for path in sorted(root.rglob("*.md")):
        if not path.is_file() or path.name in RESERVED_NAMES:
            continue
        m = FRONTMATTER_RE.match(path.read_text(encoding="utf-8", errors="replace"))
        if not m or yaml is None:
            continue
        try:
            fm = yaml.safe_load(m.group(1))
        except Exception:
            continue
        if isinstance(fm, dict):
            yield str(path.relative_to(root)), fm


def superseded_by(fm):
    for edge in (fm.get("relationships") or []):
        if isinstance(edge, dict) and edge.get("type") == "SUPERSEDED_BY":
            return edge.get("target")
    return None


def audit(root, strict):
    errors, warnings = [], []
    for rel, fm in records(root):
        status = (fm.get("status") or "").strip() if isinstance(fm.get("status"), str) else ""
        sup = superseded_by(fm)
        reason = fm.get("weeded_reason")

        if status == "deprecated" and not sup and not reason:
            errors.append("%s: status deprecated but no SUPERSEDED_BY edge and no "
                          "weeded_reason (silent tombstone)" % rel)
        if sup and status != "deprecated":
            errors.append("%s: has SUPERSEDED_BY -> %s but status is not "
                          "'deprecated'" % (rel, sup))
        res = fm.get("resource")
        if not (isinstance(res, str) and res.strip()):
            warnings.append("%s: no provenance (resource); cannot be re-verified "
                            "before weeding" % rel)

    if errors:
        print("WEEDING POLICY VIOLATIONS (%d):" % len(errors))
        for e in errors:
            print("  ✗ %s" % e)
    if warnings:
        print("\nPROVENANCE WARNINGS (%d):" % len(warnings))
        for w in warnings:
            print("  ! %s" % w)
    if not errors and not warnings:
        print("OK: weeding policy satisfied; every record has provenance.")
    elif not errors:
        print("\nOK: no policy violations (%d provenance warning(s))." % len(warnings))

    return 1 if errors or (strict and warnings) else 0


def candidates(root, older_than):
    today = datetime.date.today()
    rows = []
    for rel, fm in records(root):
        ts = fm.get("timestamp")
        try:
            d = datetime.date.fromisoformat(str(ts))
        except (ValueError, TypeError):
            continue
        age = (today - d).days
        if age >= older_than:
            rows.append((age, rel, str(ts), fm.get("type", "")))
    rows.sort(reverse=True)
    if not rows:
        print("No records older than %d days — nothing to shelf-read." % older_than)
        return 0
    print("WEEDING REVIEW CANDIDATES (older than %d days, oldest first):" % older_than)
    print("advisory — check whether a weeding TRIGGER applies; age alone is not one.\n")
    for age, rel, ts, tp in rows:
        print("  %4dd  %-13s %s" % (age, "[%s]" % tp, rel))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bundle_dir", type=Path)
    ap.add_argument("--candidates", action="store_true")
    ap.add_argument("--older-than", type=int, default=365)
    ap.add_argument("--strict", action="store_true",
                    help="treat provenance warnings as failures")
    args = ap.parse_args()

    root = args.bundle_dir.resolve()
    if not root.is_dir():
        print("error: %s is not a directory" % root, file=sys.stderr)
        sys.exit(2)
    if yaml is None:
        print("error: PyYAML is required (pip install pyyaml)", file=sys.stderr)
        sys.exit(2)

    if args.candidates:
        sys.exit(candidates(root, args.older_than))
    sys.exit(audit(root, args.strict))


if __name__ == "__main__":
    main()
