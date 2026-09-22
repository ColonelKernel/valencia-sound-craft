import { expect, type Page } from "@playwright/test";

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
export const UNMEASURABLE_ZONES: Record<string, string[]> = {
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
  // A raw getBoundingClientRect ignores ancestor clipping. Leaflet positions
  // its tiles with transforms and lets them run well outside the map, relying
  // on overflow:hidden to crop them — so an untrimmed tile rect covered the
  // continent filter chips sitting above the map and marked readable text
  // unmeasurable. Intersect with every clipping ancestor to get what is
  // actually painted.
  const visibleRect = (node) => {
    let r = node.getBoundingClientRect();
    let p = node.parentElement;
    while (p) {
      const ps = getComputedStyle(p);
      if (ps.overflow !== "visible" || ps.overflowX !== "visible" || ps.overflowY !== "visible") {
        const c = p.getBoundingClientRect();
        const left = Math.max(r.left, c.left);
        const top = Math.max(r.top, c.top);
        const right = Math.min(r.right, c.right);
        const bottom = Math.min(r.bottom, c.bottom);
        r = { left, top, right, bottom, width: right - left, height: bottom - top };
        if (r.width <= 0 || r.height <= 0) return r;
      }
      p = p.parentElement;
    }
    return r;
  };

  const covers = (outer, inner) =>
    outer.left <= inner.left + 1 &&
    outer.top <= inner.top + 1 &&
    outer.right >= inner.right - 1 &&
    outer.bottom >= inner.bottom - 1;

  const media = [...document.querySelectorAll("img, canvas, video")]
    .map((node) => ({ node, rect: visibleRect(node) }))
    .filter(({ rect }) => rect.width > 40 && rect.height > 40);

  const coveredByMedia = (el, rect) =>
    media.some(({ node, rect: m }) => !node.contains(el) && covers(m, rect));

  // SVG text is painted over sibling shapes, which the ancestor walk cannot
  // see: an <svg> has no background of its own, so the walk falls through to
  // the page and reports a surface the glyph never sits on. On /tools/tonnetz
  // that produced 1.08:1 for note labels that are in fact white on saturated
  // node circles. Only treat SVG text as unmeasurable when a painted shape is
  // actually behind it — Recharts axis labels have nothing behind them and
  // stay measurable.
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
    // SVG text is measured off real pixels by pixelProbe.ts. Computed style
    // cannot account for an SVG filter, and this site paints its circle-of-
    // fifths wedges through glow filters that move the rendered colour a long
    // way from the declared fill.
    if (el.namespaceURI === "http://www.w3.org/2000/svg") continue;

    // Walk up for the surface this text is actually drawn on, compositing any
    // semi-transparent layers on the way, and bail if an image or a partially
    // transparent ancestor makes the answer a per-pixel one.
    const layers = [];
    let node = el;
    let base = null;
    let imageBacked = false;
    let dimmedByAncestor = false;
    let dimmedBy = null;
    while (node && node !== document.documentElement) {
      const ns = getComputedStyle(node);
      if (node !== el && parseFloat(ns.opacity) < 1) {
        dimmedByAncestor = true;
        // Name the ancestor. A bare "ancestor-opacity" tells you the probe
        // gave up but not what to go and look at.
        if (!dimmedBy) {
          dimmedBy =
            (node.tagName.toLowerCase() +
              (node.id ? "#" + node.id : "") +
              "." + String(node.className).trim().split(" ").filter(Boolean).slice(0, 3).join(".")) +
            " @" + ns.opacity;
        }
      }
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

    const why = imageBacked
      ? "css-background-image"
      : dimmedByAncestor
        ? "ancestor-opacity: " + dimmedBy
        : coveredByMedia(el, rect)
          ? "covered-by-media"
          : null;
    if (why) {
      overImage.push({ ...entry, why });
      continue;
    }

    checked += 1;
    const r = ratio(over(parse(cs.color), surface), surface);
    if (r < need) fails.push({ ...entry, ratio: +r.toFixed(2), need });
  }

  return { checked, fails, overImage };
})()`;

export interface ContrastEntry {
  zone: string;
  text: string;
  size: number;
  cls: string;
  ratio?: number;
  need?: number;
  /** Why it could not be measured — only set on `overImage` entries. */
  why?: string;
}

export interface ContrastResult {
  checked: number;
  fails: ContrastEntry[];
  overImage: ContrastEntry[];
}

/**
 * Emulates `prefers-reduced-motion: reduce` before the page loads.
 *
 * `settle()` handles CSS animation, but /music-analytics animates with
 * framer-motion, which writes opacity to inline styles from JS — a CSS
 * `animation: none` override cannot stop it, and the probe caught 66 elements
 * frozen mid-fade at opacities like 0.21 and 0.89.
 *
 * Rather than fight it, this uses the page's own accessibility path: the route
 * wraps its panels in `<MotionConfig reducedMotion="user">`, so honouring the
 * preference skips the animation entirely. Measuring the reduced-motion render
 * is also the more useful measurement — it is what a real user with that
 * setting sees, and nothing else in the suite covers it.
 *
 * Must be called before `goto`: framer-motion reads the preference at mount.
 */
export async function preferReducedMotion(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: "reduce" });
}

/**
 * Freezes the reveal animation so the page can be measured in its settled
 * state. `.fade-up` is `opacity: 0` until an IntersectionObserver adds
 * `.visible`, so without this everything below the fold goes unmeasured and
 * anything mid-transition is mismeasured.
 */
export async function settle(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }
              .fade-up { opacity: 1 !important; transform: none !important; }`,
  });
  // The footer is the last thing in the shell; once it is attached the lazy
  // route chunk has mounted.
  await page.locator("footer").first().waitFor({ state: "attached", timeout: 20_000 });

  // Then wait for opacity to stop moving.
  //
  // framer-motion writes opacity to inline styles from JS, so the CSS override
  // above cannot stop it, and `prefers-reduced-motion` does not either —
  // framer-motion deliberately keeps opacity fades under `reducedMotion="user"`
  // because they are safe for vestibular disorders. The probe caught 66
  // elements frozen mid-fade at values like 0.21 and 0.89.
  //
  // Waiting for "no fractional opacity anywhere" would hang: several elements
  // are permanently translucent by design. So this waits for stability instead
  // — two identical samples in a row — which settles for both.
  await page.waitForFunction(
    () => {
      const sample = () =>
        [...document.querySelectorAll("body *")]
          .map((el) => getComputedStyle(el).opacity)
          .join(",");
      const w = window as unknown as { __lastOpacity?: string };
      const now = sample();
      const stable = w.__lastOpacity === now;
      w.__lastOpacity = now;
      return stable;
    },
    null,
    { timeout: 20_000, polling: 250 },
  );
}

/**
 * Runs the probe and asserts on it. `label` identifies the state being
 * measured — a route on its own, or a route plus the tab that was opened to
 * reach it.
 */
export async function expectReadable(
  page: Page,
  label: string,
  allowedZones: string[] = [],
): Promise<ContrastResult> {
  const result = (await page.evaluate(PROBE)) as ContrastResult;

  // A probe that measured nothing would pass forever.
  expect(result.checked, `${label} rendered no measurable text`).toBeGreaterThan(10);

  expect(
    result.fails,
    `${label}: ${result.fails.length} element(s) below WCAG AA`,
  ).toEqual([]);

  const unexplained = result.overImage.filter((entry) => !allowedZones.includes(entry.zone));
  expect(
    unexplained,
    `${label}: text sits on something this probe cannot measure, in a zone that ` +
      `is not documented in UNMEASURABLE_ZONES. Check it by eye, then either ` +
      `fix it or add the zone with the reason.`,
  ).toEqual([]);

  return result;
}
