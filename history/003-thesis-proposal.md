# Iteration notes — spec 003-thesis-proposal

## 2026-07-13 — first attempt (successful)

One-shot draft. The proposal draft lives at `proposal/thesis-proposal-v1.md`
(gitignored — private application document). This history note is public
so future sessions can find it, but the draft itself is not.

## What the draft leans on

Grounded directly in what the public dossier and the source repos already
document — no invented artifacts, no invented metrics:
- Session State Explorer platform (Cubase / Ableton / REAPER / Logic
  adapters + core), verified against the actual `.py` LOC counts and test
  file counts from the source repos.
- Ableton hit@1 ≈ 0.62 / hit@3 ≈ 0.95 (synthetic, in-source doc).
- Logic 99.3% in-sample coverage (in-source doc).
- Improv Partner 0.363-vs-0.163 over 112 songs / 8,547 transitions
  (in-source `ImprovPartner/docs/CHORD_PREDICTION.md`, verified this
  session).
- AutoHarm / Autoharmonizer four-corpus Markov + JazzNet RNN/LSTM via
  ONNX/PyTorch with torch↔ONNX parity (in-source doc).

Every quantitative claim carries its qualifier (synthetic / in-sample /
held-out / pending validation), same discipline the public dossier uses.

## What Zach needs to add before submission

1. **Voice pass.** The draft is deliberately restrained. Add the personal
   detail an admissions committee actually wants to know: the specific
   musical background, why the pivot from public-policy to music tech,
   what draws you to *this specific* PhD (not just the topic).
2. **Bibliography.** The references list is an anchor list of well-known
   frameworks and datasets (Essentia, Freesound, MedleyDB, Slakh,
   Basic Pitch, DAWproject). I flagged one entry as
   "Consult before final submission" so it can't slip through unedited —
   confirm every citation before submitting and add domain-specific
   references you know well.
3. **Steinberg secondment mechanics.** The Y2 six-month secondment line
   is a plausible placeholder; check what the funded scheme actually
   allows and adjust duration/timing accordingly.
4. **Format.** Export to whatever format the application requires (PDF
   from Pandoc, Word from a converter). Keep the source in Markdown so
   revisions stay diffable if you want to iterate.

## One thing to watch
- The proposal is intentionally similar in structure to the public
  dossier — this is a feature, not a bug (a reviewer landing on
  zachscheffler.com will see the same argument developed there). But if
  Zach adds material that diverges from the site, keep both consistent
  or explicitly acknowledge in the proposal that the site is a
  companion piece.

## Gates
Not an automated-gate deliverable. Verification per the spec:
- Word count 2,046 (within 1,500–2,500) ✓
- Heading count 12 (≥ 10) ✓
- `proposal/thesis-proposal-v1.md` correctly gitignored, only spec + `.gitignore` staged ✓
- Metric qualifiers present in-line for every quantitative claim ✓

## Location
- Public spec + gitignore change: this branch's PR.
- Private draft: `/Users/zacharyscheffler/Documents/valencia-sound-craft/proposal/thesis-proposal-v1.md`
  — edit locally, do not commit.
