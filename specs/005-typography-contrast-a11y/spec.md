# Specification: Typography, Contrast & Accessibility Pass

## Feature: Self-hosted display typography, WCAG AA contrast, unique nav landmarks, print stylesheet

### Overview
The dossier currently leads its `--display` stack with Mac-only fonts
("Helvetica Neue"/"Avenir Next"), ships several text/background pairs below
WCAG AA contrast, renders three identically-named "Project evidence" nav
landmarks, and has no print stylesheet. This spec self-hosts Inter Variable as
the display face, raises every failing contrast pair to AA, gives each
evidence nav a unique accessible name, and adds an honest print stylesheet
that keeps qualifier/caveat text visible.

### User Stories
- As a faculty reviewer on Windows/Linux, I want the display typography to
  render as designed so that the dossier reads identically across platforms.
- As a low-vision reader, I want fine-print labels to meet WCAG AA contrast so
  that footnotes, captions, and qualifiers are legible.
- As a screen-reader user, I want each navigation landmark to have a unique
  name so that I can distinguish the evidence lists.
- As a reviewer printing the dossier, I want a light-paper print rendering
  that preserves the honest-labeling qualifiers so that nothing is lost or
  wastefully ink-flooded on paper.

---

## Functional Requirements

### FR-1: Self-hosted Inter Variable
Install `@fontsource-variable/inter` as a devDependency. Copy the latin
variable-weight woff2 into `public/fonts/InterVariable.woff2` and the
package's OFL license into `public/fonts/LICENSE-OFL.txt`. Declare an
`@font-face` for "Inter" (weight range 100–900, `font-display: swap`,
`format("woff2-variations")`) in `src/index.css`, and lead `--display` with
Inter (dropping the Mac-only "Helvetica Neue"/"Avenir Next" lead) while
keeping sensible fallbacks. `--body` already leads with Inter — unchanged.
`index.html` is NOT touched (preload rides spec/006).

**Acceptance Criteria:**
- [ ] `@fontsource-variable/inter` appears only in `devDependencies`;
      runtime deps remain exactly `react` + `react-dom`.
- [ ] `public/fonts/InterVariable.woff2` and `public/fonts/LICENSE-OFL.txt`
      exist and are byte-identical to the package files.
- [ ] `src/index.css` contains the `@font-face` rule with
      `font-weight: 100 900` and `font-display: swap`.
- [ ] `--display` starts with `Inter` and retains non-Mac-only fallbacks.
- [ ] `index.html` has no diff.

### FR-2: WCAG AA contrast pass
Raise the failing/borderline low-alpha white text on dark panels to at least
`rgba(255, 255, 255, 0.72)` for: `.map-footnote`, `.architecture-toolbar p`,
`.core-label > span/> small`, `.portrait-caption`, `.education-list small`.
Where the affected rule's font-size is at or below 0.56rem, raise it to at
least 0.62rem if the layout tolerates it (verify visually). Darken
`--ink-faint` from `#627068` to `#4d5c53` and eyeball every usage.

**Acceptance Criteria:**
- [ ] The five listed selectors use white text at alpha >= 0.72.
- [ ] `.architecture-toolbar p` (was 0.55rem), `.core-label > span/> small`
      (was 0.5rem), and `.portrait-caption` (was 0.56rem) render at
      >= 0.62rem with no layout breakage (visual check).
- [ ] `--ink-faint` is `#4d5c53`; all usages (`.section-kicker`,
      `.mini-label`, `.metric-card small`) visually checked for regressions.
- [ ] Computed contrast ratios for every changed pair are >= 4.5:1
      (documented in the Completion Signal below).

### FR-3: Unique nav landmarks
`LinkList` in `src/pages/Index.tsx` defaults its `aria-label` to
"Project evidence" and is used without a label at the flagship call site and
the secondary-study call site, producing three identically-named `<nav>`
landmarks. Pass a distinct label derived from the study title at each bare
call site.

**Acceptance Criteria:**
- [ ] The flagship evidence list has `aria-label` "{study.title} evidence".
- [ ] Each secondary-study evidence list has `aria-label`
      "{study.title} evidence".
- [ ] No two rendered `<nav>` landmarks share an accessible name
      (verified in the built page).

### FR-4: Print stylesheet
Add an `@media print` block to `src/index.css` that: renders the dark
sections (hero, footer, architecture figure, night panels — background
section, limitation panel, research-image figures, hero research map) as
light paper with dark ink; hides the navbar/site header, skip link, hero
marquee and decorative animation, and interactive-only chrome; applies
`break-inside: avoid` to metric cards, adapter cards, and supporting-project
articles; and keeps qualifier/caveat text visible (honest-labeling contract).

