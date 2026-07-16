# Ralph history — portfolio/rebuild

## Context inherited from `portfolio/professionalization` (commit c26714a)

- 33 duplicate `" 2"` files deleted; `HeroRhythmPreview` removed.
- `Contact.tsx`: real Supabase insert (`contact_messages`, RLS anon
  insert-only, honeypot), honest success/failure states; migration in
  `supabase/migrations/20260716120000_contact_messages.sql` (NOT yet deployed
  to the live project).
- Analytics: `robustMoMGrowth`/`dropSparseFinalBucket` in
  `src/lib/catalogAnalytics.ts`; "Peak Month" → "Peak Era"; analytics tabs
  conditionally rendered with `TabErrorBoundary`.
- Perf: vite `manualChunks` (charts/motion/supabase/forms vendors);
  `DeferredAnalyticsPreview` + `src/hooks/useInView.ts`; portfolio tracks
  `.wav` → `.m4a` (AAC transcodes live in `public/audio/`).
- Audio/state: AudioContext singleton started in `chordProgressionUtils`;
  `normalizeMode` in `src/music-core/modeAliases.ts`; `userTempoTouchedRef`
  tempo policy in `GlobalRhythmEngine`; ModeVisualizer's embedded
  CircleOfFifths now writes the shared store.
- e2e: `tests/e2e/console-clean.spec.ts` + `shared-state.spec.ts`;
  `playwright.config.ts` (port 4199, builds before preview) — **new, never
  fully run**.
- `index.html`: self-hosted `/og-image.jpg`; Navbar: YouTube removed,
  Research → https://research.zachscheffler.com added.

**CAVEAT:** lint/vitest/build/e2e were never completed on the base branch
(machine saturation). Spec 001's gate run is the first full verification of
this lineage — expect and fix latent breakage; that is in scope.

## Iterations

(append entries below — one per spec iteration: what changed, gate results,
learnings, any copy changes)

### 001 — Dead code & dependency purge (2026-07-16)

Two-part iteration: a subagent did the purge but died (account spend limit)
before running gates; the main session verified its staged work and finished
the iteration.

**Purge:** src files 197 → 139 (58 deleted: 43 unused `components/ui/*`
[6 remain: progress, slider, sonner, toast, toaster, tooltip + use-toast hook],
`App.css`, `NavLink.tsx` [react-router's NavLink is what Navbar/ToolSubnav
use], `midiLoopLibrary.ts`, `rhythmGenerator.ts`, `DataAnalysis.tsx`,
`DrumMachine/RhythmMap.tsx`, `aiRhythmEngine.ts`, `rhythm-ai.ts`,
`GrooveSculptor.tsx`, GrooveIntelligence camera/lod/spatialIndex,
`ModeReference.tsx`, `PolyrhythmTool.tsx`, `hero-studio.jpg`,
`lighthouserc 2.cjs` dupe, dead scripts `build-midi-loop-library.mjs` +
`build-rhythm-sql.mjs` and their npm scripts). Runtime deps 58 → 26
(all unused Radix packages, react-hook-form/@hookform/zod-forms stack, cmdk,
embla, date-fns, input-otp, react-day-picker, react-resizable-panels, vaul,
next-themes …); devDeps 23 → 22. `vite.config.ts` manualChunks updated
(forms vendor now zod-only); lockfile reinstalled.

**Gate hardening:** new `typecheck` script (tsc --noEmit over app + node
configs; tsconfig.node.json now includes vitest/playwright/tailwind configs);
`as any` casts removed in features/{map,rhythm}/Tool.tsx;
`err: any` → narrowed unknown in CatalogAnalyzer; stale test expectations in
`globalRhythmAtlas.test.ts` updated to the expanded atlas data (Luxembourg is
`regional`/3/4 via the `western_europe_waltz` template — verified against
`globalRhythmAtlas.ts:1324`; no atlas entry is `proxy` anymore).
`tsconfig.app.tsbuildinfo` untracked; playwright artifacts gitignored.

**e2e (first ever full run on this lineage):** 12/12 green after three fixes:
(1) `playwright.config.ts` now uses system Chrome locally (`channel:
process.env.CI ? undefined : "chrome"`) — the pinned chromium download was
crawling on a saturated network and isn't needed locally; (2) the
shared-state rhythm test's heading locator was ambiguous because
**/tools/rhythm mounts TWO GlobalRhythmEngine instances** (standalone engine
section + one embedded inside legacy DrumMachine at
`DrumMachine/index.tsx:937`) — scoped the locator; (3) the map test asserted
pre-professionalization copy ("The selected region is … brazil"); the page
now renders "You are exploring **Brazil**" (capitalized REGION_LABELS) — the
assertion now pins the capitalized label, doubling as the A10 regression
check. Also added `data-testid="rhythm-identity"` to the identity panel h4
(the map section's first h4 is the map card title, so positional selection
was wrong).

