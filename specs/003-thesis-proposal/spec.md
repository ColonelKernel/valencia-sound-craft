# Specification: Preliminary Thesis Proposal draft

## Feature: a submission-ready preliminary thesis proposal aligned with the MTG × Steinberg call

### Overview

The MTG × Steinberg PhD call (application deadline 2026-07-16) requires three
documents: CV, motivation letter, and **a preliminary thesis proposal
outlining a research plan aligned with the topic proposed**. This spec
defines what that third document must contain and where it lives.

The proposal is a **private application deliverable**, not public site
content. It lives at `proposal/thesis-proposal-v1.md` (gitignored) so it
cannot be committed to the public repository by accident, while remaining
colocated with the source material that grounds it.

### User story

- As Zach applying to the MTG × Steinberg PhD position, I want a solid
  first-draft thesis proposal grounded in the work already documented in
  this dossier, so I can edit and personalize rather than start from a
  blank page under deadline pressure.

---

## Structural requirements

The proposal must include, in this order:

### FR-1: Title + one-paragraph framing
A working title, followed by a single paragraph naming the call's topic
verbatim and asserting the argument the rest of the document defends.

### FR-2: Motivation and problem statement
Why this problem matters now. What makes DAW state uniquely hard as a
research object (partial observability, cross-DAW heterogeneity, plug-in
opacity). Reference the honest labeling discipline that the public dossier
already carries (`observed / inferred / hidden`).

### FR-3: Three research questions
Sharpened versions of the site's three research questions (Represent /
Relate / Predict), each phrased as a testable research question with a
scope boundary attached.

### FR-4: Related work and gap
A short paragraph situating the proposed program against existing threads
(intelligent audio effects, mixing assistants, MIR datasets, plug-in
recommendation, DAW-interchange standards). Name the concrete gap the
proposal fills. Do NOT fabricate specific paper citations; reference
well-known frameworks, standards, and areas by name.

### FR-5: Proposed research program (three stages)
The three trajectory stages from the public dossier, expanded with:
- concrete methods (Python, PyTorch, Essentia, MIR toolchain, DAWproject
  interchange, MIDI/OSC where relevant),
- data / corpus needs and how consent is handled,
- an explicit `Not-in-scope` line per stage.

### FR-6: Evaluation plan
Per stage: what "success" looks like, which datasets/participants are
required, and what negative results would look like. Include at least one
musician-facing evaluation, not just symbolic benchmarks.

### FR-7: Preliminary results
A short section listing the artifacts already built that de-risk the
proposal: the Session State Explorer platform (4 adapters + core), the
Improv Partner benchmark result (`0.363 vs 0.163` over 112 held-out songs
/ 8,547 transitions), the AutoHarm/Autoharmonizer lineage. Every metric
must appear with its qualifier (in-sample / synthetic / held-out) — same
discipline as the public dossier.

### FR-8: Rough timeline (Y1–Y4)
A per-year sketch. Y1 corpus + observability atlas; Y2 state→audio
empirical study; Y3 interpretable prediction inside a DAW; Y4 musician-
facing user study + write-up.

### FR-9: Why MTG, why Steinberg
Two short paragraphs. MTG: name the concrete research strengths this
program leans on (audio processing, MIR datasets, embeddings/tagging).
Steinberg: the DAW + plug-in + open-interchange ecosystem this program
needs. Do NOT flatter; state the fit.

### FR-10: Ethics and open research
One paragraph. Consent-first data collection, open schemas and code,
honest labeling of unobservable state, alignment with MTG's stated
values around trustworthy and transparent AI for music.

### FR-11: References
5–8 anchor items. Well-known frameworks, standards, and open datasets
(Essentia, Freesound, DAWproject, MedleyDB, MIR-1K, Slakh, Basic Pitch)
plus 1–2 broadly-cited papers only if I am confident of the citation.
Better a short honest list than a padded fake one.

---

## Content invariants (mirroring the public dossier's discipline)

- Every quantitative claim carries its qualifier (in-sample / synthetic /
  held-out / pending validation).
- No superlatives ("cutting-edge," "revolutionary," etc.).
- First-person voice ("I propose to…").
- Explicit `Not-in-scope` framing where boundaries matter.
- No fabricated paper titles or DOIs.
- No Steinberg name-dropping beyond the "Why Steinberg" section — the
  work speaks for itself.

## Length target

~2,000 words / ~3 formatted pages. Preliminary means focused, not
exhaustive.

---

## Where the deliverable lives

- **Draft:** `proposal/thesis-proposal-v1.md` (gitignored — private).
- **This spec:** `specs/003-thesis-proposal/spec.md` (public in repo).

Zach reviews the draft locally, edits for voice and personal detail, then
exports to the format the application requires (PDF via a Markdown
renderer, or Word if easier).

---

## Completion signal

### Implementation checklist
- [ ] `proposal/` added to `.gitignore`.
- [ ] `proposal/thesis-proposal-v1.md` written to disk with all 11
      sections above populated.
- [ ] Word count within ±25% of the target (1,500–2,500).
- [ ] History note in `history/003-thesis-proposal.md` (public) capturing
      what the draft leans on and what Zach must add personally.

### Verification (this deliverable has no automated gates)
- [ ] `git status` shows the spec + gitignore change staged; the proposal
      file itself is untracked (gitignored).
- [ ] `grep -c "^#" proposal/thesis-proposal-v1.md` returns ≥ 10 (all
      section headings present).
- [ ] Grep the proposal for every metric mentioned in the public dossier
      and confirm each has its qualifier attached in-line.

**Only when all checks pass, output:** `<promise>DONE</promise>`

---

## NR_OF_TRIES: 1

## Status: COMPLETE
