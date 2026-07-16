# Specification: Automation safety and documentation truth

## Feature: Hard guards in the Ralph loop, dead-lib removal, and doc claims that match reality

### Overview

The Ralph loop script (`scripts/ralph-loop.sh`) relies on convention — not
enforcement — to stay off `main`: the constitution forbids running the loop on
`main`, but the script happily pushes to whatever branch it finds. It also
resets its consecutive-failure counter when the limit is reached, so a stuck
agent loops forever instead of stopping. Meanwhile `scripts/lib/` carries five
shell libraries that nothing sources, and two docs make claims that have
drifted from reality (a hardcoded e2e test count in the constitution; README
wording that overclaims repo-wide cleanup while stale remote branches still
exist).

This spec makes the safety rules self-enforcing, deletes the dead code, and
brings the docs back to the truth.

**This spec explicitly names `.specify/memory/constitution.md` as a file it
edits** (doc-truth changes only; no policy change).

### User stories

- As the repo owner, I want `ralph-loop.sh` to refuse to run on `main` so that
  a mistaken invocation cannot push autonomous commits to the default branch.
- As the repo owner, I want the loop to stop after repeated failed iterations
  so that a stuck agent doesn't burn tokens indefinitely.
- As a maintainer, I want `scripts/lib/` to contain only code that is actually
  sourced, so the automation surface is auditable.
- As a reviewer, I want the constitution and README to make only claims that
  are verifiably true right now.

---

## Functional Requirements

### FR-1: Hard guards in `scripts/ralph-loop.sh`

Three enforcement changes, keeping the script's existing style:

1. **Startup main-branch guard.** Immediately after `CURRENT_BRANCH` is
   computed: if `CURRENT_BRANCH` is `main` or empty, print an error and
   `exit 1` before any iteration or Claude invocation.
2. **Push guard (defense in depth).** Wrap the per-iteration `git push` so it
   refuses to push when `CURRENT_BRANCH` is `main`.
3. **Consecutive-failure stop.** When `CONSECUTIVE_FAILURES` reaches
   `MAX_CONSECUTIVE_FAILURES`, keep the diagnostic echo block but `exit 1`
   instead of resetting the counter and continuing.

**Acceptance Criteria:**
- [ ] `bash -n scripts/ralph-loop.sh` exits 0.
- [ ] With the working tree on `main`, `./scripts/ralph-loop.sh 1` exits
      non-zero immediately without invoking `claude` (verified on a throwaway
      local clone).
- [ ] The push block is a no-op with an explanatory message when
      `CURRENT_BRANCH` is `main`.
- [ ] Reaching `MAX_CONSECUTIVE_FAILURES` terminates the loop with exit 1
      rather than resetting the counter.

### FR-2: Delete dead automation libraries

`grep -rn "circuit_breaker\|date_utils\|notifications\|nr_of_tries\|response_analyzer" scripts/ *.md`
confirms only self-references inside the libraries themselves. Delete
`scripts/lib/circuit_breaker.sh`, `scripts/lib/date_utils.sh`,
`scripts/lib/notifications.sh`, `scripts/lib/nr_of_tries.sh`, and
`scripts/lib/response_analyzer.sh`. Keep `scripts/lib/spec_queue.sh` — it is
sourced by `ralph-loop.sh`.

Note: the `NR_OF_TRIES` counter convention in `RALPH_PROMPT.md` and
`specs/README.md` is agent-managed (Claude appends it to spec files); it does
not depend on `nr_of_tries.sh`, so those docs stay as-is.

**Acceptance Criteria:**
- [ ] The five dead library files are removed from the repo.
- [ ] `scripts/lib/spec_queue.sh` remains and `./scripts/ralph-loop.sh --help`
      still works (proves sourcing is intact).
- [ ] No tracked doc references the deleted libraries.

### FR-3: Documentation truth

1. `.specify/memory/constitution.md` (explicitly authorized by this spec):
   - Quality gates: replace the hardcoded "12 tests" Playwright claim with a
     count-free description ("the dossier e2e suite + retired-route 404s").
   - Bump version 1.0.0 → 1.0.1 in the Version section and the footer version
     line, and add a one-line changelog note at the bottom per the file's own
     Governance section (loop guards + doc sync).
2. `README.md`:
   - Line ~33 ("The repository now contains just the shipped dossier …"):
     scope the cleanup claim to `main`, since stale remote branches (e.g.
     `claude/goofy-wu`) may still exist on origin and contain old scaffolding.
   - Line ~41 (".env untracked / no runtime secrets"): scope to `main` and the
     shipped app so the claim is accurate regardless of other branches.

**Acceptance Criteria:**
- [ ] `grep -n "12 tests" .specify/memory/constitution.md` returns nothing.
- [ ] Constitution Version section and footer both read 1.0.1, with a
      changelog line at the bottom.
- [ ] README no longer claims repo-wide (all-branch) cleanup; both claims are
      scoped so they are true even if stale remote branches exist.

---

## Success Criteria

- A future accidental `./scripts/ralph-loop.sh` on `main` is a no-op failure,
  not an autonomous push to the default branch.
- A stuck loop self-terminates after `MAX_CONSECUTIVE_FAILURES` failed
  iterations.
- Every automation file in `scripts/` is reachable from `ralph-loop.sh`.
- Constitution and README contain no claims that drift with the e2e test
  count or with the state of remote branches.

---

## Dependencies

- None beyond the existing toolchain (bash, git, npm).

## Assumptions

- The e2e suite content is unchanged by this spec; only the doc claim about
  its size is removed.
- No CI or doc outside the repo invokes the deleted libraries.

---

## Completion Signal

### Implementation Checklist
- [ ] `scripts/ralph-loop.sh`: startup guard, push guard, failure-stop.
- [ ] Five dead libs deleted; `spec_queue.sh` retained.
- [ ] Constitution: e2e count removed, version 1.0.1 + changelog line.
- [ ] README: both claims re-scoped to `main` / shipped app.

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [ ] `bash -n scripts/ralph-loop.sh` passes.
- [ ] All existing unit tests pass (`npm test`).
- [ ] No lint errors (`npm run lint`), typecheck green (`npm run typecheck`).
- [ ] `npm run build` and `npm run e2e` pass.

#### Functional Verification
- [ ] Behavioral guard check: in a throwaway local clone of this worktree,
      stay on `main`, run `./scripts/ralph-loop.sh 1`, and confirm it exits
      non-zero immediately without invoking `claude`. Clean up the clone.
      If the guard path cannot run in the environment, verify via `bash -n`
      plus a manual trace and record that substitution.
- [ ] `./scripts/ralph-loop.sh --help` still prints usage (spec_queue intact).

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`

## Status: COMPLETE
