# Specification: Canonical Links and Content Truth

## Feature: Canonical adapter repo URLs, single-source bio, and content-derived architecture diagram

### Overview
Three related content-truth fixes for the dossier. First, the four DAW adapter
repository links in `src/content/research.ts` must point at the canonical
`session-state-explorer-*` GitHub repository names instead of the legacy
mixed-case names. Second, the "About" background lead paragraph is currently
duplicated: `backgroundSummary` in `research.ts` holds an older sentence while
`src/pages/Index.tsx` hardcodes the real on-page copy — the content model must
become the single source of truth and the page must render from it. Third, the
`ResearchArchitecture` figure in `Index.tsx` hardcodes its four DAW nodes; it
must derive them from the flagship study's `implementations` array so the
diagram can never drift from the content model.

### User Stories
- As a faculty reviewer, I want every repository link to resolve directly
  (HTTP 200, no redirect) so that the dossier's evidence trail is trustworthy.
- As the dossier maintainer, I want the bio paragraph defined once in the
  content model so that edits cannot leave the page and model disagreeing.
- As the dossier maintainer, I want the architecture diagram generated from
  `implementations` so that adapter labels stay consistent everywhere.

---

## Functional Requirements

### FR-1: Canonical adapter repo URLs
Update the four adapter link constants in `src/content/research.ts` (the
`cubaseAdapterLink`, `abletonAdapterLink`, `reaperAdapterLink`, and
`logicAdapterLink` constants) to the canonical repository slugs under
`https://github.com/ColonelKernel/`:

| Old slug                      | New slug                         |
| ----------------------------- | -------------------------------- |
| `CubaseSessionStateExplorer`  | `session-state-explorer-cubase`  |
| `AbletonSessionStateExplorer` | `session-state-explorer-ableton` |
| `session-state-explorer`      | `session-state-explorer-reaper`  |
| `LogicSessionStateExplorer`   | `session-state-explorer-logic`   |

**Acceptance Criteria:**
- [ ] All four `href` values use the new slugs; link `label` values are unchanged.
- [ ] `index.html` is NOT modified (that belongs to spec/006).
- [ ] Each new URL returns HTTP 200 with an empty redirect URL via
      `curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" <url>`.

### FR-2: Bio single source of truth
Replace the `backgroundSummary` string in `src/content/research.ts` (currently
"My background joins music production...") with the on-page copy currently
hardcoded in `src/pages/Index.tsx`:

> "A path that joins music production and performance with applied data
> science and public-policy research. That mix shapes how I frame technical
> systems: as evidence-bearing tools used by people, inside institutions and
> creative workflows."

Then import `backgroundSummary` in `Index.tsx` and render it in the
`background-lead` paragraph instead of the hardcoded text. Finally, add
`backgroundSummary` to the `allContent` serialization object in
`src/content/research.test.ts` (importing it alongside the other imports) so
the no-email/no-path/forbidden-strings guards cover it. Make no other test
changes.

**Acceptance Criteria:**
- [ ] `backgroundSummary` in `research.ts` equals the on-page copy above.
- [ ] `Index.tsx` renders `backgroundSummary` in the background-lead paragraph
      with no hardcoded bio text remaining.
- [ ] `research.test.ts` imports `backgroundSummary` and includes it in
      `allContent`; no other test change is made.

### FR-3: Architecture diagram derives from the content model
Add a `daw` string field to the `ResearchImplementation` interface in
`research.ts` and populate it on the four session-state implementations as
"Cubase", "Ableton Live", "REAPER", "Logic Pro" (in that order). Because the
same interface is shared by the improv-partner and autoharm lineage entries,
which are not DAW-specific, the field is optional (`daw?: string`) and is
populated only where a DAW label is truthful. Change
`ResearchArchitecture` in `Index.tsx` to accept the implementations array
(passing `study.implementations ?? []` from the flagship study call site) and
render each node's name from `daw` and its small text from `observation`. The
rendered figure must look the same as before except for corrected labels
(use CSS text-transform or match existing casing as needed).

**Acceptance Criteria:**
- [ ] `ResearchImplementation` has a `daw?: string` field populated on all
      four session-state implementations with the values above.
- [ ] `ResearchArchitecture` receives `study.implementations ?? []` and maps
      over it — no hardcoded `[name, observation]` array remains.
- [ ] The figure's visual output is preserved (node numbering 01–04, name
      styling, lowercase small text as before).

---

## Success Criteria

- Every adapter repository link on the published page resolves with HTTP 200
  and no redirect.
- The bio paragraph exists in exactly one place (`research.ts`) and the page
  renders it verbatim.
- Changing an implementation's `daw` or `observation` in `research.ts` updates
  the architecture figure with no `Index.tsx` edit.

## Dependencies
- The four canonical GitHub repositories must already exist and be public.

## Assumptions
- `https://github.com/ColonelKernel/session-state-analyzer` remains the
  central analyzer repository and is unchanged by this spec.
- Editing `src/content/research.test.ts` is explicitly authorized by this spec
  (FR-2 names it), per the constitution's requirement.

---

## Completion Signal

### Implementation Checklist
- [ ] FR-1: four adapter link constants updated in `research.ts`.
- [ ] FR-2: `backgroundSummary` replaced, imported, and rendered; test
      serialization extended.
- [ ] FR-3: `daw` field added and `ResearchArchitecture` derives from
      `implementations`.

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (including the extended content contract)
- [ ] `npm run build` passes
- [ ] `npm run e2e` passes

#### Functional Verification
- [ ] For each of the four new GitHub URLs plus
      `https://github.com/ColonelKernel/session-state-analyzer`,
      `curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n"` returns
      `200` with an empty redirect URL.
- [ ] The background-lead paragraph renders the `backgroundSummary` text.
- [ ] The architecture figure shows Cubase / Ableton Live / REAPER / Logic Pro
      nodes with their observation small text.

#### Visual Verification (if UI)
- [ ] The architecture figure looks the same as before except for corrected
      labels.

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
