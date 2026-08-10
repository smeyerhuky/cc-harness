#!/usr/bin/env python3
"""
Retrieval eval for the KB — makes progressive disclosure measurable (Phase 4).

Progressive disclosure ("load the two or three files that answer the question")
is an information-retrieval problem, so it can be scored like one. This tool runs
an eval set of realistic questions, each with a gold set of files that SHOULD be
retrieved, against a transparent retriever over kb/, and reports precision,
recall, and F1 at k. That turns "did this KB edit help?" from a matter of opinion
into a measured number.

The retriever is a deliberately simple, deterministic TF-IDF ranker — NOT a
stand-in for the LLM's judgment, but a reproducible *structural* signal: it
responds to exactly the things the library-science overlay improves (consolidated
tags, sharper titles/descriptions, cross-references). If a KB edit raises the
score here, it has made the corpus easier to retrieve from by any means.

`--expand` additionally expands query terms through the controlled vocabulary's
`related` (RT) and `use_for` (UF) edges, modelling how "see also" cross-references
and authority control improve recall — and prints the delta vs the baseline.

Usage:
    python3 retrieval_eval.py <bundle-root> [--evalset PATH] [--vocab PATH]
                              [--k N] [--expand] [--per-query] [--gate-recall F]
"""
import argparse
import math
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
TOKEN_RE = re.compile(r"[a-z0-9]+")
STOP = set("a an and are as at be by for from how do does i in into is it my of on "
           "or should the this to via what when where which why with you your can "
           "keep instead still across get got".split())

# Field weights — metadata is a stronger retrieval signal than body prose.
WEIGHTS = {"title": 3.0, "tags": 3.0, "description": 2.0, "type": 1.0, "body": 1.0}


def tokenize(text):
    return [t for t in TOKEN_RE.findall(text.lower()) if len(t) > 1 and t not in STOP]


def parse_file(path):
    text = path.read_text(encoding="utf-8", errors="replace")
    m = FRONTMATTER_RE.match(text)
    fm, body = {}, text
    if m and yaml is not None:
        try:
            fm = yaml.safe_load(m.group(1)) or {}
        except Exception:
            fm = {}
        body = text[m.end():]
    if not isinstance(fm, dict):
        fm, body = {}, text
    return fm, body


def field_text(fm, body):
    tags = fm.get("tags")
    if isinstance(tags, str):
        tags = [tags]
    return {
        "title": str(fm.get("title", "")),
        "tags": " ".join(tags) if isinstance(tags, list) else "",
        "description": str(fm.get("description", "")),
        "type": str(fm.get("type", "")),
        "body": body,
    }


def build_index(root):
    """Return (doc_tf, idf) where doc_tf[rel][term] is a weighted term freq."""
    doc_tf = {}
    df = defaultdict(int)
    for path in sorted(root.rglob("*.md")):
        if not path.is_file() or path.name in RESERVED_NAMES:
            continue
        fm, body = parse_file(path)
        tf = defaultdict(float)
        for field, w in WEIGHTS.items():
            for tok in tokenize(field_text(fm, body)[field]):
                tf[tok] += w
        rel = str(path.relative_to(root))
        doc_tf[rel] = tf
        for term in tf:
            df[term] += 1
    n = len(doc_tf)
    idf = {t: math.log((n + 1) / (c + 1)) + 1.0 for t, c in df.items()}
    return doc_tf, idf


def load_expansion(vocab_path):
    """term -> set(expansion terms) from the controlled vocabulary (RT + UF)."""
    if not vocab_path.exists() or yaml is None:
        return {}
    data = yaml.safe_load(vocab_path.read_text(encoding="utf-8")) or {}
    exp = defaultdict(set)
    for desc, meta in (data.get("terms") or {}).items():
        meta = meta or {}
        neighbors = set(meta.get("related") or []) | set(meta.get("use_for") or []) | {desc}
        forms = {desc} | set(meta.get("use_for") or [])
        for form in forms:
            for n in neighbors:
                for tok in tokenize(n):
                    exp[form].add(tok)
    return exp


