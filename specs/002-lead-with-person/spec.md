# Specification: Lead with the person, then the projects

## Feature: reorder the dossier so a reviewer meets Zach before the work

### Overview

The dossier currently flows Hero → Research Agenda → Case Studies → Supporting
Prototypes → Proposed Trajectory → Background. A PhD-admissions reviewer meets
the topic first and only encounters *who is applying* at the very end. For a
funded position, "who" belongs closer to the top.

This spec swaps the flow: **Background moves to right after the hero**, before
the Research Agenda. The rest of the argument (agenda → case studies →
supporting prototypes → trajectory) then unfolds against the person, not
around them. Copy in the background section is refreshed so it reads as an
introduction to Zach, not as a bottom-of-page credits reel.

### User story

- As an MTG admissions reviewer, I want to know who wrote this dossier and
  what shaped their approach before I judge the case studies, so I can read
  the technical work with context instead of retrofitting it later.

---

## Functional requirements

### FR-1: Section order changes to person-first

`src/pages/Index.tsx` renders sections in this order inside `<main>`:

1. `#top` (hero)
2. `#background` — **moves up from bottom**
3. `#research` (agenda)
4. `#projects` (case studies)
5. Supporting prototypes (unchanged)
6. `#trajectory`

**Acceptance criteria:**
- [ ] `document.getElementById('background').getBoundingClientRect().top`
      is **less than** the same for `#research`, `#projects`, and
      `#trajectory` (assert in Playwright).
- [ ] `#background` still exists and its portrait image `/media/zach-scheffler.webp`
      still loads.
- [ ] No section is deleted; only reordered.

### FR-2: Navbar order matches the new page flow

`src/components/Navbar.tsx` links appear in this order:

`About` → `Research` → `Projects` → `Trajectory`

(The Background label becomes **About**, since it now introduces the person.)

**Acceptance criteria:**
- [ ] The navbar link texts, in order, are `About, Research, Projects,
      Trajectory` (plus the wordmark, GitHub, LinkedIn).
- [ ] The `About` link's `href` is `#background` (the existing anchor is kept
      so external inbound links do not break).

### FR-3: The background section reads as an introduction, not an appendix

- Its `.section-kicker` becomes something like `"About"` (not `"Research
  background"`).
- Its `<h2>` introduces Zach in a single sentence (not a subhead about
  "methods").
- The lead paragraph remains honest and short.

**Acceptance criteria:**
- [ ] The `.section-kicker` inside `#background` has text `"About"`.
- [ ] The `<h2>` inside `#background` contains the string `"Zach"`.
- [ ] The existing `education` ordered list still renders with all four
      entries in year order.

### FR-4: Existing content contract stays green

Nothing in `src/content/research.ts` or `src/content/research.test.ts` needs
structural change (this spec is a **UI reorder**, not a content-model change).
All previously-passing assertions still pass.

**Acceptance criteria:**
- [ ] `npm test` passes with the current 9 assertions unmodified.
- [ ] `research.test.ts` was not edited.

### FR-5: e2e tests updated for the new order

`tests/e2e/dossier.spec.ts` gains the FR-1 order assertion and updates any
existing assertion that references section order.

**Acceptance criteria:**
- [ ] The trajectory test's `sectionOrder` check is updated to
      `background → research → projects → trajectory`.
- [ ] A new small test asserts the About nav link exists and takes you to
      `#background`.

---

## Completion signal

### Implementation checklist
- [ ] Sections reordered in `src/pages/Index.tsx`.
- [ ] Navbar link order + label updated in `src/components/Navbar.tsx`.
- [ ] Background section's section-kicker and h2 updated in `Index.tsx`.
- [ ] Playwright order assertions updated in `tests/e2e/dossier.spec.ts`.
- [ ] History note in `history/002-lead-with-person.md`.

### Testing requirements

- [ ] `npm run typecheck` clean.
- [ ] `npm run lint` clean.
- [ ] `npm test` — 9/9 (unchanged assertions all pass).
- [ ] `npm run build` clean.
- [ ] `npm run e2e` — all previously-passing tests pass; new/updated ones pass.
- [ ] `npm run dev` and drive the page: About link jumps to `#background`,
      which sits between the hero and the research agenda.

**Only when all checks pass, output:** `<promise>DONE</promise>`

---

## NR_OF_TRIES: 0
