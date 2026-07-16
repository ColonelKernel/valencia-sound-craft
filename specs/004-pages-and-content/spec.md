# Spec 004 — Pages & content rebuild

## Goal

Every page rebuilt as clean, decomposed components with the professionalized
copy preserved verbatim, remaining audit findings fixed, and pixel-faithful
visuals.

## Requirements

1. Decompose page monoliths (`Index`, `MusicAnalyticsPage`,
   `GrooveIntelligencePage`, tool pages): no page file over ~300 lines;
   shared sections extracted into components. Copy must not change except
   where required below — log every wording change in `ralph_history.md`.
2. **Portfolio content visible by default**: embeds and track list render on
   first load (first section expanded or all visible) — no content hidden
   behind a low-affordance chevron.
3. Capitalize interpolated region names in Rhythm Map prose ("Argentina",
   not "argentina").
4. Make the Rhythm Map basemap legible while keeping the dark aesthetic:
   country shapes and labels must be distinguishable in a screenshot.
5. Brand consistency: one title pattern across `index.html`, every route
   title, and the 404 page.
6. Footer/social links: no bare `youtube.com` link anywhere; the Research
   link stays; leave WhatsApp and other links untouched.

## Acceptance criteria

- [ ] No page file exceeds ~300 lines; extraction documented.
- [ ] Portfolio page shows embeds/content without any interaction on first
      load.
- [ ] Region names render capitalized.
- [ ] Basemap screenshot shows distinguishable geography/labels.
- [ ] Grep finds no dev-speak in user-facing strings: "now exposes",
      "shared store", "now come from", "one-page tool switcher",
      "search engines and musicians".
- [ ] Title pattern identical across `index.html`, all routes, 404.
- [ ] Screenshot pass of every route at desktop and 375 px mobile; anomalies
      fixed; screenshot locations noted in `ralph_history.md`.
- [ ] All gates green; tails in `specs/004-pages-and-content/gate-logs/`.

**Output when complete:** `<promise>DONE</promise>`
