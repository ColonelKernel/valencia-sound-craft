# Iteration notes — spec 001-research-trajectory

## 2026-07-13 — first attempt (successful)

Implemented in one iteration, no retries. The spec was self-contained
enough that no assumptions had to be revisited mid-flight.

### What worked
- Placing the new `researchTrajectory` export right after `researchQuestions`
  in `src/content/research.ts` matched the existing "questions → answers"
  narrative on the page.
- The existing `.question-grid` class was reused as-is; no new CSS was
  needed and layout matched the research-agenda section above it.
- Extending `allContent` in `research.test.ts` automatically covered the
  new export with the existing publishing-safeguards checks — no
  duplication of the "no local paths / emails / private names" logic.

### One thing that bit
- First pass wrote a scenic `<h2>` ("From what these systems observe to
  what they could support.") that did NOT contain the literal string
  "research trajectory". The Playwright test that asserts on the h2 failed
  correctly. Fix: rewrote the h2 to
  "A doctoral research trajectory that extends the four observation regimes above."
  Same tone, spec-compliant.
- Lesson for future iterations: when a spec's acceptance criterion names an
  exact phrase in a heading, put the phrase in the heading in the first
  draft — do not rely on the section-kicker paragraph above the heading to
  satisfy it.

### One tool hiccup
- The Playwright e2e config serves from `dist/` via `vite preview`, so the
  first re-run after a source edit failed because the build was stale. Rule:
  `npm run build` before every `npm run e2e` when iterating on UI copy.

### Visual verification
- Browser-pane screenshots at the top of the page confirmed the "Trajectory"
  nav link is placed between Projects and Background as spec'd.
- DOM inspection at `#trajectory` confirmed: 2366 chars of text, 3 grid
  children, dark-green title on the light body background, correct
  section-intro / question-grid structure.
- Playwright's `toBeInViewport()` assertion on click confirms the section
  scrolls into view.
- Manual full-section screenshots via the browser pane were flaky
  (repeatedly captured off-white blank frames despite correct DOM). Not a
  render bug — the e2e run captured the section fine when a test failed.

### Gates
All green:
- typecheck ✓
- lint ✓
- 9 unit tests (was 8; +1 for trajectory)
- build ✓
- 13 Playwright tests (was 12; +1 for trajectory)
