# Spec 002 — App shell & routing rebuild

## Goal

One clean application shell: a single route manifest, lazy-loaded pages,
shared layout, per-route error boundaries, and unified document metadata —
with zero visual change.

## Requirements

1. Create a route manifest module (single source of truth) defining every
   route's path, lazy page import, title, and meta description. All page-level
   routes load via `React.lazy` + `Suspense` with a lightweight branded
   fallback.
2. A shared `<Layout>` renders the Navbar and footer exactly once; pages stop
   importing the Navbar individually. Keep scroll restoration behavior and the
   existing skip link if present.
3. Per-route error boundary: an exception inside a page renders a branded
   fallback (reuse the existing `TabErrorBoundary` pattern), never a white
   screen. Prove it with a unit or e2e test.
4. `document.title` follows the existing brand pattern
   (`<Page> | Valencia Sound Craft` — confirm the exact live pattern first and
   match it) on every route, including 404.
5. Unknown paths render the branded 404 with zero console output.

## Acceptance criteria

- [ ] `dist/` contains a separate chunk per page; the entry chunk statically
      imports no page module (verify via the built output or the Vite
      manifest).
- [ ] One route-manifest module drives paths, titles, and descriptions;
      no per-page hardcoded title drift remains.
- [ ] Navbar/footer render once via `<Layout>`.
- [ ] Error-boundary test proves a throwing page renders the branded fallback.
- [ ] e2e console-clean coverage: client-side navigation to every route AND
      direct deep-load of every route (including 404) produce zero console
      messages.
- [ ] Screenshot pass on `/`, `/tools`, one tool route, `/music-analytics`
      shows no visual change.
- [ ] All gates green; tails in `specs/002-app-shell-and-routing/gate-logs/`.

**Output when complete:** `<promise>DONE</promise>`
