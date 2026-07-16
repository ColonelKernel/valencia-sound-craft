# Spec 005 — Performance budget

## Goal

"Lightning fast, no exceptions" made enforceable: a hard, scripted bundle
budget plus asset optimization, with Lighthouse evidence.

## Requirements

1. Enable Vite's build manifest and add `scripts/check-bundle-budget.mjs`:
   compute the gzip size of the `/` initial graph (entry + statically imported
   chunks + CSS) from `dist/.vite/manifest.json`; exit non-zero above
   **150 KB gzip total**. Also fail if any recharts, leaflet, framer-motion,
   or @supabase chunk is part of that initial graph. Wire as `npm run budget`.
2. Hero image: serve webp with srcset (visual parity); the largest image
   loaded on `/` must be ≤ 200 KB.
3. No `.wav` referenced from `src/` or `index.html` (audio is AAC `.m4a`).
4. Fonts: preload above-the-fold self-hosted font files; no render-blocking
   third-party font CSS.
5. Lighthouse (mobile + desktop) on `/`, `/tools`, one tool route, and
   `/music-analytics`; target performance ≥ 95. The machine may be loaded —
   if load average exceeds ~8 during the run, record the scores AND the load
   honestly in `ralph_history.md` and flag "re-run when idle" rather than
   chasing the number.

## Acceptance criteria

- [ ] `npm run budget` green after `npm run build`, reporting the measured
      initial-graph gzip size.
- [ ] Budget script fails correctly when given a poisoned manifest (prove once
      with a temporary check, then remove the poison).
- [ ] Largest image on `/` ≤ 200 KB; hero visually unchanged.
- [ ] Zero `.wav` references in `src/` and `index.html`.
- [ ] Font preload present; no third-party font origin in `index.html`.
- [ ] Lighthouse scores + machine load recorded in `ralph_history.md`.
- [ ] All gates + budget green; tails in
      `specs/005-performance-budget/gate-logs/`.

**Output when complete:** `<promise>DONE</promise>`