**Gates:** typecheck ✅ · lint ✅ (0 errors, 7 warnings: react-refresh
only-export-components + 2 exhaustive-deps — files that specs 002/003
restructure) · vitest 38/38 ✅ · build ✅ (5.3s) · e2e 12/12 ✅ (13.5s).
Total dist gzip (all lazy chunks): 927 KB; vendor chunk 417 KB gzip — spec
005's problem.

**Learnings for later specs:**
- The GlobalRhythmEngine double-mount on /tools/rhythm is real (two full
  engine instances with duplicated state scaffolding) — prime target for
  spec 003; also an a11y smell (duplicate identical headings).
- Region filter pills still render lowercase region keys ("brazil") — check
  against spec 004's capitalization criterion (pills may be intentional as
  filter tokens, prose is fixed).
- Machine load collapsed from ~170 to normal mid-iteration; gates are fast
  now (full chain < 1 min).

### 002 — App shell & routing rebuild (2026-07-16)

**Shell:** new `src/app/` — `routeMeta.ts` (dependency-free manifest: path +
title + description for all 10 routes; Playwright imports it directly),
`Layout.tsx` (Navbar + Footer render exactly once; per-route
`RouteErrorBoundary` keyed by pathname; Suspense inside the shell so the
navbar stays visible during page loads), `RouteErrorBoundary.tsx` (+ 2 unit
tests proving a throwing page renders the branded fallback, not a white
screen). `App.tsx` now builds the router entirely from the manifest; ALL
pages lazy (Index and NotFound were static before); `ToolsLayout.tsx`
deleted (its Navbar/Footer job moved to the shell; ToolSubnav lives in
ToolPageLayout/ToolsIndex and is unaffected).

**Meta wiring:** pages and the five `toolData.ts` files now source
title/description/canonical from the manifest. `RouteHead.canonicalPath` is
optional — the 404 (which previously set NO title at all) now sets its title
and strips any inherited canonical link. **New copy (logged per the rules):**
route titles for two pages that never had them — "Groove Intelligence |
Valencia Sound Craft" and "Page Not Found | Valencia Sound Craft" — plus
meta descriptions for both. `/groove-intelligence` also gains the shared
Navbar/Footer (it was a chrome-less dead end: the navbar linked TO it but it
had no navigation back) with `pt-16` to clear the fixed navbar; NotFound's
`<a href="/">` became a router `<Link>` (no full reload).

**Chunking discovery (the audit's "map-vendor on /" mystery solved):**
Rollup's synthetic `commonjsHelpers` module was merged into `map-vendor`,
so EVERY chunk (even NotFound) statically imported 45 KB gzip of leaflet.
Fixes: pin helpers to their own `cjs-helpers` chunk (0.2 KB) and keep
react-leaflet with leaflet in `map-vendor`. Now only GlobalRhythmEngine and
BlipbloxConnector import map-vendor. Initial graph on `/`: 479 → **435 KB
gzip** (index 7 + vendor 405 + app-vendor 2 + ui-vendor 6 + css 14). The
405 KB `vendor` monolith is spec 005's target.

**e2e additions:** console-clean now covers `/groove-intelligence`; new
`navigation.spec.ts` (2 tests): Navbar sweep (home → Groove Lab → Analytics
→ logo) and tool-subnav sweep (Overview → all five tools), asserting the
manifest title at every stop with zero own-origin console errors.

**Gates:** typecheck ✅ · lint ✅ (0 errors, same 7 warnings) · vitest
40/40 ✅ · build ✅ · e2e **15/15** ✅. Visual pass in dev server: `/`,
`/tools`, `/music-analytics` pixel-faithful (screenshots taken in-session).

**Learnings:**
- `renderHomeLinks()` anchors (`#systems` etc.) render on the groove page
  too, where those anchor targets don't exist — harmless but worth a look in
  004's copy/UX pass.
- The `vendor` chunk still contains sonner, radix runtime, tanstack-query,
  react-dom, papaparse, jspdf(?) — dissect in 005 with the budget script.
