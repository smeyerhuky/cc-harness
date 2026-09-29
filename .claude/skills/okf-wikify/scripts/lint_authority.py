#!/usr/bin/env python3
"""
Authority-control linter for OKF `tags:` (a library-science application profile).

OKF's own linter (lint_okf.py) checks *structural* conformance. This one checks
*vocabulary* conformance: it treats the `tags:` field across a bundle as a
controlled vocabulary and applies the apparatus a cataloging department uses to
keep a catalog searchable — one authorized form per concept, with variants
resolving to it.

Tag findings run in ADVISORY mode by default: they are warnings and do not
change the exit code unless --strict is passed. Adoption is meant to be
incremental — fix the high-signal variants first, let the rest accrete into the
vocabulary over time. TYPE findings are the exception: `type` is a CLOSED
vocabulary, so a TYPE finding is an error and the exit code is 1 by default.

Three tiers of finding:

  VARIANT      A tag that the authority file lists as a non-preferred entry
               term (UF). Actionable and unambiguous: rewrite it to the
               descriptor. (shown by default)
  COLLISION    Two distinct tag spellings in the corpus that differ only by
               case-fold or by a trailing plural 's'/'es'. Auto-detected, so it
               works even for concepts not yet in the vocabulary — this is how
               new authority-control candidates surface. (shown by default)
  TYPE         A `type` value that is a known non-preferred alias, or is absent
               from the registered `type` vocabulary. Unlike `tags`, `type` is a
               CLOSED vocabulary, so an unregistered value is a real finding, not
               a candidate — hence shown by default, and an error: any TYPE
               finding makes the exit code 1 even without --strict.
  FORM / UNACCESSIONED
               FORM: a tag whose spelling violates the preferred form-of-heading
               (lowercase kebab-case) and is not an allowed exception.
               UNACCESSIONED: a tag absent from the controlled vocabulary
               entirely. Both are review candidates, not defects — shown only
               with --report to keep the default run high-signal.

Usage:
    python3 lint_authority.py <bundle-root-dir> [--vocab PATH] [--report] [--strict]

The vocabulary file defaults to <bundle-root>/authority/vocabulary.yaml, or — for a
bundle without one, such as a project's kb/ — the nearest ancestor's
kb/authority/vocabulary.yaml.
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


def find_vocab(root):
    """The bundle's own authority/vocabulary.yaml, else the nearest ancestor's
    kb/authority/vocabulary.yaml, else None.

    Project bundles (projects/<name>/kb/) carry no authority file of their own:
    they are governed by the repo-wide one. Falling back to it keeps their
    vocabulary checks on by default instead of silently skipped."""
    own = root / "authority" / "vocabulary.yaml"
    if own.exists():
        return own
    for parent in root.parents:
        inherited = parent / "kb" / "authority" / "vocabulary.yaml"
        if inherited.exists():
            return inherited
    return None


def load_vocab(path: Path):
    """Return a dict of the parsed authority file, or None if unavailable."""
    if path is None or not path.exists() or yaml is None:
        return None
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    terms = data.get("terms", {}) or {}
    uf_map = {}          # non-preferred tag -> preferred descriptor
    for term, meta in terms.items():
        for variant in ((meta or {}).get("use_for") or []):
            uf_map[variant] = term
    form = data.get("form", {}) or {}
    types = data.get("types", {}) or {}
    return {
        "descriptors": set(terms),
        "uf_map": uf_map,
        "form_exceptions": set(form.get("form_exceptions") or []),
        "reviewed_distinct": {
            frozenset(pair) for pair in (data.get("reviewed_distinct") or [])
            if isinstance(pair, list) and len(pair) == 2
        },
        "types_registered": set(types.get("registered") or []),
        "types_uf": dict(types.get("use_for") or {}),
    }


def collect_records(root: Path):
    """One pass: tag_usage and type_usage, each surface form -> set of files."""
    tag_usage = defaultdict(set)
    type_usage = defaultdict(set)
    for path in sorted(root.rglob("*.md")):
        if not path.is_file() or path.name in RESERVED_NAMES:
            continue
        fm = parse_frontmatter(path.read_text(encoding="utf-8", errors="replace"))
        if not isinstance(fm, dict):
            continue
        rel = str(path.relative_to(root))
        tags = fm.get("tags")
        if isinstance(tags, str):
            tags = [tags]
        if isinstance(tags, list):
            for t in tags:
                if isinstance(t, str) and t.strip():
                    tag_usage[t.strip()].add(rel)
        tp = fm.get("type")
        if isinstance(tp, str) and tp.strip():
            type_usage[tp.strip()].add(rel)
    return tag_usage, type_usage


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
    notes = []
    usage, type_usage = collect_records(root)
    if not usage and not type_usage:
        return ["no tagged files found under %s" % root], []

    vocab = load_vocab(vocab_path)
    if vocab:
        descriptors = vocab["descriptors"]
        uf_map = vocab["uf_map"]
        form_exceptions = vocab["form_exceptions"]
        reviewed_distinct = vocab["reviewed_distinct"]
        types_registered = vocab["types_registered"]
        types_uf = vocab["types_uf"]
    else:
        descriptors = uf_map = None
        form_exceptions = set()
        reviewed_distinct = frozenset()
        types_registered = set()
        types_uf = {}
        notes.append(
            "no vocabulary file at %s — running heuristic checks only "
            "(VARIANT/TYPE/FORM/UNACCESSIONED need the authority file)"
            % (vocab_path or "%s/authority/ or any ancestor's kb/authority/" % root)
        )

    # VARIANT — tags that resolve to a preferred descriptor via UF.
    if uf_map is not None:
        for tag in sorted(usage):
            if tag in uf_map:
                files = ", ".join(sorted(usage[tag]))
                warnings.append(
                    "VARIANT: tag '%s' is non-preferred; use '%s' "
                    "(in: %s)" % (tag, uf_map[tag], files)
                )

    # COLLISION — auto-detected, no vocabulary required.
    for kind, forms in detect_collisions(set(usage), reviewed_distinct):
        label = "case-variant" if kind == "case" else "singular/plural"
        warnings.append(
            "COLLISION (%s): %s — likely one concept split across spellings; "
            "consolidate to one authorized form" % (label, " / ".join(forms))
        )

    # TYPE — a CLOSED vocabulary, so findings show by default.
    if types_registered:
        for tp in sorted(type_usage):
            files = ", ".join(sorted(type_usage[tp]))
            if tp in types_uf:
                warnings.append(
                    "TYPE: type '%s' is non-preferred; use '%s' (in: %s)"
                    % (tp, types_uf[tp], files)
                )
            elif tp not in types_registered:
                warnings.append(
                    "TYPE: type '%s' is not in the registered type vocabulary; "
                    "use a registered genre or add it to types.registered (in: %s)"
                    % (tp, files)
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
                    help="authority file (default: <bundle>/authority/vocabulary.yaml, "
                         "else the nearest ancestor's kb/authority/vocabulary.yaml)")
    ap.add_argument("--report", action="store_true",
                    help="also show FORM + UNACCESSIONED candidates and coverage")
    ap.add_argument("--strict", action="store_true",
                    help="treat every finding as a failure (exit 1); TYPE findings "
                         "fail even without it")
    args = ap.parse_args()

    root = args.bundle_dir.resolve()
    if not root.is_dir():
        print("error: %s is not a directory" % root, file=sys.stderr)
        sys.exit(2)
    if yaml is None:
        print("error: PyYAML is required (pip install pyyaml)", file=sys.stderr)
        sys.exit(2)

    vocab_path = args.vocab.resolve() if args.vocab else find_vocab(root)
    have_vocab = vocab_path is not None and vocab_path.exists()

    notes, warnings = lint(root, vocab_path, args.report)
    if have_vocab and vocab_path.parent.parent != root:
        notes.insert(0, "vocabulary: %s" % vocab_path)

    for n in notes:
        print("  · %s" % n)
    type_errors = [w for w in warnings if w.startswith("TYPE:")]
    if warnings:
        print("\nAUTHORITY FINDINGS (%d):" % len(warnings))
        for w in warnings:
            print("  ! %s" % w)
        if type_errors:
            print("\nFAIL: %d TYPE finding(s) — `type` is a closed vocabulary."
                  % len(type_errors))
    elif have_vocab:
        print("OK: no authority-control findings.")
    else:
        print("OK (heuristic checks only — vocabulary checks were NOT performed): "
              "no authority-control findings.")

    sys.exit(1 if (type_errors or (warnings and args.strict)) else 0)


if __name__ == "__main__":
    main()
