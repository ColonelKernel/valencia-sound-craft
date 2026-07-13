# Specification: Proposed Research Trajectory section

## Feature: A public bridge from "what I've built" to "what I want to do next"

### Overview

The dossier currently jumps from case studies → supporting projects → background.
A reviewer following the argument reaches the education list without ever seeing
an explicit statement of the doctoral trajectory this portfolio is aimed at.

This spec adds one new page section — **"Proposed research trajectory"** —
between the case studies and the background. It mirrors the MTG call's language
(interpretable representations of DAW state, connection to acoustic outcomes,
creativity-supporting prediction, MIR / audio effects & processing / ML / music
production) without name-dropping Steinberg or Cubase. The Cubase-first ordering
already in the flagship case study carries the industry-partner signal
implicitly.

### User story

- As a PhD-admissions reviewer at MTG, I want to see how the work in this
  portfolio would extend into a doctoral research program, so I can judge fit
  against the funded topic without having to read the applicant's motivation
  letter alongside the site.

---

## Functional requirements

### FR-1: The trajectory section renders on the page

A new section renders between `#projects` and `#background` inside
`src/pages/Index.tsx`. Its id is `#trajectory` and it uses existing page-shell
and section-heading styles (no new CSS classes).

**Acceptance criteria:**
- [ ] `#trajectory` element exists in the rendered DOM.
- [ ] It appears **after** `#projects` and **before** `#background` in document
      order.
- [ ] Its heading text contains the exact string "research trajectory".
- [ ] Its body text contains the exact string "acoustic outcomes".
- [ ] Its body text contains the exact string "creativity-supporting".
- [ ] No new import outside the current live-graph is added
      (`src/pages/Index.tsx` still imports only from `@/components/Navbar` and
      `@/content/research`).

### FR-2: The section's content is data-driven, not hardcoded prose

A new export `researchTrajectory` (an ordered array of typed objects) is added
to `src/content/research.ts`. `Index.tsx` maps over it to render the section.
This matches the existing pattern for `caseStudies`, `supportingProjects`, and
`education`.

**Acceptance criteria:**
- [ ] `src/content/research.ts` exports an interface `ResearchTrajectoryStage`
      with the fields: `number` (e.g. `"01"`), `title`, `summary`, `signals`
      (`string[]`, at most 4), and optional `boundary` (`string`).
- [ ] `src/content/research.ts` exports `researchTrajectory:
      ResearchTrajectoryStage[]` with **exactly 3 stages** (matching the three
      research questions).
- [ ] Every stage's `number`, `title`, `summary`, and every `signals` entry
      is non-empty after trim (mirrors the metric-content rule already in
      `research.test.ts`).

### FR-3: Nav menu links the new section

The section is reachable from the navbar (desktop + mobile).

**Acceptance criteria:**
- [ ] `src/components/Navbar.tsx` includes a link `{ label: "Trajectory", href:
      "#trajectory" }` inserted between the existing `Projects` and
      `Background` entries.
- [ ] Existing links (`Research`, `Projects`, `Background`, GitHub, LinkedIn)
      remain intact and in order.

### FR-4: The test contract is extended, not weakened

`src/content/research.test.ts` gains coverage for the new data without loosening
any existing assertion.

**Acceptance criteria:**
- [ ] A new `describe` block or top-level `it` covers `researchTrajectory`:
      length 3, all fields non-empty, `signals` at most 4 per stage.
- [ ] The publishing-safeguards `it` block that guards against local paths,
      emails, and private planning-doc names is extended so `researchTrajectory`
      is also included in the serialized content it checks.
- [ ] All previously-passing assertions still pass unchanged (grep the file
      before edit and confirm no existing `expect(...)` line was modified — only
      additions).

---

## Success criteria (aspirational, not gate-blocking)

- The section's copy passes an "MTG reviewer skim test": a reviewer landing on
  `#trajectory` can, in under 20 seconds, connect the dossier's three research
  questions to concrete doctoral-scale next steps that align with the call's
  topic.
- The section reads honest, not sales-y. No superlatives. No "cutting-edge."
  Use the same tone as the existing "What this does not claim" panels.

---

## Dependencies

- None. All data is added to `src/content/research.ts`; no new package.

## Assumptions

- The user has approved this bridge section (implicit in the PR review).
- Copy will be drafted from the constitution's "Core Principles" section and
  the MTG call's language, not invented.

---

## Completion signal

### Implementation checklist
- [ ] `ResearchTrajectoryStage` interface + `researchTrajectory` export added
      to `src/content/research.ts`.
- [ ] Assertions for `researchTrajectory` added to `src/content/research.test.ts`.
- [ ] `<section id="trajectory">` rendered in `src/pages/Index.tsx` between
      `#projects` and `#background`.
- [ ] Navbar link added to `src/components/Navbar.tsx`.
- [ ] Playwright test `tests/e2e/dossier.spec.ts` updated so its "primary
      evidence" assertion (or an equivalent new assertion) covers the
      trajectory section without loosening existing checks.

### Testing requirements

Before outputting the magic phrase, ALL of these must be green:

#### Code quality
- [ ] `npm run typecheck` — clean.
- [ ] `npm run lint` — clean.
- [ ] `npm test` — all previously-passing unit tests still pass; new
      trajectory tests pass.

#### Functional verification
- [ ] `npm run build` — completes with no errors.
- [ ] `npm run e2e` — 12+ tests pass, including the trajectory coverage.

#### Visual verification (UI change)
- [ ] `npm run dev` and drive the page in a browser: `#trajectory` scrolls into
      view when clicking the new nav link on both desktop and mobile viewports.
- [ ] No layout regressions on the flagship case study, supporting projects, or
      background section.

#### Publishing safeguards (constitution)
- [ ] Grep the built `dist/` output for `/Users/`, `/Volumes/`, mailto, and
      `ImprovPartnerPlan` / `ImprovPartner-live-snapshot`. All must be absent.
- [ ] All new external links (if any) are `https://`.

### Iteration instructions

If ANY check fails:
1. Identify the specific failure.
2. Fix the code — do not weaken the test.
3. Rerun the failing gate.
4. Once the full gate list is green, commit and push on this branch.
5. Append a short note to `history/001-research-trajectory.md` — what surprised
   you, what to do differently next time.

**Only when all checks pass, output:** `<promise>DONE</promise>`

---

## NR_OF_TRIES: 1

## Status: COMPLETE
