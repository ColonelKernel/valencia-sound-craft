import { expect, test } from "@playwright/test";

import { ROUTE_META } from "../../src/app/routeMeta";

/**
 * Colour contrast, measured in a real browser.
 *
 * There are three layers of defence here and each one exists because the layer
 * above it was proven insufficient:
 *
 *   1. `npm run lighthouse` — the one check that ever caught a contrast bug,
 *      and on 2026-09-21 it was measured missing one: /cv scored accessibility
 *      1.00 while rendering a 4.21:1 label. axe cannot always resolve an
 *      alpha-composited colour against the surface behind it, so it reports
 *      "incomplete" rather than "fail".
 *   2. `src/app/contrast.test.ts` — arithmetic over the source text. Fast,
 *      names the offending file, and covers the case this codebase actually
 *      hits (a Tailwind opacity modifier on --muted-foreground). It cannot see
 *      a hardcoded hex, a coloured background, or a colour computed at runtime,
 *      because it never renders anything.
 *   3. This file — reads `getComputedStyle` off a live page, so it sees the
 *      final colour no matter how it was authored.
 *
 * Animations are disabled and `.fade-up` is forced visible before measuring:
 * those elements start at `opacity: 0` and only gain `.visible` on
 * intersection, so without this the probe would either measure mid-transition
 * values or skip everything below the fold.
 *
 * Text drawn over a background image cannot be measured this way — the
 * effective backdrop is whatever pixel happens to sit behind each glyph. Those
 * are reported separately and counted rather than silently passed, so the set
 * cannot quietly grow.
 */

const ROUTES = [
  ROUTE_META.home.path,
  ROUTE_META.cv.path,
  ROUTE_META.projects.path,
  ROUTE_META.work.path,
  ROUTE_META.transitAtlas.path,
  ROUTE_META.catalogIntelligence.path,
  ROUTE_META.sessionState.path,
  ROUTE_META.autoharm.path,
  ROUTE_META.toolsIndex.path,
  ROUTE_META.rhythm.path,
  ROUTE_META.harmony.path,
  ROUTE_META.circle.path,
  ROUTE_META.tonnetz.path,
  ROUTE_META.musicAnalytics.path,
];

/**
 * Where text legitimately sits on something this probe cannot measure, and why
 * each one is fine anyway. Anything outside this list fails with its details
 * printed, so a new image-backed text block has to be justified here rather
 * than quietly inherited.
 *
 * Counts are deliberately not pinned — they move with content (how many
 * embeds /work renders, how many strings the fretboard draws) without the
 * design changing. The zone is the stable fact.
 *
 *   "/"              #hero — the H1 and lede are white over a photograph with
 *                    a `bg-black/65` scrim. nav — the navbar is transparent at
 *                    the top of the homepage, so it too sits on that photo.
 *                    Both are in Lighthouse's audited viewport, which is the
 *                    check that covers them; it scores / at accessibility 1.00.
 *   "/work"          #work-embeds — "Load … player" is white/90 on a YouTube
 *                    poster frame, a third-party image with no fixed colour.
 *                    The facade draws a dark gradient behind the label.
 *   "/tools/harmony" #fretboard — string labels are stone-400 (#a8a29e) on an
 *                    inline gradient from hsl(30 20% 12%) to hsl(25 25% 10%).
 *                    Computed by hand: 6.49:1 at the light end, 6.91:1 at the
 *                    dark end. Passes AA across the whole gradient; the probe
 *                    simply cannot read a gradient.
 */
const UNMEASURABLE_ZONES: Record<string, string[]> = {
  "/": ["#hero", "nav"],
  "/work": ["embed-facade"],
  "/tools/harmony": ["fretboard"],
  "/tools/rhythm": ["leaflet-map"],
};

