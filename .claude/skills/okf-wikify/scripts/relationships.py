#!/usr/bin/env python3
"""
Relationship-graph validator + query tool for the OKF `relationships:` field.

This is the FRBR/LRM layer of the library-science overlay: typed edges between
records that an agent can *query* mechanically, rather than inferring from prose.
Where lint_authority.py governs the vocabulary of `tags`/`type`, this tool
governs the vocabulary and integrity of the *edges*, and answers the questions
the edges exist to answer.

Edge vocabulary and valid `status` / `state` values are read from the
authority file (default: <bundle>/authority/vocabulary.yaml, or — for a bundle
without one, such as a project's kb/ — the nearest ancestor's
kb/authority/vocabulary.yaml):
`relationship_types`, `statuses` (record lifecycle), and `work_item_states`
(PDLC work-item lifecycle — see kb/process/backlog/).

Modes
-----
  (default)              Validate: every edge's `type` is registered and its
                         `target` resolves to a file that exists; every `status`
                         and every `state` is a registered value; `DEPENDS_ON`
                         edges (with `BLOCKS` read as reversed `DEPENDS_ON`)
                         contain no self-loop and no cycle. Exit 1 on any error.
  --current              Answer "what is still current?" — list records marked
                         status: deprecated and/or carrying a SUPERSEDED_BY edge,
                         with their superseder. Prints "all current" if none.
  --governed-by FILE     Show what governs FILE (its GOVERNED_BY / GOVERNS edges,
                         both directions).
  --graph                Print every typed edge as  src --TYPE--> target.
  --deps                 Print the dependency order: files grouped by level
                         (level 0 waits for nothing; level n waits only on
                         lower levels), each with its `state` and what it waits
                         for, then the open items that are ready now — every
                         dependency done. Exit 1 if the dependencies have a
                         self-loop or cycle.

Usage:
    python3 relationships.py <bundle-root-dir> [--vocab PATH]
                             [--current | --governed-by FILE | --graph | --deps]
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


def load_vocab(path):
    if path is None or not path.exists() or yaml is None:
        return set(), {}, set(), set()
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    rel_types = data.get("relationship_types", {}) or {}
    inverses = {k: (v or {}).get("inverse") for k, v in rel_types.items()}
    return (set(rel_types), inverses, set(data.get("statuses") or []),
            set(data.get("work_item_states") or []))


def resolve(target, file_path, root):
    t = target.split("#")[0]
    if t.startswith("/"):
        return (root / t.lstrip("/")).resolve()
    return (file_path.parent / t).resolve()


def collect(root):
    """Return (edges, statuses, states).

    edges: list of dicts {src, type, target, resolved, exists}
    statuses: {src_rel: status}   (record lifecycle)
    states: {src_rel: state}      (work-item lifecycle)
    """
    edges, statuses, states = [], {}, {}
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
        ws = fm.get("state")
        if isinstance(ws, str) and ws.strip():
            states[src] = ws.strip()
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
    return edges, statuses, states


# ---- modes -----------------------------------------------------------------

def validate(edges, statuses, reg_types, valid_status, states=None, valid_states=None):
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
    for src, ws in (states or {}).items():
        if valid_states and ws not in valid_states:
            errors.append("%s: unregistered state '%s' (work_item_states: %s)"
                          % (src, ws, ", ".join(sorted(valid_states))))
    return errors


def dependency_graph(edges, root):
    """{file: set(files it depends on)}, keyed by path relative to root.

    `A --DEPENDS_ON--> B` and `B --BLOCKS--> A` both mean A waits for B. Only
    edges whose target is an existing file inside the bundle take part; a
    broken target is already reported by validate()."""
    graph = {}
    for e in edges:
        if e["type"] not in ("DEPENDS_ON", "BLOCKS") or not e["resolved"].is_file():
            continue
        try:
            tgt = str(e["resolved"].relative_to(root))
        except ValueError:
            continue
        waiter, waited_on = (e["src"], tgt) if e["type"] == "DEPENDS_ON" else (tgt, e["src"])
        graph.setdefault(waiter, set()).add(waited_on)
    return graph


def dependency_errors(graph):
    """Every self-loop, and at least one cycle through each group of mutually
    dependent files (a depth-first search reports each back edge it meets), one
    message each. A backlog with any cycle has no valid work order."""
    errors = []
    for node in sorted(graph):
        if node in graph[node]:
            errors.append("%s: depends on itself (DEPENDS_ON/BLOCKS self-loop)" % node)
    seen_cycles = set()
    color = {}  # absent = unvisited, 1 = on the current path, 2 = finished

    def visit(node, path):
        color[node] = 1
        path.append(node)
        for nxt in sorted(graph.get(node, ())):
            if nxt == node:
                continue  # reported above as a self-loop
            if color.get(nxt) == 1:
                cycle = path[path.index(nxt):]
                i = cycle.index(min(cycle))
                key = tuple(cycle[i:] + cycle[:i])
                if key not in seen_cycles:
                    seen_cycles.add(key)
                    errors.append("dependency cycle: %s"
                                  % " -> ".join(list(key) + [key[0]]))
            elif nxt not in color:
                visit(nxt, path)
        path.pop()
        color[node] = 2

    for node in sorted(graph):
        if node not in color:
            visit(node, [])
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


def query_deps(edges, states, root):
    graph = dependency_graph(edges, root)
    loops = dependency_errors(graph)
    if loops:
        print("DEPENDENCY ERRORS (%d):" % len(loops))
        for e in loops:
            print("  ✗ %s" % e)
        return 1
    nodes = set(graph) | {d for deps in graph.values() for d in deps}
    if not nodes:
        print("No DEPENDS_ON/BLOCKS edges in the bundle.")
        return 0
    level = {}

    def depth(n):
        if n not in level:
            level[n] = 1 + max((depth(d) for d in graph.get(n, ())), default=-1)
        return level[n]

    for n in nodes:
        depth(n)
    name = lambda n: Path(n).stem
    tag = lambda n: " [%s]" % states[n] if n in states else ""
    n_edges = sum(len(v) for v in graph.values())
    print("DEPENDENCY ORDER — %d file(s), %d edge(s) (DEPENDS_ON, with BLOCKS reversed)"
          % (len(nodes), n_edges))
    for lv in range(max(level.values()) + 1):
        print("level %d%s:" % (lv, " (waits for nothing)" if lv == 0 else ""))
        for n in sorted(x for x in nodes if level[x] == lv):
            waits = ", ".join(name(d) for d in sorted(graph.get(n, ())))
            print("  %s%s%s" % (name(n), tag(n), ("  <- " + waits) if waits else ""))
    ready = sorted(n for n in nodes if states.get(n) == "open"
                   and all(states.get(d) in ("done", "declined") for d in graph.get(n, ())))
    print("ready (open, every dependency done): %s"
          % (", ".join(name(n) for n in ready) if ready else "none"))
    return 0


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bundle_dir", type=Path)
    ap.add_argument("--vocab", type=Path, default=None)
    g = ap.add_mutually_exclusive_group()
    g.add_argument("--current", action="store_true")
    g.add_argument("--governed-by", metavar="FILE")
    g.add_argument("--graph", action="store_true")
    g.add_argument("--deps", action="store_true")
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
    reg_types, _inverses, valid_status, valid_states = load_vocab(vocab_path)
    edges, statuses, states = collect(root)

    if args.graph:
        query_graph(edges)
        sys.exit(0)
    if args.deps:
        sys.exit(query_deps(edges, states, root))
    if args.current:
        query_current(edges, statuses)
        sys.exit(0)
    if args.governed_by:
        query_governed_by(edges, args.governed_by)
        sys.exit(0)

    # default: validate
    errors = validate(edges, statuses, reg_types, valid_status, states, valid_states)
    errors += dependency_errors(dependency_graph(edges, root))
    n_edges = len(edges)
    if errors:
        print("RELATIONSHIP ERRORS (%d):" % len(errors))
        for e in errors:
            print("  ✗ %s" % e)
        sys.exit(1)
    if not have_vocab:
        print("WARNING: no vocabulary found (%s/authority/ or any ancestor's kb/authority/) — "
              "only edge targets were checked; relationship types, statuses, and states "
              "were NOT validated. Pass --vocab." % root)
        print("OK (targets only): %d relationship edge(s) resolve." % n_edges)
        sys.exit(0)
    inherited = "" if vocab_path.parent.parent == root else " [vocabulary: %s]" % vocab_path
    print("OK: %d relationship edge(s) valid; %d record(s) with status; "
          "%d work item(s) with state.%s" % (n_edges, len(statuses), len(states), inherited))
    sys.exit(0)


if __name__ == "__main__":
    main()
