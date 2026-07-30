# Source Type: PDF

## Extraction

Prefer `pdftotext -layout` for text-heavy PDFs (papers, reports, specs) — it preserves the physical layout, which keeps tables and multi-column text readable:

```bash
pdftotext -layout source.pdf /tmp/source-extract.txt
```

If the pdf-analyzer skill is available, defer to its tool-selection logic instead of guessing — it already knows when to reach for `pdftotext -bbox`, `pdftohtml`, `pdfimages`, etc. for edge cases (scanned PDFs, PDFs with embedded figures worth extracting, tables that don't survive `-layout`).

Check `pdfinfo source.pdf` first for page count — if it's large (50+ pages), you'll need multiple `Read` calls on the extracted text to get through the whole thing before decomposing; don't skip pages.

## What to preserve

- **Numbers and tables verbatim.** A paper's claims live in specific figures (percentages, latencies, sample sizes) — decomposition should preserve these exactly, not round or summarize them away. If a table is central to a section, reproduce it as a markdown table in the corresponding concept file rather than describing it prose-only.
- **Section/subsection structure as a starting point, not a constraint.** Papers often bury one idea across a section and its appendix (e.g. a mechanism in §2 and its extended ablation in an appendix) — it's fine, often better, to put the mechanism and a "see also" pointer to the appendix ablation in the same concept file's cross-links, rather than mirroring the PDF's own section numbering 1:1 into the wiki's directory names.
- **The abstract and conclusion as sources for the root `index.md` summary**, not as their own concept files — they're compressed restatements of content that already has its own files.

## Typical directory shape for a paper

```
kb/
├── index.md
├── concepts/        the core mechanism/method/framework
├── results/         experiments, benchmarks, evaluations
├── related-work/    positioning vs. prior work (often has its own section in the paper)
├── appendix/        implementation details, extended tables, ablations
└── references/      bibliography, grouped by which related-work file cites each entry
```

Adjust names/count to fit — a systems paper might want `architecture/` and `benchmarks/`; a theory paper might want `definitions/` and `proofs/`. Don't force this exact taxonomy onto material it doesn't fit.

## Bibliography handling

Don't make every citation its own file — that's noise, not knowledge. One `references/bibliography.md` grouping citations by which concept/related-work file cites them is normally enough, unless a specific cited work is itself a major subject of comparison (in which case it may deserve its own file in `related-work/`).
