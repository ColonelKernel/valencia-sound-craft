# Portfolio Rebuild — Ralph spec set

This branch (`portfolio/rebuild`) rebuilds the **portfolio site** (zachscheffler.com)
in place: clean architecture, zero dead code, single audio engine, store-driven
tools, and a strict performance budget — while preserving the existing **visual
language exactly**. It builds on `portfolio/professionalization` (honest
analytics, working contact form, copy pass, chunk splitting, AAC audio).

This spec set is independent of the dossier specs on `main`. The repo
constitution's git rules still bind here: **never work on `main`, never open
PRs** (the human does), push only to `portfolio/rebuild`.

## Worktree

All work happens in:

```
/Users/zacharyscheffler/Documents/valencia-sound-craft/.claude/worktrees/portfolio-fixes
```

The shell working directory resets between tool calls — **prefix every bash
command** with `cd /Users/zacharyscheffler/Documents/valencia-sound-craft/.claude/worktrees/portfolio-fixes && `.

## Quality gates (all green before a spec is DONE)

```bash
npm run typecheck              # added by spec 001 (tsc noEmit)
npm run lint                   # eslint .
npx vitest run --maxWorkers=2  # unit tests
npm run build                  # vite production build
npm run budget                 # added by spec 005 (initial-graph size + heavy-lib ban)
npm run e2e                    # playwright, port 4199, builds+previews first
```

Save the tail (~40 lines) of each gate's output to
`specs/<id>/gate-logs/<gate>.txt` (gitignored) as evidence for the verifier.

## Hard rules

- **Visual language is sacrosanct.** No palette, typography, spacing, or layout
  redesign. If a change would alter appearance, stop and note it in
  `ralph_history.md` instead.
- Copy is already professionalized — do not reword user-facing text unless a
  spec says so; log every wording change in `ralph_history.md`.
- Never weaken, skip, or delete a test to make a gate pass. That is failure,
  not success. Fix the code or fix a genuinely wrong test (and say why).
- Never modify `.env` or commit secrets. The Supabase anon key in the client
  is public-by-design; leave it as-is.
- The machine may be under heavy load (ML training, backups). Gates can take
  many minutes. Wait patiently — do not assume a hang before 10+ minutes of
  zero output. Use `--maxWorkers=2` for vitest.
- The e2e config (`playwright.config.ts`, port 4199) is new and has never
  fully run — fix it if broken.
- One commit per spec: `NNN: <summary>`, then `git push origin portfolio/rebuild`.
  Fix-up commits after verification are allowed: `NNN: address verification findings`.

## Order

001 → 002 → 003 → 004 → 005 → 006. Each spec assumes the previous one landed.
