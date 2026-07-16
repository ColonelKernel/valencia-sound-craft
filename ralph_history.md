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

### 003 — Audio & state core consolidation (2026-07-16)

**Single AudioContext:** new `src/music-core/audioContext.ts` — the one
creation site (grep-verified: 1 match in src). All 8 former sites migrated
(GlobalRhythmEngine, GlobalRhythmMap, blipbloxEngine, DrumMachine,
GrooveIntelligence audioEngine, chordProgressionUtils, Metronome,
audioSynth); none ever called `close()`, so no teardown semantics changed.
The service exposes `window.__vscAudioContext` as an observability hook and
a new e2e test drives the rhythm transport and polls the shared context to
`state === "running"` (headless playback proof).

**Store-level tempo policy:** `GlobalMusicState.tempoTouched` +
`suggestTempo()` — explicit `setTempo` marks touched; a rhythm selection now
emits `suggestedTempo` in `onRhythmChange`, and the tool adapters forward it
to `suggestTempo`, which is ignored once touched. Unit-tested in
`globalMusicState.test.tsx` (adopt-then-ignore + alias normalization).

**Fully controlled leaves — all scaffolding deleted** (grep-verified: zero
`previousControlled*`/`skipInitial*`/`suppress*CallbackRef` in src):
- `GlobalRhythmEngine` (−2,022 chars): tempo/playing/browserRegion derived
  from props (`controlled ?? local`), mutations via `changeTempo/
  changePlaying/changeBrowserRegion` + `selectRhythmDefinition` (which emits
  the store update synchronously); one refless controlled-rhythm
  reconciliation effect; filter auto-align now emits as a real selection
  instead of silently drifting from the store; scheduler reads
  `tempoRef.current`.
- `DrumMachine` (−2,124 chars): same pattern (`selectPreset` emits
  suggestedTempo=preset.bpm); the region sync-in effect became unnecessary
  (region is derived; `filteredPresets` recomputes from it).
