#!/usr/bin/env python3
"""
Authority-control linter for OKF `tags:` (a library-science application profile).

OKF's own linter (lint_okf.py) checks *structural* conformance. This one checks
*vocabulary* conformance: it treats the `tags:` field across a bundle as a
controlled vocabulary and applies the apparatus a cataloging department uses to
keep a catalog searchable — one authorized form per concept, with variants
resolving to it.

It runs in ADVISORY mode by default: findings are warnings and the exit code is
0 unless --strict is passed. Adoption is meant to be incremental — fix the
high-signal variants first, let the rest accrete into the vocabulary over time.

Three tiers of finding:

  VARIANT      A tag that the authority file lists as a non-preferred entry
               term (UF). Actionable and unambiguous: rewrite it to the
               descriptor. (shown by default)
  COLLISION    Two distinct tag spellings in the corpus that differ only by
               case-fold or by a trailing plural 's'/'es'. Auto-detected, so it
               works even for concepts not yet in the vocabulary — this is how
               new authority-control candidates surface. (shown by default)
  FORM / UNACCESSIONED
               FORM: a tag whose spelling violates the preferred form-of-heading
               (lowercase kebab-case) and is not an allowed exception.
               UNACCESSIONED: a tag absent from the controlled vocabulary
               entirely. Both are review candidates, not defects — shown only
               with --report to keep the default run high-signal.

Usage:
    python3 lint_authority.py <bundle-root-dir> [--vocab PATH] [--report] [--strict]

The vocabulary file defaults to <bundle-root>/authority/vocabulary.yaml.
"""
import argparse
import re
import sys
from collections import defaultdict
from pathlib import Path

try:
    import yaml
except ImportError:
    yaml = None

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
RESERVED_NAMES = {"index.md", "log.md", "CLAUDE.md"}


def parse_frontmatter(text: str):
    m = FRONTMATTER_RE.match(text)
    if not m:
        return None
    if yaml is None:
        return None  # tag arrays need a real YAML parser
    try:
        return yaml.safe_load(m.group(1))
    except Exception:
        return None


def load_vocab(path: Path):
    """Return (descriptors, uf_map, form_exceptions, reviewed_distinct) or None."""
    if not path.exists() or yaml is None:
        return None
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    terms = data.get("terms", {}) or {}
    descriptors = set(terms)
    uf_map = {}          # non-preferred term -> preferred descriptor
    for term, meta in terms.items():
        for variant in ((meta or {}).get("use_for") or []):
            uf_map[variant] = term
    form = data.get("form", {}) or {}
    form_exceptions = set(form.get("form_exceptions") or [])
    reviewed_distinct = {
        frozenset(pair) for pair in (data.get("reviewed_distinct") or [])
        if isinstance(pair, list) and len(pair) == 2
    }
    return descriptors, uf_map, form_exceptions, reviewed_distinct


def collect_tags(root: Path):
    """Map every tag surface form -> sorted list of files that use it."""
    usage = defaultdict(set)
    for path in sorted(root.rglob("*.md")):
        if not path.is_file() or path.name in RESERVED_NAMES:
            continue
        fm = parse_frontmatter(path.read_text(encoding="utf-8", errors="replace"))
        if not isinstance(fm, dict):
            continue
        tags = fm.get("tags")
        if isinstance(tags, str):
            tags = [tags]
        if not isinstance(tags, list):
            continue
        rel = path.relative_to(root)
        for t in tags:
            if isinstance(t, str) and t.strip():
                usage[t.strip()].add(str(rel))
    return usage


def _singular_plural_pair(a: str, b: str) -> bool:
    for x, y in ((a, b), (b, a)):
        if y == x + "s" or y == x + "es":
            return True
    return False


