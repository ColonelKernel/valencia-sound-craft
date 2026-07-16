# Specification: Static Shell & Metadata

## Feature: Static shell rebrand, URL retarget to research.zachscheffler.com, and PWA/SEO metadata

### Overview
The dossier deploys to **https://research.zachscheffler.com/** (the apex
`zachscheffler.com` stays with the portfolio site). This spec retargets every
absolute URL in the static shell to the research subdomain, rebrands the
static `public/404.html` fallback from its legacy teal/amber palette to the
dossier's paper/night/acid brand tokens, adds a sitemap + robots Sitemap line,
generates touch icons and a web manifest, and makes the visible year values
maintainable (dynamic footer year, hero cycle sourced from the content model).

### User Stories
- As a faculty reviewer following a stale deep link, I want the static 404
  fallback to look and read like the rest of the dossier so that the site feels
  coherent even on a missed route.
- As a search engine or social crawler, I want canonical/OG/JSON-LD URLs, a
  sitemap, and a manifest that all point at https://research.zachscheffler.com/
  so that previews and indexing resolve to the deployed origin.
- As the site maintainer, I want the year values to be dynamic or sourced from
  the content model so that the shell does not silently go stale next cycle.

---

## Functional Requirements

### FR-1: Rebrand `public/404.html` to the dossier brand tokens
Rewrite the inline styles of `public/404.html` from the current teal/amber
palette (`#0a0e17`, `#73d4cb`, `#f2b76d`, …) to the brand tokens defined in
`src/index.css`: paper `#f2f1eb`, night `#0a1b14`, acid `#c9f873`, ink
`#10231b` (with the white `#fbfcf8` used on the night background). Align the
copy with `src/pages/NotFound.tsx` so the static fallback and the SPA 404 read
as the same page.

**Acceptance Criteria:**
- [ ] `public/404.html` `theme-color` meta is `#0a1b14`.
- [ ] No teal/amber palette values (`#0a0e17`, `#73d4cb`, `#a2e6df`,
      `#f2b76d`, `#f2f5f7`, `#b8c3cc`) remain in the file.
- [ ] Styling uses the night background with acid accents matching the SPA
      `.not-found-shell` treatment (night `#0a1b14` background, acid `#c9f873`
      kicker/CTA, white `#fbfcf8` text).
- [ ] Copy matches `NotFound.tsx`: kicker "404 / Page not found", heading
      "Page not found. This portfolio has been consolidated.", body about the
      route belonging to an earlier version of the site, CTA "Return home to
      the research dossier".
- [ ] The `noindex, follow` robots meta is retained.
- [ ] The file remains a self-contained static SPA-fallback page (no JS
      required, single `/` link home).

### FR-2: Retarget absolute URLs in `index.html` and fix JSON-LD hasPart repos
Every occurrence of `https://zachscheffler.com/` in `index.html` (canonical
link, `og:url`, `og:image`, `og:image:secure_url`, `twitter:image`, and every
JSON-LD `@id`/`url`/image URL) changes origin to
`https://research.zachscheffler.com/`, keeping paths (e.g. `/media/...`)
intact. While in the JSON-LD, correct the four `hasPart` `codeRepository`
URLs to the canonical repo names and rename the Logic node to match the
content model.

**Acceptance Criteria:**
- [ ] `grep -c "https://zachscheffler.com" index.html` returns 0 matches.
- [ ] Canonical link is `https://research.zachscheffler.com/`.
- [ ] `og:url`, `og:image`, `og:image:secure_url`, `twitter:image` use the
      research subdomain with unchanged paths.
- [ ] All JSON-LD `@id` and `url` values use the research subdomain.
- [ ] The four `hasPart` `codeRepository` URLs are
      `https://github.com/ColonelKernel/session-state-explorer-cubase`,
      `…/session-state-explorer-ableton`, `…/session-state-explorer-reaper`,
      `…/session-state-explorer-logic`.
- [ ] The hasPart node previously named "Logic Session State Explorer" is now
      "Logic Session Evidence Explorer".
- [ ] `<link rel="preload" as="font" type="font/woff2" crossorigin
      href="/fonts/InterVariable.woff2">` is present in `<head>`.
      Note: the font file itself lands via spec/005; until that merges the
      preload 404s harmlessly (browsers warn, nothing breaks) and becomes
      effective once the file exists.

### FR-3: Sitemap and robots Sitemap line
Add `public/sitemap.xml` listing the single dossier URL, and reference it from
`public/robots.txt`.

**Acceptance Criteria:**
- [ ] `public/sitemap.xml` is valid XML containing exactly one `<url>` entry
      with `<loc>https://research.zachscheffler.com/</loc>` and
      `<lastmod>2026-07-16</lastmod>`.
