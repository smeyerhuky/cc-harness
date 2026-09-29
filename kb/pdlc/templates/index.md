# PDLC Templates

Fill-in skeletons for the files the PDLC layer asks every project to keep. Copy, fill, and
delete the notes; don't improvise a new shape per file. Templates live only here — projects link
to them rather than keeping copies that drift.

**Changing a template? Run the exit test before committing.** Fill its fenced `markdown` block
the way a hurried session would — global find-and-replace of every `<…>` slot — into a scratch
bundle; validate with `lint_okf.py`, `lint_authority.py --vocab kb/authority/vocabulary.yaml`,
and `relationships.py --vocab kb/authority/vocabulary.yaml` **in its default mode** — each must
exit 0 (a scratch bundle outside the repo has no ancestor vocabulary to find, so `--vocab` is
needed here). Only then run `relationships.py … --graph` to **read the graph** (no
self-referencing edge): `--graph` prints edges without validating them and always exits 0, so it
cannot be the check. Finally confirm **no `<…>` is left over**. Every placeholder needs a distinct
name, and none may nest inside another — both defects pass every linter and are caught only
this way.

* [Work Item](work-item.md) — the skeleton for an epic, story, spike, or ticket, with per-kind notes.
* [Running-Journal Entry](running-journal-entry.md) — one entry per working session that changed anything.
* [Spike Journal](spike-journal.md) — `spikes/<slug>/JOURNAL.md`: purpose → method → findings → discrepancies → open questions → artifacts, then addenda.
* [Handoff](handoff.md) — the single current-state brief a fresh session reads first.
* [Facilitator's Journal](facilitators-journal.md) — a ceremony's process log, written as it runs.
* [Transcript](transcript.md) — an optional, numbered ceremony transcript: attributed, traced, with `DECISION`/`DISSENT` callouts.
* [Decisions Record](decisions-record.md) — the one page the owner reads; variants for triage and investigation.
