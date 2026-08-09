#!/usr/bin/env python3
"""
Relationship-graph validator + query tool for the OKF `relationships:` field.

This is the FRBR/LRM layer of the library-science overlay: typed edges between
records that an agent can *query* mechanically, rather than inferring from prose.
Where lint_authority.py governs the vocabulary of `tags`/`type`, this tool
governs the vocabulary and integrity of the *edges*, and answers the questions
the edges exist to answer.

Edge vocabulary and valid `status` values are read from the authority file
(default: <bundle>/authority/vocabulary.yaml): `relationship_types` and
`statuses`.

Modes
-----
  (default)              Validate: every edge's `type` is registered and its
                         `target` resolves to a file that exists; every `status`
                         is a registered value. Exit 1 on any error.
  --current              Answer "what is still current?" — list records marked
                         status: deprecated and/or carrying a SUPERSEDED_BY edge,
                         with their superseder. Prints "all current" if none.
  --governed-by FILE     Show what governs FILE (its GOVERNED_BY / GOVERNS edges,
                         both directions).
  --graph                Print every typed edge as  src --TYPE--> target.

Usage:
    python3 relationships.py <bundle-root-dir> [--vocab PATH]
                             [--current | --governed-by FILE | --graph]
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
RESERVED_NAMES = {"index.md", "log.md", "CLAUDE.md"}


def frontmatter(path):
    m = FRONTMATTER_RE.match(path.read_text(encoding="utf-8", errors="replace"))
    if not m or yaml is None:
        return None
    try:
        data = yaml.safe_load(m.group(1))
        return data if isinstance(data, dict) else None
    except Exception:
        return None


def load_vocab(path):
    if not path.exists() or yaml is None:
        return set(), {}, set()
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    rel_types = data.get("relationship_types", {}) or {}
    inverses = {k: (v or {}).get("inverse") for k, v in rel_types.items()}
    return set(rel_types), inverses, set(data.get("statuses") or [])


def resolve(target, file_path, root):
    t = target.split("#")[0]
    if t.startswith("/"):
        return (root / t.lstrip("/")).resolve()
    return (file_path.parent / t).resolve()


def collect(root):
    """Return (edges, statuses).

    edges: list of dicts {src, type, target, resolved, exists}
    statuses: {src_rel: status}
    """
    edges, statuses = [], {}
    for path in sorted(root.rglob("*.md")):
        if not path.is_file() or path.name in RESERVED_NAMES:
            continue
        fm = frontmatter(path)
        if not fm:
            continue
        src = str(path.relative_to(root))
        st = fm.get("status")
        if isinstance(st, str) and st.strip():
            statuses[src] = st.strip()
        rels = fm.get("relationships")
        if not isinstance(rels, list):
            continue
        for edge in rels:
            if not isinstance(edge, dict):
                continue
            etype, target = edge.get("type"), edge.get("target")
            if not etype or not target:
                continue
            resolved = resolve(str(target), path, root)
            edges.append({
                "src": src,
                "type": str(etype),
                "target": str(target),
                "resolved": resolved,
                "exists": resolved.exists(),
            })
    return edges, statuses


# ---- modes -----------------------------------------------------------------

def validate(edges, statuses, reg_types, valid_status):
    errors = []
    for e in edges:
        if reg_types and e["type"] not in reg_types:
            errors.append("%s: unregistered relationship type '%s' "
                          "(add it to relationship_types)" % (e["src"], e["type"]))
        if not e["exists"]:
            errors.append("%s: %s target does not resolve -> %s"
                          % (e["src"], e["type"], e["target"]))
    for src, st in statuses.items():
        if valid_status and st not in valid_status:
            errors.append("%s: unregistered status '%s'" % (src, st))
    return errors


def query_current(edges, statuses):
    superseder = {e["src"]: e["target"] for e in edges if e["type"] == "SUPERSEDED_BY"}
    stale = sorted(set(superseder) | {s for s, v in statuses.items() if v == "deprecated"})
    total = len({e["src"] for e in edges}) or 0
    if not stale:
        print("All records current — none deprecated or superseded.")
        return
    print("NOT CURRENT (%d):" % len(stale))
    for s in stale:
        tag = statuses.get(s, "")
        by = superseder.get(s)
        detail = []
        if tag:
            detail.append("status: %s" % tag)
        if by:
            detail.append("superseded by %s" % by)
        print("  - %s%s" % (s, (" (" + "; ".join(detail) + ")") if detail else ""))


def query_governed_by(edges, target_file):
    tf = target_file.lstrip("/")
    up = [e for e in edges if e["type"] == "GOVERNED_BY" and e["src"].endswith(tf)]
    down = [e for e in edges if e["type"] == "GOVERNS"
            and (e["target"].lstrip("/").endswith(tf) or e["target"].endswith(tf))]
    gov_of = [e for e in edges if e["type"] == "GOVERNS" and e["src"].endswith(tf)]
    if not (up or down or gov_of):
        print("No governance edges touch %s." % target_file)
        return
    for e in up:
        print("%s  --GOVERNED_BY-->  %s" % (e["src"], e["target"]))
    for e in down:
        print("%s  --GOVERNS-->  %s   (governs %s)" % (e["src"], e["target"], target_file))
    for e in gov_of:
        print("%s  --GOVERNS-->  %s" % (e["src"], e["target"]))


def query_graph(edges):
    if not edges:
        print("No typed relationship edges in the bundle.")
        return
    for e in sorted(edges, key=lambda x: (x["src"], x["type"])):
        mark = "" if e["exists"] else "  [BROKEN]"
        print("%s  --%s-->  %s%s" % (e["src"], e["type"], e["target"], mark))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bundle_dir", type=Path)
    ap.add_argument("--vocab", type=Path, default=None)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--current", action="store_true")
    g.add_argument("--governed-by", metavar="FILE")
    g.add_argument("--graph", action="store_true")
    args = ap.parse_args()

    root = args.bundle_dir.resolve()
    if not root.is_dir():
        print("error: %s is not a directory" % root, file=sys.stderr)
        sys.exit(2)
    if yaml is None:
        print("error: PyYAML is required (pip install pyyaml)", file=sys.stderr)
        sys.exit(2)

    vocab_path = (args.vocab or (root / "authority" / "vocabulary.yaml")).resolve()
    reg_types, _inverses, valid_status = load_vocab(vocab_path)
    edges, statuses = collect(root)

    if args.graph:
        query_graph(edges)
        sys.exit(0)
    if args.current:
        query_current(edges, statuses)
        sys.exit(0)
    if args.governed_by:
        query_governed_by(edges, args.governed_by)
        sys.exit(0)

    # default: validate
    errors = validate(edges, statuses, reg_types, valid_status)
    n_edges = len(edges)
    if errors:
        print("RELATIONSHIP ERRORS (%d):" % len(errors))
        for e in errors:
            print("  ✗ %s" % e)
        sys.exit(1)
    print("OK: %d relationship edge(s) valid; %d record(s) with status."
          % (n_edges, len(statuses)))
    sys.exit(0)


if __name__ == "__main__":
    main()
