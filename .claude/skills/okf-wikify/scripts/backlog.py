#!/usr/bin/env python3
"""
Backlog checker for a PDLC bundle (the harness's kb/ or a projects/<name>/kb/).

relationships.py checks that edges resolve, that `state:` values are registered,
and that dependencies have no cycles. This checks what the work-item rules in
kb/pdlc/work-items.md promise beyond that — the rules no other gate enforces:

  FIELDS      a `type: "Work Item"` file lacks `state` or `milestone`, or its
              milestone is not M<n>, M<n>.<m>, a range (M0-M5), or unscheduled
  ID          the filename is not <PREFIX>-<KIND>-<NNN>.md, or filename, title,
              and the bundle's registered prefix disagree
  TRACE       neither a DERIVED_FROM edge nor PART_OF an epic that has one
  EDGE        PART_OF to anything but an EPIC; DEPENDS_ON / BLOCKS to anything
              but a work item (a directory included)
  RESOLUTION  `done` / `declined` without a "## Resolution" section; a SPIKE
              without a "## Proposed Resolution" section
  INDEX       the backlog index misses an item, lists it twice, or shows a
              state that disagrees with the item's own
  NEXT-ID     a next-free-ID row not greater than the highest number minted
              for that kind, or a minted kind with no row
  ROADMAP     a roadmap checkbox that disagrees with the items it links:
              [x] with a linked item not done/declined, [ ] with all of them done
  JOURNAL     a running-journal entry not linked from the journal index

The bundle's prefix comes from the prefix registry
(projects/kb/projects/index.md, found by walking up from the bundle): the row
whose Backlog link resolves to this bundle's process/backlog/index.md. Pass
--prefix for a bundle outside the repo.

Every finding is an error: exit 1 if there is any, 0 otherwise. A bundle with no
process/backlog/ says so and exits 0.

Usage:
    python3 backlog.py <bundle-root-dir> [--vocab PATH] [--prefix XYZ]
"""
import argparse
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import relationships as rel  # noqa: E402  (same directory; reuse its parsing)

LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)\s]+)\)")
ID_RE = re.compile(r"^([A-Z]{2,4})-(EPIC|STORY|SPIKE|TICKET)-(\d{3})$")
MILESTONE_RE = re.compile(r"^(unscheduled|M\d+(\.\d+)?(-M?\d+(\.\d+)?)?)$")
NEXT_ID_ROW_RE = re.compile(r"^\|\s*`([A-Z]{2,4})-(EPIC|STORY|SPIKE|TICKET)`\s*\|\s*(\d+)\s*\|")
CHECKBOX_RE = re.compile(r"^- \[( |x|X)\] ")
CLOSED = {"done", "declined"}


def body_of(path):
    text = path.read_text(encoding="utf-8", errors="replace")
    m = rel.FRONTMATTER_RE.match(text)
    return text[m.end():] if m else text


def has_heading(body, heading):
    return re.search(r"^##\s+%s\s*$" % re.escape(heading), body, re.MULTILINE) is not None


def links_in(text, base_dir):
    """Resolved targets of the markdown links in text, in order."""
    out = []
    for _label, target in LINK_RE.findall(text):
        if re.match(r"^[a-z]+:", target):
            continue
        out.append((base_dir / target.split("#")[0]).resolve())
    return out


def registered_prefix(root, backlog_index):
    """(prefix, registry_path) for this bundle, or (None, registry_path|None)."""
    registry = None
    for parent in [root, *root.parents]:
        candidate = parent / "projects" / "kb" / "projects" / "index.md"
        if candidate.exists():
            registry = candidate
            break
    if registry is None:
        return None, None
    for line in registry.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3:
            continue
        m = re.search(r"`([A-Z]{2,4})`", cells[1])
        if not m:
            continue
        if backlog_index.resolve() in links_in(cells[2], registry.parent):
            return m.group(1), registry
    return None, registry


def listed_state(line, states):
    """The state shown on a backlog-index listing line, parsed structurally:
    the first ' · '-separated segment after the title whose first word is a
    registered state (so '· active · M0-M5' reads 'active', not 'M0')."""
    for segment in line.split(" · ")[1:]:
        word = segment.strip().strip("*").strip().split(" ")[0].strip("*(),.")
        if word in states:
            return word
    return None