def expand_terms(terms, expansion):
    """Return {term: weight}; expansion terms enter at reduced weight."""
    weighted = {t: 1.0 for t in terms}
    for t in terms:
        for e in expansion.get(t, ()):
            weighted.setdefault(e, 0.0)
            weighted[e] = max(weighted[e], 0.5)
    return weighted


def rank(query, doc_tf, idf, expansion=None, k=3):
    terms = tokenize(query)
    qweights = expand_terms(terms, expansion) if expansion else {t: 1.0 for t in terms}
    scores = []
    for rel, tf in doc_tf.items():
        s = sum(w * tf.get(t, 0.0) * idf.get(t, 0.0) for t, w in qweights.items())
        scores.append((rel, s))
    scores.sort(key=lambda x: (-x[1], x[0]))
    return [rel for rel, s in scores[:k] if s > 0]


def prf(retrieved, gold, k):
    hits = len(set(retrieved) & set(gold))
    precision = hits / k if k else 0.0
    recall = hits / len(gold) if gold else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    return precision, recall, f1, hits


def run(root, evalset, doc_tf, idf, expansion, k, per_query):
    rows = []
    for q in evalset["queries"]:
        retrieved = rank(q["query"], doc_tf, idf, expansion, k)
        p, r, f1, hits = prf(retrieved, q["gold"], k)
        rows.append((q["id"], p, r, f1, hits, len(q["gold"]), retrieved))
    mp = sum(x[1] for x in rows) / len(rows)
    mr = sum(x[2] for x in rows) / len(rows)
    mf = sum(x[3] for x in rows) / len(rows)
    if per_query:
        print("  %-22s  P@k   R@k   F1    hits/gold" % "query")
        for qid, p, r, f1, hits, ng, retr in rows:
            print("  %-22s  %.2f  %.2f  %.2f  %d/%d" % (qid, p, r, f1, hits, ng))
    return mp, mr, mf, rows


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("bundle_dir", type=Path)
    ap.add_argument("--evalset", type=Path, default=None)
    ap.add_argument("--vocab", type=Path, default=None)
    ap.add_argument("--k", type=int, default=None)
    ap.add_argument("--expand", action="store_true",
                    help="also run with controlled-vocabulary query expansion and show the delta")
    ap.add_argument("--per-query", action="store_true")
    ap.add_argument("--gate-recall", type=float, default=None,
                    help="exit 1 if mean recall@k falls below this threshold")
    args = ap.parse_args()

    root = args.bundle_dir.resolve()
    if yaml is None:
        print("error: PyYAML is required (pip install pyyaml)", file=sys.stderr)
        sys.exit(2)
    evalset_path = (args.evalset or
                    (root / "library-science" / "eval" / "retrieval-evalset.yaml")).resolve()
    if not evalset_path.exists():
        print("error: eval set not found at %s" % evalset_path, file=sys.stderr)
        sys.exit(2)
    evalset = yaml.safe_load(evalset_path.read_text(encoding="utf-8"))
    k = args.k or evalset.get("k", 3)
    vocab_path = (args.vocab or (root / "authority" / "vocabulary.yaml")).resolve()

    doc_tf, idf = build_index(root)
    print("corpus: %d content files | eval: %d queries | k=%d\n"
          % (len(doc_tf), len(evalset["queries"]), k))

    print("BASELINE (TF-IDF over title/tags/description/type/body):")
    mp, mr, mf, _ = run(root, evalset, doc_tf, idf, None, k, args.per_query)
    print("  mean  P@k=%.3f  R@k=%.3f  F1=%.3f\n" % (mp, mr, mf))

    if args.expand:
        expansion = load_expansion(vocab_path)
        print("EXPANDED (+ controlled-vocabulary related/use_for query expansion):")
        ep, er, ef, _ = run(root, evalset, doc_tf, idf, expansion, k, args.per_query)
        print("  mean  P@k=%.3f  R@k=%.3f  F1=%.3f" % (ep, er, ef))
        print("  delta R@k=%+.3f  F1=%+.3f  (from vocabulary cross-references)\n"
              % (er - mr, ef - mf))

    if args.gate_recall is not None and mr < args.gate_recall:
        print("GATE FAIL: mean recall@k %.3f < %.3f" % (mr, args.gate_recall))
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
