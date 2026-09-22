import zlib from "node:zlib";

import { expect, type Page } from "@playwright/test";

/**
 * Contrast for SVG text, measured off real pixels.
 *
 * The DOM probe in contrastProbe.ts reads `getComputedStyle().fill` and walks
 * up for a backdrop. For HTML that is exact. For SVG it is not, and the gap is
 * not small: `/tools/circle` paints its wedges through SVG filters
 * (`filter="url(#tonic-glow)"`), and a filter can move the painted colour
 * arbitrarily far from the declared fill. Sampled off a screenshot, the tonic
 * wedge renders as rgb(119,233,254) where its fill says hsl(208 90% 62%).
 *
 * Reasoning about it from the DOM produced two different answers depending on
 * which heuristic was used — document order said one thing, hit-testing said
 * another — which is the signal to stop reasoning and go and look. Near-white
 * labels on those wedges measured 1.03:1 against the pixels actually on screen.
 *
 * So: hide every SVG label, take one screenshot, and read the backdrop straight
 * out of it. No heuristic, no assumption about paint order, filters and blend
 * modes included for free.
 */

interface Png {
  w: number;
  h: number;
  channels: number;
  data: Buffer;
}

/**
 * Minimal PNG decoder — zlib only, no dependency.
 *
 * Playwright screenshots are 8-bit, non-interlaced RGB or RGBA, which is the
 * subset handled here; anything else throws rather than returning wrong
 * numbers. `assertDecoderSane` below checks it against a known pixel on every
 * run, because a silently wrong decoder would turn this file into a generator
 * of false findings.
 */
