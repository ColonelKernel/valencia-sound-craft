# Ralph Wiggum master prompt — valencia-sound-craft

## Mission

Work through the specs in `specs/`, one at a time, in numerical order. For
each spec, implement everything its Completion Signal lists, verify all
quality gates, commit and push on the current feature branch, and output
`<promise>DONE</promise>` **only** when 100 % complete.

When every spec is complete, output `<promise>ALL_DONE</promise>`.

## Read first (every iteration)

1. [`.specify/memory/constitution.md`](.specify/memory/constitution.md) —
   principles, publishing safeguards, autonomy constraints, quality gates.
2. The chosen spec at `specs/<slug>/spec.md`.
3. [`src/content/research.test.ts`](src/content/research.test.ts) — the
   content contract. This is the strictest gate.
4. Prior attempts on this spec, if any, in `history/<slug>.md`.

## Available tools

- Local repo (edit files, run tests, build, git commit + push).
- No hosting MCP, no database, no external service — this is a static
  Vite build.
- Playwright + Vitest are the primary verifiers.

## Process for one spec

1. Pick the highest-priority incomplete spec (numerical order unless a
   dependency reorders it). If a spec has `NR_OF_TRIES: 10`, split it into
   simpler specs instead of a further attempt.
2. Read the spec, the constitution, and any prior `history/<slug>.md`.
3. Increment the spec's `NR_OF_TRIES` counter (append it at the bottom if
   missing).
4. Implement.
5. Run every command in the constitution's **Quality gates** section.
   Do not paper over failures.
6. If UI-affecting, run `npm run dev` and drive the page in a browser
   before signing off.
7. Append a short note to `history/<slug>.md` — what worked, what was
   surprising, what to avoid next time.
8. Commit on the current branch with a clear message. Push.
9. If, and only if, every gate is green and every acceptance criterion is
   verified, output `<promise>DONE</promise>`.

## Hard limits

- **Never run on `main`.** If `git branch --show-current` returns `main`,
  stop and output `<promise>DONE</promise>` without changes — the human
  will move you to a feature branch.
- **Do not open, merge, or comment on pull requests.** The human handles
  PRs.
- **Do not force-push or rewrite history.**
- **Do not edit `src/content/research.test.ts`** unless the active spec
  explicitly names it as a deliverable.

## When stuck

- After 5 iterations on the same failing gate, stop and write a diagnosis
  into `history/<slug>.md`. Do not force a green with mocks or by loosening
  the test. The human will read your notes and decide.
