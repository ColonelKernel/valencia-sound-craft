# Spec 001 — Dead code & dependency purge

## Goal

Shrink the codebase to only what the site actually uses, and stand up the full
gate chain (this is the first complete gate run on this lineage — expect and
fix latent breakage).

Baseline (measured at spec-writing time): 197 tracked files under `src/`;
49 components in `src/components/ui/` of which only ~14 are imported
(`button dialog input label progress separator sheet skeleton slider sonner
toast toaster toggle tooltip`); `midiLoopLibrary` and `App.css` have zero
importers. Trace the real import graph yourself — do not trust these lists
blindly (e.g. `toaster.tsx` pulls `use-toast`, `sonner.tsx` pulls
`next-themes`).

## Requirements

1. Delete every file under `src/` unreachable from the entrypoints
   (`src/main.tsx`, vitest setup + `*.test.*`, `tests/e2e/**`). This includes
   unused `components/ui/*`, unused hooks/lib modules, unused assets, and
   `App.css` if unimported.
2. Remove every `package.json` dependency with zero references in `src/`,
   `scripts/`, `supabase/`, or config files. Keep build-chain deps referenced
   only by configs (`tailwindcss-animate`, `autoprefixer`, `postcss`) and keep
   `lovable-tagger` (dev-only; keeps the Lovable deploy pipeline compatible).
   Run `npm install --no-audit --no-fund` afterwards so the lockfile matches.
3. Remove npm scripts whose target files no longer exist or are dead
   (check `build:midi-loops`, `rhythms:sync-sql`, `lovable:*`) and delete the
   corresponding orphaned files under `scripts/`.
4. Stage the pending deletion of `tsconfig.app.tsbuildinfo` (already deleted in
   the working tree); confirm `*.tsbuildinfo` is gitignored.
5. Add a `"typecheck"` npm script (tsc noEmit over the app + node configs) and
   make it green. Known hazard: a stray `~/node_modules` can cause csstype
   duplicate-identity errors — fix by scoping the type resolution, not by
   removing the gate.

## Acceptance criteria

- [ ] `src/components/ui/` contains only components reachable from the app
      import graph.
- [ ] No file under `src/` is unreachable from the entrypoints. Evidence: a
      documented sweep (`npx knip` or an import-graph grep script) in
      `ralph_history.md`.
- [ ] `package.json` has no unused dependency; removed list documented.
- [ ] All npm scripts reference existing files/binaries.
- [ ] `tsconfig.app.tsbuildinfo` is untracked; `git status` clean after commit.
- [ ] `npm run typecheck` exists and is green.
- [ ] Lockfile updated and committed.
- [ ] All five gates green in the worktree; tails saved to
      `specs/001-dead-code-and-dependency-purge/gate-logs/`.
- [ ] `ralph_history.md` entry with before/after counts (src files, dep count,
      total dist gzip size).

**Output when complete:** `<promise>DONE</promise>`