const PROBE = `(() => {
  const parse = (c) => {
    const m = (c || "").match(/[\\d.]+/g);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 };
  };
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const over = (fg, bg) => ({
    r: fg.a * fg.r + (1 - fg.a) * bg.r,
    g: fg.a * fg.g + (1 - fg.a) * bg.g,
    b: fg.a * fg.b + (1 - fg.a) * bg.b,
    a: 1,
  });
  const ratio = (a, b) => {
    const x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };

  // Media that is painted behind other content. The hero puts its photograph
  // in an absolutely-positioned sibling layer rather than in a CSS background,
  // so backgroundImage alone misses it and the text above would be measured
  // against the page background instead — a false pass on the most-read
  // element on the site. Anything that fully covers a text box is treated as
  // an unknown backdrop; an inline icon never covers the text beside it, so
  // this does not catch the navbar.
  const media = [...document.querySelectorAll("img, canvas, video")]
    .map((node) => ({ node, rect: node.getBoundingClientRect() }))
    .filter(({ rect }) => rect.width > 40 && rect.height > 40);

  const coveredByMedia = (el, rect) =>
    media.some(
      ({ node, rect: m }) =>
        !node.contains(el) &&
        m.left <= rect.left + 1 &&
        m.top <= rect.top + 1 &&
        m.right >= rect.right - 1 &&
        m.bottom >= rect.bottom - 1,
    );

  const fails = [];
  const overImage = [];
  let checked = 0;

  for (const el of document.querySelectorAll("body *")) {
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    if (!text) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    if (el.closest("[aria-hidden='true']")) continue;

    // Walk up for the surface this text is actually drawn on, compositing any
    // semi-transparent layers on the way, and bail if an image or a partially
    // transparent ancestor makes the answer a per-pixel one.
    const layers = [];
    let node = el;
    let base = null;
    let imageBacked = false;
    let dimmedByAncestor = false;
    while (node && node !== document.documentElement) {
      const ns = getComputedStyle(node);
      if (node !== el && parseFloat(ns.opacity) < 1) dimmedByAncestor = true;
      if (ns.backgroundImage && ns.backgroundImage !== "none") imageBacked = true;
      const bg = parse(ns.backgroundColor);
      if (bg.a >= 0.999) { base = bg; break; }
      if (bg.a > 0) layers.push(bg);
      node = node.parentElement;
    }
    if (!base) base = parse(getComputedStyle(document.documentElement).backgroundColor);
    if (base.a < 0.999) base = { r: 255, g: 255, b: 255, a: 1 };

    let surface = base;
    for (let i = layers.length - 1; i >= 0; i -= 1) surface = over(layers[i], surface);

    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = size >= 24 || (size >= 18.66 && bold) ? 3.0 : 4.5;

    // The nearest landmark or identified container. Class strings churn with
    // every restyle; these do not, so the allowlist below is written in terms
    // of them.
    const owner = el.closest("[data-zone], .leaflet-container, nav, footer, [id]");
    const zone = owner
      ? owner.classList.contains("leaflet-container")
        ? "leaflet-map"
        : owner.dataset.zone
        ? owner.dataset.zone
        : owner.id
          ? "#" + owner.id
          : owner.tagName.toLowerCase()
      : "(none)";

    const entry = {
      zone,
      text: text.slice(0, 40),
      size,
      cls: String(el.className).slice(0, 70),
    };

    const rect = el.getBoundingClientRect();
    if (imageBacked || dimmedByAncestor || coveredByMedia(el, rect)) {
      overImage.push(entry);
      continue;
    }

    checked += 1;
    const r = ratio(over(parse(cs.color), surface), surface);
    if (r < need) fails.push({ ...entry, ratio: +r.toFixed(2), need });
  }

  return { checked, fails, overImage };
})()`;

for (const route of ROUTES) {
  test(`${route} has no unreadable text`, async ({ page }) => {
    await page.goto(route);

    // Settle the reveal animation: .fade-up is opacity 0 until an
    // IntersectionObserver adds .visible, so anything below the fold would
    // otherwise be unmeasured, and anything mid-transition mismeasured.
    await page.addStyleTag({
      content: `*, *::before, *::after { animation: none !important; transition: none !important; }
                .fade-up { opacity: 1 !important; transform: none !important; }`,
    });
    // The page's own sections mount lazily; wait for the footer, which is the
    // last thing in the shell, before deciding the DOM is complete.
    await page.locator("footer").first().waitFor({ state: "attached", timeout: 20_000 });

    const result = await page.evaluate(PROBE);

    // A probe that measured nothing would pass forever.
    expect(result.checked, `${route} rendered no measurable text`).toBeGreaterThan(10);

    expect(
      result.fails,
      `${route}: ${result.fails.length} element(s) below WCAG AA`,
    ).toEqual([]);

    const allowedZones = UNMEASURABLE_ZONES[route] ?? [];
    const unexplained = result.overImage.filter(
      (entry: { zone: string }) => !allowedZones.includes(entry.zone),
    );
    expect(
      unexplained,
      `${route}: text sits on something this probe cannot measure, in a zone ` +
        `that is not documented in UNMEASURABLE_ZONES. Check it by eye, then ` +
        `either fix it or add the zone with the reason.`,
    ).toEqual([]);
  });
}
