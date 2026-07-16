# Spec 006 — Final verification sweep

## Goal

Prove the rebuilt site is done: clean-slate gates, flake check, and an honest
line-by-line closure of the original audit findings.

## Requirements

1. `rm -rf dist`, then the full gate chain from scratch, in order:
   typecheck → lint → vitest → build → budget → e2e. All green.
2. Run `npm run e2e` twice consecutively; both runs green (flake check).
3. Close out the original audit findings in a table in `ralph_history.md` —
   each marked **fixed** or **open-intentional** with one line of evidence:
   - A1 contact form fake success → real Supabase submission with honest states
   - A2 portfolio collapsed by default → visible by default
   - A3 "real streaming data" label → honest demonstration-dataset labeling
   - A4 MoM −94.5% partial-bucket artifact → complete-bucket comparison
   - A5 AI memo vs dashboard stat mismatch → same stats, honest failure state
   - A6 bare youtube.com link → removed (user re-adds real channel)
   - A7 dev-speak copy → rewritten for musicians
   - A8 brand inconsistency → unified title pattern
   - A9 WhatsApp number → open-intentional, pending user confirmation
   - A10 lowercase region names → capitalized
   - A11 illegible dark basemap → legible
   - A12 Lovable tracking scripts → open-intentional (host-injected, out of scope)
4. `git status` clean; all commits pushed to `origin/portfolio/rebuild`;
   final summary section written in `ralph_history.md`.

## Acceptance criteria

- [ ] Clean-slate gate transcript tails in
      `specs/006-verification-sweep/gate-logs/` (both e2e runs).
- [ ] A1–A12 table complete in `ralph_history.md` with evidence.
- [ ] Working tree clean; `git log origin/portfolio/rebuild` contains every
      spec commit.
- [ ] Final summary written.

**Output when complete:** `<promise>DONE</promise>`
