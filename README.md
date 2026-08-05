# Valencia Sound Craft — zachscheffler.com

Portfolio and interactive music tools for **Zach Scheffler** — music producer,
creative technologist, and data professional. Live at
**[zachscheffler.com](https://zachscheffler.com)**.

The site pairs a conventional portfolio (work, projects, CV) with a set of
direct-linkable, interconnected music tools: a world rhythm engine with cited
ethnomusicological sources, a harmony workspace, and a music-catalog analytics
dashboard — all sharing one transport, key, and tempo.

## What's here

| Route | What it is |
| --- | --- |
| [`/`](https://zachscheffler.com/) | Portfolio home: services, selected work, analytics preview, contact |
| [`/tools`](https://zachscheffler.com/tools) | Index of the interconnected music tools |
| [`/tools/rhythm`](https://zachscheffler.com/tools/rhythm) | Rhythm Engine — world-rhythm atlas, browser, and step sequencer in sync |
| [`/tools/harmony`](https://zachscheffler.com/tools/harmony) | Harmony Lab — modes, chord progressions, metronome, theory references |
| [`/tools/map`](https://zachscheffler.com/tools/map) | Rhythm Map — a Leaflet world atlas that plays each groove as you browse |
| [`/tools/circle`](https://zachscheffler.com/tools/circle) | Interactive circle of fifths, connected to the shared music state |
| [`/tools/tonnetz`](https://zachscheffler.com/tools/tonnetz) | Interactive Tonnetz for exploring harmonic space |
| [`/music-analytics`](https://zachscheffler.com/music-analytics) | Catalog-intelligence dashboard (demonstration dataset from public Spotify popularity data) |
| [`/groove-atlas`](https://zachscheffler.com/groove-atlas) | World atlas of rhythm traditions with cited sources + a feel-space lab |
| [`/projects`](https://zachscheffler.com/projects) | Software: AutoHarm, Ableton Live extensions, music-tech research |
| [`/work`](https://zachscheffler.com/work) | Music & video: the Global Pulse EP, session recordings, Streetcar Scandal |
| [`/cv`](https://zachscheffler.com/cv) | CV with client-side PDF export |

## Architecture

**Two sites, one repo.** `main` holds a separate research dossier
(research.zachscheffler.com); this portfolio lives on — and deploys from — the
**`portfolio/rebuild`** branch. See [`DEPLOY.md`](DEPLOY.md) for the full
runbook. ⚠️ The Netlify production branch is `portfolio/rebuild`, **not**
`main`.

**SPA with build-time head stamping.** [`src/app/routeMeta.ts`](src/app/routeMeta.ts)
is the single source of truth for every route's path, title, and description —
the router, the runtime `<RouteHead>`, the sitemap, and the tests all read it.
At build time, [`build/stampRouteHeadsPlugin.ts`](build/stampRouteHeadsPlugin.ts)
emits a flat, fully-stamped HTML shell per route (title, description, canonical,
Open Graph) plus a real `404.html`, so crawlers and social scrapers that never
execute JavaScript still see correct per-route metadata, and unknown URLs return
an honest HTTP 404.

**Shared music state.** The tools run on a single global transport and
`AudioContext` — pick a rhythm on the map and the sequencer follows, set a tempo
anywhere and it holds everywhere.

**Content as data.** Work credits, CV entries, and project metadata live in
typed content modules (`src/content/`) with guardrail tests — e.g. the CV can
never ship a phone number, and the sitemap can never drift from the route table.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind (shadcn/Radix) · Web Audio ·
Leaflet · Recharts · Supabase (contact form + edge functions) · Vitest ·
Playwright · GitHub Actions

## Quality gates

Every commit on the production branch passes, locally and in CI
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

- `npm run typecheck` — strict TypeScript, app + node configs
- `npm run lint` — ESLint at **zero warnings**
- `npm run test` — unit suite (Vitest)
- `npm run budget` — homepage initial JS graph ≤ **150 KB gzip**, with heavy
  libraries banned from the entry chunk
- `npm run e2e` — Playwright suite against a production build
- `npm run lighthouse` — Lighthouse CI with an **accessibility floor of 1.0**
  across all audited routes

## Local development

```bash
npm ci
npm run dev        # dev server on :8080
npm run test       # unit tests
npm run e2e        # builds + serves + runs the Playwright suite
npm run budget     # bundle-size gate
```

`VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` are optional locally —
without them the contact form gracefully compiles down to a direct-contact
panel.

## Credits

Fonts: DM Sans and Space Grotesk, self-hosted under the
[SIL Open Font License](public/fonts/LICENSE.md). Rhythm-tradition entries in
the Groove Atlas cite published ethnomusicological sources inline. Basemap
tiles by [CARTO](https://carto.com/), data © OpenStreetMap contributors.
