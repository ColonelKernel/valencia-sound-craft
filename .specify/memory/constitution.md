# Valencia Sound Craft — Research Dossier Constitution

> A public, evidence-led research dossier tailored to the UPF MTG × Steinberg PhD
> topic: **interpretable DAW state → acoustic outcomes → creativity-supporting
> prediction**. This is Zach Scheffler's application artifact — it is public,
> reviewed by faculty, and its content is treated as a research claim.

## Version
1.0.1

---

## Context Detection

### Context A — Ralph Loop (autonomous)
You are in a Ralph loop if you were started by `scripts/ralph-loop.sh` (or a
variant) and fed `PROMPT_build.md` / `PROMPT_plan.md` via stdin.

In this mode:
- Read this constitution end-to-end before acting.
- Pick the highest-priority incomplete spec from `specs/` (or the highest task
  in `IMPLEMENTATION_PLAN.md` if it exists).
- Implement it completely and honestly.
- Run every validation command in **Quality gates** and confirm all pass.
- Commit and push on the current branch (which MUST NOT be `main`).
- Output `<promise>DONE</promise>` **only** when every acceptance criterion in
  the spec's Completion Signal is verified.
- If blocked, append a concise note to `history/<spec-slug>.md` explaining what
  you learned and stop instead of forcing a wrong answer.

### Context B — Interactive chat
The user is chatting outside a Ralph loop.

In this mode:
- Be conversational; recommend, don't dictate.
- Help draft or refine specs in `specs/`.
- Do not run the loop unless the user explicitly asks.

---

## Core Principles

### I. Curate, don't catalog
The dossier is a *curated* research argument, not a project index. Every entry
must earn its place. When adding work, prefer enriching one of the three
existing case-study threads (`session-state`, `improv-partner`, `autoharm`) over
creating a new one. Bloat is a defect.

### II. Verify metrics against the source
Every claimed number (accuracy, coverage, corpus size) must be grounded in a
citable file inside the source repos on disk. If a metric cannot be verified,
qualify it, remove it, or replace it — never publish an unsourced figure. The
test suite already forbids many failure modes (see Publishing safeguards); keep
it that way.

### III. Observability is part of the result
Where a system can only *infer* or cannot observe at all, say so on the page.
"Hidden state," "in-sample," "synthetic proof of concept," and "pending
validation" are honest labels, not weaknesses to hide. Do not silently smooth
these away.

### IV. Subtle PhD alignment
Mirror the call for applications' language (audio effects / mixing state,
acoustic outcome, creativity-supporting prediction; MIR, audio effects &
processing, ML, music production). Do **not** name-drop Steinberg or Cubase for
alignment's sake on the public site. The Cubase-first ordering already carries
that signal implicitly.

### V. Simplicity & YAGNI
The shipped app is intentionally three files (`main.tsx`, `App.tsx`,
`pages/Index.tsx` + `components/Navbar.tsx` + `content/research.ts`) with
`react` and `react-dom` as the only runtime deps. Do not reintroduce a router,
a UI kit, a state manager, or a backend unless a spec's acceptance criteria
genuinely require it.

### VI. PR discipline is non-negotiable
The Ralph loop pushes commits from whatever branch it is on. **It must never be
run on `main`.** Every unit of work lives on a feature branch; the human opens
the pull request. See Autonomy configuration below.

---

## Technical stack

| Layer            | Technology                                            |
| ---------------- | ----------------------------------------------------- |
| Framework        | React 18 + Vite 5 (`@vitejs/plugin-react-swc`)        |
| Language         | TypeScript 5.8 (strict, `noUncheckedIndexedAccess`)   |
| Styling          | Tailwind 3.4 + hand-authored CSS in `src/index.css`   |
| Routing          | None. `App.tsx` switches on `window.location.pathname`|
| Unit tests       | Vitest (globs: `src/content/**/*.{test,spec}.ts`)     |
| E2E              | Playwright (`tests/e2e/dossier.spec.ts`)              |
| Perf/audits      | Lighthouse CI (`lighthouserc.cjs`)                    |
| Runtime deps     | `react`, `react-dom` — nothing else                   |

Node ≥ 20.

---

## Project structure (live graph)

```
src/
├── main.tsx                # createRoot(<App />)
├── App.tsx                 # window.location.pathname → <Index/> or <NotFound/>
├── index.css               # all styles (Tailwind + custom)
├── components/
│   └── Navbar.tsx
├── content/
│   ├── research.ts         # THE data model — case studies, supporting projects, education
│   └── research.test.ts    # content contract (guards structure + no leaks)
└── pages/
    ├── Index.tsx           # the whole dossier renders here
    └── NotFound.tsx

public/
├── media/                  # all live images (webp/jpg)
├── 404.html                # static-host SPA fallback
└── robots.txt

tests/e2e/                  # Playwright suite for the dossier
```