- `Metronome`: derived bpm + `changeBpm`; playing stays ENGINE state
  (whether the scheduler runs) reconciled from the prop via start/stop,
  which report back through `onPlayingChange`. Killed two mount-time
  emission bugs: `onTempoChange` fired on mount (would have marked
  tempoTouched immediately) and `onPlayingChange(false)` fired on mount
  (could release another tool's transport).
- `Tonnetz`: derived bpm + `changeBpm`; playing is engine state with
  emissions in `stop`/`playProgression`; same mount-emission bugs removed.
- `ModeVisualizer`: root/mode derived; the two sync-in effects replaced by
  one stale-chord-clearing effect keyed on the derived tonal center.

**Mode canon:** `store.setMode` now normalizes through
`normalizeMode` — canonical names ("major"→"Ionian") at the single boundary.

**Regression found by e2e and fixed:** a bare region change from the
engine's region pills got bounced back by the adapter's rhythm→region
normalization (the store derives region from the active rhythm). Region
pills now change region AND rhythm atomically (`handleBrowserRegionSelect`
emits the region's first rhythm as a real selection in the same tick).

**Behavior changes (intentional):** rhythm selection no longer force-sets
the shared tempo to the rhythm default — it suggests it (adopted only while
tempo is untouched, per spec); DrumMachine preset selection likewise. The
DrumMachine-embedded GlobalRhythmEngine preview remains preset-driven
(uncontrolled) — its transport is an independent preview by design; the
rhythm-route double-mount presentation question is deferred to spec 004.

**New tests:** e2e 15 → 18 (untouched-tempo adoption; user-tempo survives
selection; transport on the single shared context); vitest 40 → 42 (store
policy + mode normalization). DrumMachine payload test updated for
`suggestedTempo` (contract addition, not a weakening).

**Gates:** typecheck ✅ · lint ✅ (0 errors, 7 pre-existing warnings) ·
vitest 42/42 ✅ · build ✅ · e2e **18/18** ✅.

### 004 — Pages & content rebuild (2026-07-16)

- **Portfolio visible by default** (audit A2 was NOT actually fixed on the
  base branch — `useState(false)` survived): initial state flipped to
  expanded; the toggle stays as a tuck-away affordance. DOM-verified: 6
  embeds mount on first load with no interaction.
- **Page decomposition:** `MusicAnalyticsPage` 310 → 220 lines by extracting
  `MusicAnalytics/{TabErrorBoundary,AnalyticsHero,ArtistPicker}` (the
  compare/portfolio artist-pill blocks were duplicated inline; now one
  parametrized component). All page files ≤ 220 lines.
- **Region capitalization (A10):** engine region pills now render
  `REGION_LABELS` ("Brazil", "West Africa", "Afro-Caribbean") instead of raw
  keys; the pill row gained `role="group" aria-label="Region filters"` and
  the shared-state e2e scopes to it (a country button is also named
  "Brazil"). Map prose already used capitalized `regionLabel`.
- **Basemap legibility (A11):** CARTO dark tiles get a scoped
  `brightness-150` lift (computed-style verified: `filter: brightness(1.5)`
  on `.leaflet-tile`) — dark aesthetic preserved, geography readable. The
  chained contrast/saturate utilities didn't compose under the arbitrary
  variant, so only the brightness utility is kept.
- **Title unification (A8):** analytics title "–" → "|"
  ("Music Catalog Intelligence | Valencia Sound Craft"); home route title
  now matches the static `index.html` title verbatim, so pre-hydration and
  hydrated titles are identical. **Copy changes logged:** those two titles
  only.
- **Dev-speak grep:** zero hits for all five banned phrases (already clean
  from the professionalization pass; now e2e-adjacent evidence in
  gate-logs).
- **Screenshot pass:** desktop `/` (hero + 6 portfolio embeds), `/tools`,
  `/tools/map` (title + capitalized prose verified; a known browser-pane
  capture artifact returns black frames at scroll depth, so tiles/filter
  verified via DOM + computed style), mobile 375px `/tools/rhythm` (subnav
  scrolls, prose reflows, hamburger nav). No visual-language changes.

**Gates:** typecheck ✅ · lint ✅ (0 errors, 7 warnings) · vitest 42/42 ✅ ·
build ✅ · e2e **18/18** ✅.

### 005 — Performance budget (2026-07-16)

**Initial graph on `/`: 435 KB → 110.6 KB gzip** (entry 52.2 + react-core
44.5 + cjs-helpers 0.2 + css 13.6). Two structural fixes:
- The catch-all `"vendor"` manualChunks rule was the root cause of the
  monolith: recharts' **lodash (443 modules)**, framer-motion's
  **motion-dom (220)**, the **jspdf/html2canvas/canvg PDF stack**, core-js,
  and papaparse all landed in one chunk imported by the entry. New strategy:
  pin ONLY react/react-dom/scheduler (`react-core`) + the cjs-helpers pin;
  everything else co-locates with its consumers.
- **@tanstack/react-query removed entirely** — zero useQuery/useMutation
  callers; only the provider existed. Dependency count 25 → 24.

**Budget gate:** `npm run budget` = analyze-mode build +
`scripts/check-bundle-budget.mjs`: walks the entry's static-import graph
from the bundle report, gzips it, fails > 150 KB, and fails if any of
recharts/leaflet/framer-motion/motion-dom/@supabase/jspdf/abcjs/lodash/
html2canvas/canvg appears in the initial graph. Negative-tested (budget
poisoned to 10 KB → exit 1) and restored.

**Assets:**
- Hero 349 KB JPEG → **154 KB webp 1050w + 113 KB webp 750w srcset**
  (cwebp q45 — the 65% black overlay hides compression), moved to `public/`
  and **preloaded from index.html** with imagesrcset. Largest image on `/`
  = 154 KB ≤ 200 KB ✓. SpiralofDoubt art 87 → 64 KB webp.
- **Fonts self-hosted**: the render-blocking Google Fonts `@import` in
  index.css (criterion violation) replaced with three variable woff2s in
  `public/fonts/` (Space Grotesk 22 KB, DM Sans 62 KB + italic 76 KB, OFL
  license note included) with `@font-face` weight ranges + preloads. Zero
  third-party font origins.
- **Dataset self-hosted and slimmed**: the analytics page fetched an 8 MB
  CSV from raw.githubusercontent.com at runtime. `scripts/slim-spotify-csv.
  mjs` regenerates `public/data/spotify_songs.csv` keeping all 32,833 rows
  but only the 3 columns the service reads → **819 KB local** (identical
  derived numbers, no third-party runtime dependency).
- Zero `.wav` references in src/index.html (the only grep hit is
  `sound.wave`, an oscillator type).

**LCP fix:** the analytics hero copy is that route's LCP element; its
framer-motion opacity-from-zero entrance pushed throttled LCP past 20 s.
Hero is now static (only that one component — framer-motion stays for the
chart components). LCP 20.5 s → 6.2 s on simulated slow-4G.

**Lighthouse (perf category, machine load avg ~22-25 — flagged for an
idle re-run per spec):**
- **Desktop: `/` 99 · `/tools` 100 · `/tools/rhythm` 99 ·
  `/music-analytics` 96 — all ≥ 95 ✓**
- Mobile (simulated slow-4G): `/` 86 · `/tools` 97 · `/tools/rhythm` 82 ·
  `/music-analytics` 61. The mobile scores are bounded by the SPA
  architecture: lazy-route LCP waits on entry → page-chunk → render chain
  under 1.6 Mbps simulation. Reaching ≥95 mobile would need
  prerendering/SSG of route shells — flagged as future work, out of this
  spec's scope. Reports in the session scratchpad (lh-*.json).
- `lighthouserc.cjs` upload target switched from temporary-public-storage
  (published reports to a public URL!) to filesystem.

**Gates:** typecheck ✅ · lint ✅ (0 errors) · vitest 42/42 ✅ · build ✅ ·
budget ✅ (110.6/150 KB) · e2e **18/18** ✅.

### 006 — Final verification sweep (2026-07-16)

**Clean-slate chain** (`rm -rf dist` first): typecheck ✅ → lint ✅
(0 errors, 7 advisory warnings) → vitest 42/42 ✅ → build ✅ → budget ✅
(110.6/150 KB gzip) → e2e 18/18 ✅ → **e2e again 18/18 ✅** (flake check).
Tails in `specs/006-verification-sweep/gate-logs/`.

**Original audit findings — closure table:**

| # | Finding | Status | Evidence |
|---|---------|--------|----------|
| A1 | Contact form fake success | **fixed** | `Contact.tsx` inserts into Supabase `contact_messages` (RLS anon INSERT-only, honeypot), honest success/failure states; migration `supabase/migrations/20260716120000_contact_messages.sql` awaits deploy to the live project |
| A2 | Portfolio collapsed by default | **fixed (spec 004)** | `useState(true)`; 6 embeds mount on first load, DOM-verified |
| A3 | "Real streaming data" label false | **fixed** | Hero + footer label: "Demonstration dataset… modeled proxies, not live streaming figures"; dataset now self-hosted (spec 005) |
| A4 | MoM −94.5% partial-bucket artifact | **fixed** | `robustMoMGrowth`/`dropSparseFinalBucket` in `catalogAnalytics.ts` (unit-tested) |
| A5 | AI memo vs dashboard stat mismatch | **fixed** | `CatalogAnalyzer` feeds the memo the dashboard's stats; honest error state on failure (backend deploy still pending user) |
| A6 | Bare youtube.com social link | **fixed** | removed from Navbar/Footer; user re-adds real channel URL |
| A7 | Dev-speak copy | **fixed** | grep for all five banned phrases: zero hits |
| A8 | Brand title inconsistency | **fixed (spec 004)** | one "\| Valencia Sound Craft" pattern; home title matches index.html verbatim; manifest-driven |
| A9 | WhatsApp number published | **open-intentional** | user to confirm; one-line removal in `Footer.tsx` if not |
| A10 | Lowercase region names | **fixed (spec 004)** | prose uses `regionLabel`; pills render `REGION_LABELS`; e2e pins "Brazil" |
| A11 | Illegible dark basemap | **fixed (spec 004)** | scoped `brightness-150` on leaflet tiles (computed-style verified) |
| A12 | Lovable tracking scripts | **open-intentional** | injected by the Lovable host at deploy time, not present in this repo's HTML; goes away only with a host migration |

**Final summary — the rebuild in numbers:**
- src files 197 → 144; runtime deps 58 → 24.
- Initial JS+CSS on `/`: **~539 KB gzip (live baseline) → 110.6 KB gzip**, enforced by a failing gate.
- Test suite: vitest 38 → 42, e2e 12 (never green) → **18 consistently green**, plus the budget gate.
- One AudioContext (was 8 creation sites), one store as source of truth (zero sync-scaffolding refs), canonical mode names, store-level tempo policy.
- Every route lazy behind one shell (route manifest, per-route error boundaries, 404 + groove pages finally titled/chromed).
- No third-party runtime dependencies on `/` or `/music-analytics` (fonts + dataset self-hosted).
- Visual language unchanged (screenshot passes desktop + 375 px).

**Remaining for the human (unchanged from the professionalization runbook):**
deploy the `contact_messages` migration; confirm WhatsApp intentionality;
re-add a real YouTube channel URL; merge via PR (constitution: human opens
it); redeploy through Lovable; optional idle-machine Lighthouse re-run
(mobile ≥95 needs prerendering — future spec candidate).

<promise>DONE</promise>