def detect_collisions(tags, reviewed_distinct=frozenset()):
    """Auto-detect case-fold and singular/plural near-duplicates in the corpus.

    Pairs recorded in the vocabulary's `reviewed_distinct` list (look-alikes a
    human confirmed are different concepts) are skipped.
    """
    collisions = []

    def is_reviewed(forms):
        return frozenset(forms) in reviewed_distinct

    casefold = defaultdict(set)
    for t in tags:
        casefold[t.lower()].add(t)
    for _, forms in sorted(casefold.items()):
        if len(forms) > 1 and not is_reviewed(forms):
            collisions.append(("case", tuple(sorted(forms))))

    tag_list = sorted(tags)
    seen = set()
    for i, a in enumerate(tag_list):
        for b in tag_list[i + 1:]:
            if a.lower() == b.lower():
                continue  # already reported as a case collision
            if _singular_plural_pair(a.lower(), b.lower()):
                key = tuple(sorted((a, b)))
                if key not in seen and not is_reviewed(key):
                    seen.add(key)
                    collisions.append(("plural", key))
    return collisions


def is_wellformed(tag: str) -> bool:
    return re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", tag) is not None


def lint(root: Path, vocab_path: Path, report: bool):
    warnings = []
    usage = collect_tags(root)
    if not usage:
        return ["no tagged files found under %s" % root], []

    vocab = load_vocab(vocab_path)
    notes = []

    # VARIANT — tags that resolve to a preferred descriptor via UF.
    if vocab:
        descriptors, uf_map, form_exceptions, reviewed_distinct = vocab
        for tag in sorted(usage):
            if tag in uf_map:
                files = ", ".join(sorted(usage[tag]))
                warnings.append(
                    "VARIANT: tag '%s' is non-preferred; use '%s' "
                    "(in: %s)" % (tag, uf_map[tag], files)
                )
    else:
        descriptors = uf_map = None
        form_exceptions = set()
        reviewed_distinct = frozenset()
        notes.append(
            "no vocabulary file at %s — running heuristic checks only "
            "(VARIANT/FORM/UNACCESSIONED need the authority file)" % vocab_path
        )

    # COLLISION — auto-detected, no vocabulary required.
    for kind, forms in detect_collisions(set(usage), reviewed_distinct):
        label = "case-variant" if kind == "case" else "singular/plural"
        warnings.append(
            "COLLISION (%s): %s — likely one concept split across spellings; "
            "consolidate to one authorized form" % (label, " / ".join(forms))
        )

    # FORM + UNACCESSIONED — review candidates, only with --report.
    if report:
        for tag in sorted(usage):
            if not is_wellformed(tag) and tag not in form_exceptions:
                warnings.append(
                    "FORM: tag '%s' is not lowercase kebab-case "
                    "(add to form_exceptions if it is a proper noun)" % tag
                )
        if descriptors is not None:
            known = descriptors | set(uf_map)
            unaccessioned = sorted(t for t in usage if t not in known)
            if unaccessioned:
                warnings.append(
                    "UNACCESSIONED (%d terms not in the controlled vocabulary): %s"
                    % (len(unaccessioned), ", ".join(unaccessioned))
                )
                total = len(usage)
                covered = total - len(unaccessioned)
                notes.append(
                    "vocabulary coverage: %d/%d distinct tags accessioned (%.0f%%)"
                    % (covered, total, 100.0 * covered / total)
                )

    return notes, warnings


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bundle_dir", type=Path)
    ap.add_argument("--vocab", type=Path, default=None,
                    help="authority file (default: <bundle>/authority/vocabulary.yaml)")
    ap.add_argument("--report", action="store_true",
                    help="also show FORM + UNACCESSIONED candidates and coverage")
    ap.add_argument("--strict", action="store_true",
                    help="treat findings as failures (exit 1)")
    args = ap.parse_args()

    root = args.bundle_dir.resolve()
    if not root.is_dir():
        print("error: %s is not a directory" % root, file=sys.stderr)
        sys.exit(2)
    if yaml is None:
        print("error: PyYAML is required (pip install pyyaml)", file=sys.stderr)
        sys.exit(2)

    vocab_path = (args.vocab or (root / "authority" / "vocabulary.yaml")).resolve()

    notes, warnings = lint(root, vocab_path, args.report)

    for n in notes:
        print("  · %s" % n)
    if warnings:
        print("\nAUTHORITY FINDINGS (%d):" % len(warnings))
        for w in warnings:
            print("  ! %s" % w)
    else:
        print("OK: no authority-control findings.")

    sys.exit(1 if (warnings and args.strict) else 0)


if __name__ == "__main__":
    main()