- [ ] `public/robots.txt` ends with the line
      `Sitemap: https://research.zachscheffler.com/sitemap.xml` (existing
      `User-agent`/`Allow` lines preserved).
- [ ] Both files appear in `dist/` after `npm run build`.

### FR-4: Touch icons and web manifest
Generate icons from the existing portrait media and wire a manifest.

**Acceptance Criteria:**
- [ ] `public/apple-touch-icon.png` is 180x180, `public/icon-192.png` is
      192x192, `public/icon-512.png` is 512x512 (verified with
      `sips -g pixelWidth -g pixelHeight`).
- [ ] Icons are derived from `public/media/zach-scheffler-480.webp` /
      `-960.webp` via macOS `sips` (square center-crop then resize; webp→png
      via `sips -s format png`), falling back to cropping
      `public/media/zach-scheffler-research-og.jpg` if sips cannot decode webp.
- [ ] `public/site.webmanifest` exists with `name`
      "Zach Scheffler - Research", `theme_color` `#0a1b14`,
      `background_color` `#f2f1eb`, and icon entries for 192 and 512.
- [ ] `index.html` `<head>` contains
      `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` and
      `<link rel="manifest" href="/site.webmanifest">`.
- [ ] All four files appear in `dist/` after `npm run build`.

### FR-5: Year handling in `src/pages/Index.tsx`
Make the visible year values maintainable.

**Acceptance Criteria:**
- [ ] The footer copyright renders the year via
      `new Date().getFullYear()` instead of the literal `2026`.
- [ ] `src/content/research.ts` exports
      `export const dossierCycle = "2026";` and the hero kicker interpolates
      it ("Zach Scheffler · Research portfolio · {dossierCycle}").
- [ ] `src/content/research.test.ts` is NOT modified (the new export does not
      violate the content contract).
- [ ] Rendered hero kicker and footer text are unchanged for 2026 (e2e suite
      stays green).

---

## Success Criteria

- The static 404 fallback and the SPA 404 are visually and textually the same
  page to a visitor.
- All crawler-facing URLs (canonical, OG, twitter, JSON-LD, sitemap, robots)
  resolve to the https://research.zachscheffler.com/ origin.
- The site installs/pins with correct icons and theme colors on iOS/Android.
- No hard-coded year remains in `src/pages/Index.tsx`.

---

## Dependencies
- macOS `sips` for icon generation (webp decode; jpg fallback documented).
- spec/005 delivers `/fonts/InterVariable.woff2`; this spec only adds the
  preload link (harmless 404 until 005 merges).
- User-approved deployment decision: dossier at
  https://research.zachscheffler.com/, portfolio stays at the apex.

## Assumptions
- Single-page site: the sitemap needs exactly one URL.
- `research.test.ts` guards content structure and leaks; adding a
  `dossierCycle` export is additive and contract-safe.
- The favicon.ico stays as-is; only touch icons and manifest are added.

---

## Completion Signal

### Implementation Checklist
- [ ] `public/404.html` rebranded (tokens + copy + theme-color).
- [ ] `index.html` URLs retargeted, hasPart repos corrected, Logic node
      renamed, font preload + apple-touch-icon + manifest links added.
- [ ] `public/sitemap.xml` created; `public/robots.txt` Sitemap line appended.
- [ ] Three PNG icons generated at correct dimensions;
      `public/site.webmanifest` created.
- [ ] `src/pages/Index.tsx` dynamic footer year; hero kicker interpolates
      `dossierCycle` from `src/content/research.ts`.

### Testing Requirements

The agent MUST complete ALL before outputting the magic phrase:

#### Code Quality
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes (research.test.ts untouched)
- [ ] `npm run build` passes
- [ ] `npm run e2e` passes (kill any stale vite preview on port 4173 first)

#### Functional Verification
- [ ] `dist/404.html` contains the night/acid palette and NotFound.tsx copy
- [ ] `dist/sitemap.xml`, `dist/robots.txt` (with Sitemap line),
      `dist/site.webmanifest`, `dist/apple-touch-icon.png`,
      `dist/icon-192.png`, `dist/icon-512.png` all exist
- [ ] Icon dimensions verified with `sips -g pixelWidth -g pixelHeight`
- [ ] No `https://zachscheffler.com` origin remains in `dist/index.html`

#### Visual Verification (if UI)
- [ ] 404 fallback reads as the same page as the SPA NotFound

#### Console/Network Check (if web)
- [ ] No new console errors (the font preload 404 is expected until spec/005
      merges and is explicitly accepted)

### Iteration Instructions

If ANY check fails:
1. Identify the specific issue
2. Fix the code
3. Run tests again
4. Verify all criteria
5. Commit and push
6. Check again

**Only when ALL checks pass, output:** `<promise>DONE</promise>`
