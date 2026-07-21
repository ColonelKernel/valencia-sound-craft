# Specification: Toolchain Hardening and CI

## Feature: Glob-based lint/typecheck coverage, build-before-preview, dead-file removal, and a GitHub Actions CI workflow

### Overview
The repo's lint and typecheck scripts enumerate individual files, so newly
added source files silently escape both gates. The e2e and lighthouse scripts
assume a fresh `dist/` exists. Two dead scaffolding files
(`playwright-fixture.ts`, `components.json`) linger from the original template.
And nothing runs the quality gates on GitHub. This spec hardens the toolchain
so coverage is structural (globs, not lists), previews always build first,
dead files are gone, and every push/PR to `main` runs the full gate suite in CI.

### User Stories
- As the dossier maintainer, I want lint and typecheck to cover every file
  under `src/` automatically so that a new page or component cannot dodge the
  quality gates by being absent from a hand-maintained list.
- As the dossier maintainer, I want `npm run e2e` and `npm run lighthouse` to
  build the site first so that they never test a stale or missing `dist/`.
- As the dossier maintainer, I want CI on GitHub so that every PR against
  `main` proves the gates are green before a human merges.

---

## Functional Requirements

### FR-1: Glob-based lint & typecheck
Replace file enumeration with structural coverage.

- `package.json` `"lint"` script becomes `"eslint ."`. `eslint.config.js`
  already scopes rules (`src/**/*.{ts,tsx}`, `*.config.ts`, `tests/**/*.ts`)
  and globally ignores `dist/`, `node_modules/`, `coverage/`,
  `playwright-report/`, `test-results/`, `.lighthouseci/`, and
  `.claude/worktrees/`. If `eslint .` surfaces genuinely out-of-scope files
  that error, extend the config's `ignores` minimally — do not revert to file
  enumeration.
- `tsconfig.app.json` `"include"` becomes `["src"]`, replacing the
  seven-entry file list.

**Acceptance Criteria:**
- [ ] `package.json` `lint` script is exactly `eslint .`
- [ ] `tsconfig.app.json` `include` is exactly `["src"]`
- [ ] `npm run lint` passes on the unmodified source tree
- [ ] `npm run typecheck` (`tsc -b`) passes on the unmodified source tree
- [ ] A scratch file added under `src/` is picked up by BOTH gates (see
      Negative Verification)

### FR-2: Build-before-preview
`npm run e2e` and `npm run lighthouse` both drive `vite preview`, which serves
whatever is in `dist/` — or fails if it is absent. Add npm pre-scripts so a
production build always runs first.

- `package.json` gains `"pree2e": "npm run build"` and
  `"prelighthouse": "npm run build"`.

**Acceptance Criteria:**
- [ ] `pree2e` and `prelighthouse` scripts exist with exactly
      `npm run build` as their command
- [ ] `rm -rf dist && npm run e2e` succeeds without a manual build step

### FR-3: Remove dead files
`playwright-fixture.ts` re-exports from `lovable-agent-playwright-config`,
a package that is not a dependency; `components.json` is shadcn/ui
configuration for a UI kit this repo deliberately does not use
(constitution principle V). A repo-wide grep (excluding `node_modules/`)
must confirm nothing references either file before deletion.

**Acceptance Criteria:**
- [ ] `grep -rn --exclude-dir=node_modules --exclude-dir=.git
      "playwright-fixture" .` matches only the file's own content (or nothing
      after deletion)
- [ ] No file references `components.json` or
      `lovable-agent-playwright-config`
- [ ] Both files are deleted; all quality gates still pass

### FR-4: CI workflow
Add `.github/workflows/ci.yml` running the full gate suite on GitHub-hosted
runners.

- Triggers: `pull_request`, and `push` to `main`.
- Runner: `ubuntu-latest`.
- Steps: `actions/checkout@v4`; `actions/setup-node@v4` with
  `node-version: 20` and `cache: npm`; then `npm ci`, `npm run typecheck`,
  `npm run lint`, `npm test`, `npm run build`,
  `npx playwright install --with-deps chromium`, `npm run e2e`.
- On failure, upload `playwright-report/` as an artifact via
  `actions/upload-artifact@v4` with `if: failure()`.
- `playwright.config.ts` is already CI-aware
  (`channel: process.env.CI ? undefined : "chrome"`) — do NOT change it.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` exists with the triggers, runner, node
      setup (v20 + npm cache), and step sequence listed above
- [ ] The Playwright-report artifact upload step uses
      `actions/upload-artifact@v4` and `if: failure()`
- [ ] `playwright.config.ts` is byte-identical to its state before this spec

---

## Success Criteria

- No hand-maintained file list remains in the lint or typecheck path; adding
  a file under `src/` is automatically covered by both gates.
- e2e and Lighthouse runs are reproducible from a clean checkout with no
  manual build step.
- The repo contains no configuration for tooling it does not use.
- CI reproduces the local quality-gate suite on every PR and push to `main`.

---

## Dependencies
- Existing `eslint.config.js` flat config (scopes + ignores already correct).
- Existing CI-aware `playwright.config.ts` (unchanged).
- GitHub Actions availability on the repo (workflow file only; no repo
  settings changed by this spec).

## Assumptions
- `npm run preview` (used by Playwright's `webServer`) serves `dist/` on port
  4173; building beforehand is sufficient — no preview-side changes needed.
- The git credential used to push may lack the `workflow` scope; if the push
  is denied for that reason, the branch stays local and the push status is
  recorded rather than worked around.

---

## Completion Signal

### Implementation Checklist
- [ ] `package.json`: `lint` → `eslint .`; add `pree2e` and `prelighthouse`
- [ ] `tsconfig.app.json`: `include` → `["src"]`
- [ ] Delete `playwright-fixture.ts` and `components.json` (after grep check)
- [ ] Add `.github/workflows/ci.yml`

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (all existing unit tests)
- [ ] `npm run build` passes
- [ ] `npm run e2e` passes (all existing e2e tests)

#### Functional Verification
- [ ] All FR acceptance criteria above verified

#### Negative Verification (required)
- [ ] Temporarily create `src/pages/Scratch.tsx` containing an unused
      variable AND a type error
- [ ] `npm run lint` FAILS, flagging the unused variable in
      `src/pages/Scratch.tsx`
- [ ] `npm run typecheck` FAILS, flagging the type error in
      `src/pages/Scratch.tsx`
- [ ] Delete `src/pages/Scratch.tsx`; both commands return to green
- [ ] `rm -rf dist && npm run e2e` succeeds (proves `pree2e` builds)

#### Console/Network Check
- [ ] Not applicable — no UI change; e2e suite covers the served page

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
