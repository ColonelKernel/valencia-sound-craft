# Spec 009 — Content truth and metadata polish

## Context

A 27-agent adversarially-verified audit of the merged specs 004–008 tree
(2026-07-17) confirmed a set of small correctness and guardrail gaps. This
spec closes every item that does not require account-level action.

## Functional requirements

- **FR-1 (JSON-LD truth)**: the Session State Analyzer node claims only
  Python (the repo is 100% Python); the Improspira node's description is
  scoped to the five-day workshop prototype so its contributor list matches
  the page copy's attribution discipline; `alumniOf` includes MIT
  Professional Education, which the content model and About copy feature.
- **FR-2 (metric verifiability)**: the improv-partner case study discloses
  that its benchmark harness and held-out results are not yet public, so a
  reviewer knows the figures cannot currently be independently verified.
- **FR-3 (404 parity)**: both 404 implementations use an internal-navigation
  glyph (← not ↗) and load the same self-hosted Inter variable font as the
  main site.
- **FR-4 (metadata guardrails)**: a new `src/content/metadata.test.ts`
  (inside the vitest glob) pins the canonical link, sitemap `<loc>`, robots
  `Sitemap:` line, og/twitter image URLs, and dossier-self JSON-LD URLs to
  one origin, and asserts every static asset referenced by index.html and
  site.webmanifest exists in `public/`.
- **FR-5 (toolchain)**: CI runs `npx playwright test` so the `pree2e` hook
  does not rebuild the site a second time; eslint covers all `.ts` files
  repo-wide plus root JS/CJS configs; `sitemap.xml` drops its hardcoded
  (already stale) `<lastmod>`.
- **FR-6 (asset weight)**: the three PWA icons are palette-quantized
  (icon-512 500 KB → 187 KB) with no visible quality change at icon sizes.

## Out of scope

- Making `ColonelKernel/ArrangementArchitect` public (account-level, human
  action; the dossier's link is correct once the repo is public).
- Publishing the improv-partner benchmark harness (owner decision).

## Acceptance criteria

All quality gates green: `npm run typecheck && npm run lint && npm test &&
npm run build && npm run e2e`, with the new metadata tests passing.