Anything outside this graph is either scaffolding for Ralph or dev tooling.

---

## Publishing safeguards (enforced by tests)

`src/content/research.test.ts` encodes a deliberate content contract. When
adding or changing content, keep these true:

- Exactly **3 case studies** with ids `session-state`, `improv-partner`,
  `autoharm`, in that order.
- Exactly **3 supporting projects**: `HarmonySingerMax`, `AutoHarm Studio`,
  `Arrangement Architect`, in that order.
- Every metric object has non-empty `value`, `label`, `context`, and
  `qualifier` fields (the honest label is required, not decorative).
- The `session-state` implementations list is
  `Cubase → Ableton → REAPER → Logic` (Cubase leads).
- No local filesystem path (`/Users/…`, `/Volumes/…`) appears anywhere in the
  content.
- No email address is published in the content.
- The private planning-doc names `ImprovPartnerPlan` and
  `ImprovPartner-live-snapshot` never appear.
- Every published link is `https://…`.
- Test-pinned strings (workshop collaborators, "musician and technical
  collaborator", "pretrained JazzNet", "does not claim original authorship or
  novel training", "does not predict DAW production state", the Berklee record
  URL) must survive edits.

Additional public-site rules that are NOT test-enforced but are still binding:

- Do not add workshop spreadsheets, internal documents, collaborator
  portraits, third-party manuals, or unlicensed session material.
- Public profile links are limited to GitHub and LinkedIn.
- Keep synthetic, in-sample, heuristic, and pending-validation labels attached
  to the results they qualify.

---

## Autonomy configuration

### YOLO Mode: ENABLED
The loop passes `--dangerously-skip-permissions` to `claude`. This is
appropriate for iterative work on a feature branch inside this repo.

### Git Autonomy: ENABLED, with hard constraints

- The loop MAY: stage, commit, and push on the **current feature branch**.
- The loop MUST NOT: run on `main`, open pull requests, merge pull requests,
  force-push, rewrite history, or push tags.
- If the loop detects it is on `main` at startup, it must refuse to do
  destructive work and instead output `<promise>DONE</promise>` after only
  reading — the human will move it to a feature branch.

Before starting Ralph, always: `git checkout -b <spec-slug>`.

The human opens every PR against `main` after reviewing the diff.

---

## Development workflow

1. **Write a spec.** Copy `templates/spec-template.md` to
   `specs/NNN-slug/spec.md` where `NNN` is the next unused three-digit number.
   Fill in Requirements, Acceptance Criteria, and Completion Signal. Vague
   criteria produce vague implementations — be specific.
2. **Branch.** `git checkout -b spec/NNN-slug`.
3. (Optional) **Plan.** `./scripts/ralph-loop.sh plan` produces
   `IMPLEMENTATION_PLAN.md`. Skip for small specs.
4. **Build.** `./scripts/ralph-loop.sh` (or `./scripts/ralph-loop.sh 20` to cap
   iterations). Each iteration is a fresh Claude Code process; shared state
   lives on disk.
5. **Review.** When the loop stops with `DONE`, read the diff, then open a PR:
   `gh pr create --base main`.
6. **Merge.** Human decision.

---

## Quality gates

Before outputting `<promise>DONE</promise>` on any spec, the following must
all be green:

```bash
npm run typecheck   # tsc -b
npm run lint        # eslint over the live-graph files, configs, and tests
npm test            # vitest — includes src/content/research.test.ts
npm run build       # vite production build
npm run e2e         # Playwright — the dossier e2e suite + retired-route 404s
```

For UI-affecting changes, additionally: run `npm run dev`, drive the actual
page in a browser, and verify visually. Type-check green ≠ feature working.

If Lighthouse is relevant to the spec, `npm run lighthouse` too. It is not a
default gate.

---

## What Ralph should NOT touch without a spec that names it

- `src/content/research.test.ts` — changing this is changing the contract.
  Requires an explicit spec.
- `.env` — untracked; add secrets only through the shell environment.
- Any file under `.specify/memory/` or `templates/` — those are Ralph's own
  scaffolding.

---

## The magic word

If the user says **"Ralph, start working"**, reply with the terminal command
to start the loop on the current feature branch:

```bash
./scripts/ralph-loop.sh
```

Do not start the loop yourself from an interactive session.

---

## Governance

- **Amendments:** edit this file, bump the version, note the change in a
  short changelog line at the bottom.
- **Precedence:** the tests are the strictest layer of the content contract.
  If this constitution and `research.test.ts` ever disagree, the tests win
  and this file is out of date.

---

**Created:** 2026-07-13
**Version:** 1.0.1

**Changelog:**
- 1.0.1 (2026-07-16): Ralph loop gained hard main-branch/failure-stop guards; quality-gates e2e description synced (no hardcoded test count).