def check(root, vocab_path, prefix_override=None):
    errors = []
    backlog_dir = root / "process" / "backlog"
    backlog_index = backlog_dir / "index.md"
    if not backlog_dir.is_dir():
        return None, "no process/backlog/ in %s — nothing to check" % root, []

    _types, _inv, _statuses, states = rel.load_vocab(vocab_path)
    states = states or {"open", "active", "blocked", "done", "declined"}

    if prefix_override:
        prefix, prefix_note = prefix_override, "--prefix"
    else:
        prefix, registry = registered_prefix(root, backlog_index)
        if prefix is None:
            errors.append("ID %s: no prefix registered for this backlog (%s)" % (
                backlog_index.relative_to(root),
                "no row in %s links to it" % registry if registry else "no prefix registry found"))
            prefix_note = "unregistered"
        else:
            prefix_note = "registry: %s" % registry

    # ---- the work items -------------------------------------------------------
    edges, _st, item_states = rel.collect(root)
    items = {}  # resolved path -> info
    for path in sorted(root.rglob("*.md")):
        if not path.is_file() or path.name in rel.RESERVED_NAMES:
            continue
        fm = rel.frontmatter(path)
        if not fm or fm.get("type") != "Work Item":
            continue
        relp = str(path.relative_to(root))
        m = ID_RE.match(path.stem)
        items[path.resolve()] = {
            "rel": relp, "path": path, "fm": fm,
            "id": path.stem, "kind": m.group(2) if m else None,
            "num": int(m.group(3)) if m else None, "prefix": m.group(1) if m else None,
            "state": item_states.get(relp),
        }

    for info in items.values():
        relp, fm = info["rel"], info["fm"]
        if not info["state"]:
            errors.append("FIELDS %s: no state" % relp)
        ms = fm.get("milestone")
        if ms is None or not str(ms).strip():
            errors.append("FIELDS %s: no milestone" % relp)
        elif not MILESTONE_RE.match(str(ms).strip()):
            errors.append("FIELDS %s: milestone '%s' is not M<n>, M<n>.<m>, a range, or "
                          "unscheduled" % (relp, ms))
        if info["kind"] is None:
            errors.append("ID %s: filename is not <PREFIX>-<KIND>-<NNN>.md" % relp)
        else:
            if prefix and info["prefix"] != prefix:
                errors.append("ID %s: prefix %s, but this backlog's registered prefix is %s"
                              % (relp, info["prefix"], prefix))
            title = str(fm.get("title", ""))
            if not title.startswith(info["id"] + ":"):
                errors.append("ID %s: title does not start with '%s:' (%r)"
                              % (relp, info["id"], title[:60]))
        body = body_of(info["path"])
        if info["state"] in CLOSED and not has_heading(body, "Resolution"):
            errors.append("RESOLUTION %s: state '%s' but no '## Resolution' section"
                          % (relp, info["state"]))
        if info["kind"] == "SPIKE" and not has_heading(body, "Proposed Resolution"):
            errors.append("RESOLUTION %s: a SPIKE needs a '## Proposed Resolution' section" % relp)

    # ---- edges: targets and traceability ---------------------------------------
    by_src = {}
    for e in edges:
        by_src.setdefault(e["src"], []).append(e)

    def derived(info):
        return any(e["type"] == "DERIVED_FROM" and e["exists"]
                   for e in by_src.get(info["rel"], []))

    for info in items.values():
        relp = info["rel"]
        traced = derived(info)
        for e in by_src.get(relp, []):
            target = items.get(e["resolved"]) if e["resolved"].is_file() else None
            if e["type"] == "PART_OF":
                if target is None or target["kind"] != "EPIC":
                    errors.append("EDGE %s: PART_OF target is not an EPIC work item -> %s"
                                  % (relp, e["target"]))
                elif derived(target):
                    traced = True
            elif e["type"] in ("DEPENDS_ON", "BLOCKS") and target is None:
                errors.append("EDGE %s: %s target is not a work item file -> %s"
                              % (relp, e["type"], e["target"]))
        if not traced:
            errors.append("TRACE %s: no DERIVED_FROM, and not PART_OF an epic that has one" % relp)

    # ---- the backlog index -------------------------------------------------------
    listed = {}
    next_ids = {}
    if not backlog_index.exists():
        errors.append("INDEX process/backlog/index.md is missing")
    else:
        for line in backlog_index.read_text(encoding="utf-8").splitlines():
            row = NEXT_ID_ROW_RE.match(line.strip())
            if row:
                next_ids[(row.group(1), row.group(2))] = int(row.group(3))
                continue
            stripped = line.lstrip()
            if not (stripped.startswith("- [") or stripped.startswith("* [")
                    or stripped.startswith("**[")):
                continue
            targets = links_in(stripped, backlog_dir)
            if not targets or targets[0] not in items:
                continue
            info = items[targets[0]]
            listed.setdefault(info["rel"], 0)
            listed[info["rel"]] += 1
            shown = listed_state(stripped, states)
            if shown is None:
                errors.append("INDEX %s: listed without a state" % info["rel"])
            elif info["state"] and shown != info["state"]:
                errors.append("INDEX %s: index shows '%s', the item says '%s'"
                              % (info["rel"], shown, info["state"]))
        for info in items.values():
            n = listed.get(info["rel"], 0)
            if n == 0:
                errors.append("INDEX %s: not listed in the backlog index" % info["rel"])
            elif n > 1:
                errors.append("INDEX %s: listed %d times in the backlog index" % (info["rel"], n))

        highest = {}
        for info in items.values():
            if info["kind"] and info["prefix"]:
                key = (info["prefix"], info["kind"])
                highest[key] = max(highest.get(key, 0), info["num"])
        for key, top in sorted(highest.items()):
            if key not in next_ids:
                errors.append("NEXT-ID no next-free-ID row for %s-%s (highest minted: %03d)"
                              % (key[0], key[1], top))
            elif next_ids[key] <= top:
                errors.append("NEXT-ID %s-%s: next free is %03d but %03d is already minted"
                              % (key[0], key[1], next_ids[key], top))

    # ---- the roadmap -------------------------------------------------------------
    roadmap = root / "process" / "roadmap.md"
    if roadmap.exists():
        lines = roadmap.read_text(encoding="utf-8").splitlines()
        i = 0
        while i < len(lines):
            m = CHECKBOX_RE.match(lines[i])
            if not m:
                i += 1
                continue
            start, block = i + 1, [lines[i]]
            i += 1
            while i < len(lines) and lines[i].startswith("  ") and lines[i].strip():
                block.append(lines[i])
                i += 1
            linked = [items[t] for t in links_in("\n".join(block), roadmap.parent) if t in items]
            if not linked:
                continue
            ticked = m.group(1).lower() == "x"
            open_items = [x["id"] for x in linked if x["state"] not in CLOSED]
            if ticked and open_items:
                errors.append("ROADMAP line %d: ticked, but %s not done" % (start, ", ".join(open_items)))
            if not ticked and not open_items:
                errors.append("ROADMAP line %d: unticked, but every linked item is done (%s)"
                              % (start, ", ".join(x["id"] for x in linked)))

    # ---- the running journal ---------------------------------------------------------
    journal_dir = root / "process" / "journal"
    if journal_dir.is_dir():
        jindex = journal_dir / "index.md"
        indexed = set(links_in(jindex.read_text(encoding="utf-8"), journal_dir)) if jindex.exists() else set()
        for entry in sorted(journal_dir.glob("*.md")):
            if entry.name == "index.md":
                continue
            if entry.resolve() not in indexed:
                errors.append("JOURNAL %s: not linked from the journal index"
                              % entry.relative_to(root))

    summary = "%d work item(s), prefix %s (%s)" % (len(items), prefix or "?", prefix_note)
    return errors, summary, items


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bundle_dir", type=Path)
    ap.add_argument("--vocab", type=Path, default=None)
    ap.add_argument("--prefix", default=None,
                    help="the bundle's work-item prefix, if it has no row in a prefix registry")
    args = ap.parse_args()

    root = args.bundle_dir.resolve()
    if not root.is_dir():
        print("error: %s is not a directory" % root, file=sys.stderr)
        sys.exit(2)
    if rel.yaml is None:
        print("error: PyYAML is required (pip install pyyaml)", file=sys.stderr)
        sys.exit(2)

    vocab_path = args.vocab.resolve() if args.vocab else rel.find_vocab(root)
    errors, summary, _items = check(root, vocab_path, args.prefix)
    if errors is None:
        print("OK: %s" % summary)
        sys.exit(0)
    if errors:
        print("BACKLOG ERRORS (%d):" % len(errors))
        for e in errors:
            print("  ✗ %s" % e)
        sys.exit(1)
    print("OK: backlog consistent — %s; index, next-free IDs, roadmap, and journal index agree."
          % summary)
    sys.exit(0)


if __name__ == "__main__":
    main()
