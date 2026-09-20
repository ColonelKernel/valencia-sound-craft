#!/usr/bin/env node
/**
 * Generates the social card at public/og-image.png.
 *
 * WHY THIS EXISTS
 *
 * Until now every route on the site advertised the same photograph — Zach
 * busking with a classical guitar in a park, 25% of the frame black pillarbox
 * bars, captioned "playing guitar in Valencia, Spain". That is the image
 * LinkedIn, Slack and iMessage rendered when anyone shared the CV of someone
 * positioning as a data scientist in the Bay Area.
 *
 * A card is read at thumbnail size in a scrolling feed. Text survives that
 * scale; a photograph does not. So the card is typographic.
 *
 * WHY PLAYWRIGHT RATHER THAN A DRAWING LIBRARY
 *
 * The card has to use the site's real typefaces, or it is a different brand in
 * the one place most people see it first. Those are self-hosted variable fonts
 * (public/fonts/*.woff2). Rendering them correctly means a real text engine, and
 * Playwright is already a devDependency for the e2e suite — so this adds no new
 * dependency and guarantees the card is set in exactly the fonts the site uses.
 *
 * WHY A SCRIPT AND NOT A BUILD PLUGIN
 *
 * Generating during `vite build` would make every build — including Netlify's —
 * depend on a Chromium binary, to regenerate a file that changes only when the
 * headline changes. Instead the card is committed, and drift is caught by a
 * test: this script writes og-image.meta.json recording the exact strings it
 * rendered, and src/app/ogCard.test.ts asserts those still match ROUTE_META and
 * the CV constants. Change the headline without regenerating and the suite
 * fails, which is the same guarantee a build plugin would give.
 *
 *     npm run og-card
 */

import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// From @playwright/test, the declared devDependency, rather than from
// "playwright" — that package is only present transitively, so importing it
// directly works today and breaks on any install that hoists differently.
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(root, "public");

export const CARD = {
  width: 1200,
  height: 630,
  name: "Zach Scheffler",
  title: "Data Scientist & ML Engineer",
  location: "San Francisco Bay Area",
  availability: "Open to new roles",
  credentials: "World Bank · NORC at the University of Chicago · Rios Partners",
};

// Straight from src/index.css :root — kept in sync by ogCard.test.ts.
const TOKENS = {
  background: "#121212", // --background 0 0% 7%
  foreground: "#ebebeb", // --foreground 0 0% 92%
  muted: "#a3a3a3", // --muted-foreground 0 0% 64%
  border: "#2e2e2e", // --border 0 0% 18%
};

async function fontFace(family, file, weights) {
  const bytes = await readFile(join(PUBLIC, "fonts", file));
  return `@font-face{font-family:"${family}";font-weight:${weights};font-style:normal;src:url(data:font/woff2;base64,${bytes.toString("base64")}) format("woff2");}`;
}

function html(fonts) {
  return `<!doctype html><meta charset="utf-8"><style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${CARD.width}px;height:${CARD.height}px}
body{
  background:${TOKENS.background};
  color:${TOKENS.foreground};
  font-family:"DM Sans",system-ui,sans-serif;
  display:flex;flex-direction:column;justify-content:center;
  padding:0 88px;
  /* A single soft light from the upper left, so the card is not a flat
     rectangle at thumbnail size. Same dark ground as the site. */
  background-image:radial-gradient(900px 520px at 12% -12%, rgba(255,255,255,.07), transparent 70%);
}
.eyebrow{display:flex;align-items:center;gap:20px;margin-bottom:38px}
.where{font-size:19px;font-weight:500;letter-spacing:.34em;text-transform:uppercase;color:rgba(255,255,255,.6)}
.pill{display:inline-flex;align-items:center;gap:9px;border:1px solid rgba(110,231,183,.4);
  background:rgba(52,211,153,.1);color:#d1fae5;border-radius:999px;padding:7px 17px;font-size:17px;font-weight:500}
.dot{width:8px;height:8px;border-radius:999px;background:#34d399}
h1{font-family:"Space Grotesk",system-ui,sans-serif;font-size:96px;font-weight:700;line-height:1.02;letter-spacing:-.022em}
h2{font-family:"Space Grotesk",system-ui,sans-serif;font-size:53px;font-weight:500;line-height:1.15;
  letter-spacing:-.012em;color:rgba(255,255,255,.82);margin-top:18px}
hr{border:0;border-top:1px solid ${TOKENS.border};margin:44px 0 26px}
.cred{font-size:23px;line-height:1.45;color:${TOKENS.muted}}
</style>
<div class="eyebrow">
  <span class="where">${CARD.location}</span>
  <span class="pill"><span class="dot"></span>${CARD.availability}</span>
</div>
<h1>${CARD.name}</h1>
<h2>${CARD.title}</h2>
<hr>
<p class="cred">${CARD.credentials}</p>`;
}

async function main() {
  const fonts = [
    await fontFace("Space Grotesk", "SpaceGrotesk-Variable-latin.woff2", "300 700"),
    await fontFace("DM Sans", "DMSans-Variable-latin.woff2", "100 1000"),
  ].join("\n");

  // Same browser selection as playwright.config.ts:21 — the installed Google
  // Chrome locally, Playwright's own download in CI. Left to its default,
  // Playwright reaches for a chrome-headless-shell build that this machine has
  // never downloaded, because the e2e suite has always used the system Chrome.
  const browser = await chromium.launch({
    channel: process.env.CI ? undefined : "chrome",
  });
  try {
    const page = await browser.newPage({
      viewport: { width: CARD.width, height: CARD.height },
      deviceScaleFactor: 1,
    });
    await page.setContent(html(fonts), { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);

    const png = await page.screenshot({ type: "png" });
    await writeFile(join(PUBLIC, "og-image.png"), png);
    await writeFile(
      join(PUBLIC, "og-image.meta.json"),
      `${JSON.stringify({ ...CARD, generatedBy: "scripts/generate-og-card.mjs" }, null, 2)}\n`,
    );

    console.log(
      `wrote public/og-image.png (${CARD.width}x${CARD.height}, ${(png.length / 1024).toFixed(1)} KB)`,
    );
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
