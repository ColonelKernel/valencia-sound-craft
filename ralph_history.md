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