**Acceptance Criteria:**
- [ ] Dark sections print with light background and dark text (including
      their low-alpha white descendants remapped to dark ink).
- [ ] `.site-header`, `.skip-link`, `.hero-marquee`, mobile menu chrome are
      `display: none` in print.
- [ ] `.metric-card`, `.adapter-card`, `.support-grid > article` have
      `break-inside: avoid`.
- [ ] `.metric-card small` (qualifiers) and `.support-caveat` remain visible
      and legible in print preview.

---

## Success Criteria

- Display typography renders with Inter Variable on any OS with no external
  font request (self-hosted, single woff2).
- Every changed text/background pair computes to >= 4.5:1 contrast.
- Screen readers announce three uniquely-named evidence navs per page region.
- Browser print preview shows a light, paginated dossier with qualifiers
  intact and no dark ink-flood panels.

---

## Dependencies
- `@fontsource-variable/inter` (devDependency; the woff2 is vendored into
  `public/fonts/`, so no runtime dependency is added).

## Assumptions
- The Lighthouse accessibility budget in `lighthouserc.cjs` (>= 0.95) is the
  external check for this work; if Chrome is unavailable to lhci, manual
  contrast math documented below substitutes.
- Spec/006 will add the font preload to `index.html`; this spec deliberately
  leaves `index.html` untouched.

---

## Completion Signal

### Implementation Checklist
- [x] `@fontsource-variable/inter` installed as devDependency.
- [x] `public/fonts/InterVariable.woff2` + `public/fonts/LICENSE-OFL.txt`
      copied from the package.
- [x] `@font-face` + `--display` update in `src/index.css`.
- [x] Contrast alphas raised to 0.72; tiny font sizes raised to 0.62rem;
      `--ink-faint` darkened to `#4d5c53`.
- [x] Unique `aria-label`s passed at both bare `LinkList` call sites.
- [x] `@media print` block appended to `src/index.css`.

### Computed contrast ratios (WCAG 2.x math)

| Pair | Before | After |
| --- | --- | --- |
| `.map-footnote` white on hero-map panel (#081A13 effective) | 4.61:1 | **9.66:1** |
| `.architecture-toolbar p` white on `--night` #0a1b14 | 5.23:1 | **9.56:1** |
| `.core-label > span/> small` white on `--night` | 4.90:1 | **9.56:1** |
| `.portrait-caption` white on `--night` | 5.23:1 | **9.56:1** |
| `.education-list small` white on `--night` | 5.23:1 | **9.56:1** |
| `--ink-faint` on `--paper` #f2f1eb | 4.60:1 | **6.25:1** |
| `--ink-faint` on `#fbfaf5` (projects/lineage) | 4.98:1 | **6.76:1** |
| `--ink-faint` on `--paper-deep` #e9e8e1 | 4.23:1 | **5.75:1** |

All post-change pairs >= 4.5:1 (AA, normal text).

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [x] All existing unit tests pass (`npm test` — 9/9)
- [x] No type errors (`npm run typecheck`)
- [x] No lint errors (`npm run lint`)
- [x] Production build succeeds (`npm run build`)

#### Functional Verification
- [x] All acceptance criteria verified
- [x] E2E suite passes (`npm run e2e` — 14/14)
- [x] Lighthouse accessibility >= 0.95 (`npm run lighthouse` — 1.0 on all
      three runs; contrast math above verified independently)

#### Visual Verification (if UI)
- [x] Desktop view looks correct (built preview at 4173; hero verified by
      screenshot, Inter active via `document.fonts.check`)
- [x] Raised font sizes do not break the architecture figure, portrait
      caption, or hero map layouts (all six raised selectors measured at
      0.62rem/alpha 0.72 with zero scroll overflow; no element escapes the
      architecture stage bounds)
- [x] Print stylesheet verified via CSSOM inspection of the built bundle:
      10 print rules present — light paper remap, `.site-header`/
      `.skip-link`/`.hero-marquee` hidden, `break-inside: avoid` on
      evidence blocks, `.metric-card small`/`.support-caveat` forced
      visible

#### Console/Network Check (if web)
- [x] No JavaScript console errors
- [x] No failed network requests (`/fonts/InterVariable.woff2` → 200)

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
