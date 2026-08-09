# Library & Information Science for the Agentic Harness

Library & Information Science (LIS) is the discipline of organizing recorded
knowledge so it can be *found and trusted at scale*. That is precisely the
problem an agentic coding harness has: a growing pile of KB files, specs,
lessons, and decisions that a fresh AI session must navigate, retrieve the
right two or three of, and cite. This bundle maps the mature techniques of LIS
onto the machinery this repo already has — OKF bundles, progressive disclosure,
repository-as-memory — and lays out a phased roadmap for adopting them.

Source research: *Open Courseware in Library & Information Science* (uploaded
2026-08-09) — its technical core (cataloging, authority control, metadata
standards, FRBR/LRM, information retrieval) is what this bundle operationalizes.

## Read in this order

* [Discipline Map](discipline-map.md) — the one-screen table: each LIS
  discipline → the harness mechanism it upgrades. Start here.
* [Roadmap](roadmap.md) — the six phases, what each delivers, and what is
  already shipped.

## The concept files (load the one your task needs)

* [Authority Control](authority-control.md) — one authorized term per concept;
  the controlled vocabulary and the `lint_authority.py` linter. **Phase 1, shipped.**
* [Metadata & Application Profiles](metadata-and-application-profiles.md) —
  OKF frontmatter read as a Dublin-Core-style application profile, with a
  crosswalk.
* [Retrieval & Progressive Disclosure](retrieval-and-progressive-disclosure.md)
  — progressive disclosure as an information-retrieval system, measured in
  precision and recall.
* [Collection Development](collection-development.md) — selection, weeding
  (deaccession), and provenance for KB material that accretes over time.
