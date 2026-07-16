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