function decodePng(buf: Buffer): Png {
  let p = 8;
  let w = 0;
  let h = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const idat: Buffer[] = [];

  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const type = buf.toString("ascii", p + 4, p + 8);
    const data = buf.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === "IDAT") {
      idat.push(data);
    } else if (type === "IEND") {
      break;
    }
    p += 12 + len;
  }

  if (bitDepth !== 8) throw new Error(`unsupported PNG bit depth ${bitDepth}`);
  if (interlace !== 0) throw new Error("interlaced PNG is not supported");
  const channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[colorType];
  if (!channels) throw new Error(`unsupported PNG colour type ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * channels;
  const out = Buffer.alloc(h * stride);
  let pos = 0;

  for (let y = 0; y < h; y += 1) {
    const filter = raw[pos];
    pos += 1;
    const line = raw.subarray(pos, pos + stride);
    pos += stride;
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : Buffer.alloc(stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);

    for (let i = 0; i < stride; i += 1) {
      const a = i >= channels ? cur[i - channels] : 0;
      const b = prev[i];
      const c = i >= channels ? prev[i - channels] : 0;
      const x = line[i];
      let v: number;
      if (filter === 0) v = x;
      else if (filter === 1) v = x + a;
      else if (filter === 2) v = x + b;
      else if (filter === 3) v = x + ((a + b) >> 1);
      else if (filter === 4) {
        const pa = Math.abs(b - c);
        const pb = Math.abs(a - c);
        const pc = Math.abs(a + b - 2 * c);
        v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
      } else {
        throw new Error(`unknown PNG filter ${filter}`);
      }
      cur[i] = v & 0xff;
    }
  }

  return { w, h, channels, data: out };
}

type Rgb = [number, number, number];

const lin = (v: number) => {
  const n = v / 255;
  return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
};
const luminance = (c: Rgb) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

function ratio(a: Rgb, b: Rgb): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function pixel(img: Png, x: number, y: number): Rgb {
  const px = Math.min(img.w - 1, Math.max(0, Math.round(x)));
  const py = Math.min(img.h - 1, Math.max(0, Math.round(y)));
  const i = (py * img.w + px) * img.channels;
  return [img.data[i], img.data[i + 1], img.data[i + 2]];
}

function parseColor(css: string): { rgb: Rgb; alpha: number } {
  const m = css.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  return { rgb: [m[0], m[1], m[2]], alpha: m.length > 3 ? m[3] : 1 };
}

const composite = (fg: Rgb, alpha: number, bg: Rgb): Rgb => [
  alpha * fg[0] + (1 - alpha) * bg[0],
  alpha * fg[1] + (1 - alpha) * bg[1],
  alpha * fg[2] + (1 - alpha) * bg[2],
];

interface SvgLabel {
  text: string;
  fill: string;
  size: number;
  bold: boolean;
  x: number;
  y: number;
}

/**
 * Measures every SVG label on the page and asserts it clears WCAG AA.
 *
 * Call after the page has settled. Measures the whole document, not just the
 * viewport: an earlier version filtered to on-screen labels and silently
 * skipped the circle-of-fifths wheel, which sits below the fold at the default
 * test height and was carrying the worst contrast on the site. Only labels too
 * small to sample are skipped.
 */
export async function expectSvgTextReadable(page: Page, label: string): Promise<number> {
  const labels: SvgLabel[] = await page.evaluate(() => {
    const out: SvgLabel[] = [];
    for (const node of document.querySelectorAll("svg text")) {
      const r = node.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cs = getComputedStyle(node);
      if (cs.visibility === "hidden" || cs.display === "none") continue;
      if (node.closest("[aria-hidden='true']")) continue;
      const fill = cs.fill;
      if (!fill || fill === "none") continue;
      out.push({
        text: (node.textContent ?? "").trim().slice(0, 24),
        fill,
        size: parseFloat(cs.fontSize),
        bold: parseInt(cs.fontWeight, 10) >= 700,
        // Document coordinates, to match the full-page screenshot below.
        // Viewport coordinates silently skipped everything under the fold —
        // and the circle-of-fifths wheel, which is where the worst contrast
        // bug on this site lived, sits well below it at the default height.
        x: r.left + scrollX + r.width / 2,
        y: r.top + scrollY + r.height / 2,
      });
    }
    return out;
  });

  if (labels.length === 0) return 0;

  // One full-page screenshot with every SVG label hidden: each label's centre
  // pixel is then exactly the backdrop it is drawn on, filters and all.
  // Full-page rather than viewport, so nothing below the fold goes unchecked.
  const hide = await page.addStyleTag({ content: "svg text { visibility: hidden !important; }" });
  const shot = await page.screenshot({ fullPage: true });
  await hide.evaluate((node) => node.remove());

  const img = decodePng(shot);
  // Screenshots come back in device pixels; map CSS pixels onto them rather
  // than assuming a scale factor of 1.
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const scale = pageWidth ? img.w / pageWidth : 1;

  // A decoder that silently produced garbage would invent failures all day.
  // The page background is a known value, so check one pixel of it first.
  const declaredBackground = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  );
  const sampled = pixel(img, img.w / 2, 2);
  const expectedBg = parseColor(declaredBackground).rgb;
  const drift = Math.max(...sampled.map((v, i) => Math.abs(v - expectedBg[i])));
  expect(
    drift,
    `${label}: PNG decode looks wrong — sampled rgb(${sampled}) at the top of the ` +
      `page where CSS says ${declaredBackground}. Not reporting contrast from this.`,
  ).toBeLessThanOrEqual(6);

  const fails = labels
    .map((entry) => {
      const bg = pixel(img, entry.x * scale, entry.y * scale);
      const { rgb, alpha } = parseColor(entry.fill);
      const fg = composite(rgb, alpha, bg);
      const need = entry.size >= 24 || (entry.size >= 18.66 && entry.bold) ? 3.0 : 4.5;
      return { ...entry, bg: `rgb(${bg})`, ratio: +ratio(fg, bg).toFixed(2), need };
    })
    .filter((entry) => entry.ratio < entry.need);

  expect(
    fails,
    `${label}: ${fails.length} SVG label(s) below WCAG AA, measured off real ` +
      `pixels. The declared fill is not what gets painted when an SVG filter ` +
      `is involved, so trust these numbers over the CSS.`,
  ).toEqual([]);

  return labels.length;
}
