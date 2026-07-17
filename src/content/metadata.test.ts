import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Spec 006 retargeted every crawler-facing URL to the research subdomain,
 * but nothing enforced it: the origin string is duplicated across
 * index.html (~20 occurrences), public/sitemap.xml, and public/robots.txt.
 * These tests pin all of them to one canonical origin and verify every
 * static asset the shell references actually ships in public/ — a future
 * origin edit or asset rename that forgets a copy fails the suite instead
 * of silently publishing divergent metadata.
 */

const root = join(__dirname, "..", "..");
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const robotsTxt = readFileSync(join(root, "public", "robots.txt"), "utf8");
const sitemapXml = readFileSync(join(root, "public", "sitemap.xml"), "utf8");
const manifest = JSON.parse(
  readFileSync(join(root, "public", "site.webmanifest"), "utf8"),
) as { icons?: Array<{ src: string }> };

const ORIGIN = "https://research.zachscheffler.com";

function attributeValues(html: string, pattern: RegExp): string[] {
  return [...html.matchAll(pattern)]
    .map((match) => match[1])
    .filter((value): value is string => typeof value === "string");
}

describe("canonical origin consistency", () => {
  it("the canonical link, sitemap loc, and robots Sitemap line share one origin", () => {
    expect(indexHtml).toContain(`<link rel="canonical" href="${ORIGIN}/" />`);
    expect(sitemapXml).toContain(`<loc>${ORIGIN}/</loc>`);
    expect(robotsTxt).toContain(`Sitemap: ${ORIGIN}/sitemap.xml`);
  });

  it("og:url, og:image, and twitter:image all use the canonical origin", () => {
    const urls = [
      ...attributeValues(indexHtml, /property="og:url"\s+content="([^"]+)"/g),
      ...attributeValues(indexHtml, /property="og:image"\s*content="([^"]+)"/g),
      ...attributeValues(indexHtml, /name="twitter:image"\s*content="([^"]+)"/g),
    ];

    expect(urls.length).toBeGreaterThanOrEqual(3);
    for (const url of urls) {
      expect(url.startsWith(`${ORIGIN}/`)).toBe(true);
    }
  });

  it("every absolute URL in the JSON-LD graph that points at the dossier uses the canonical origin", () => {
    const jsonLd = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(jsonLd).toBeTruthy();

    const selfUrls = [...jsonLd!.matchAll(/"(?:@id|url)":\s*"(https:\/\/[^"]+)"/g)]
      .map((match) => match[1])
      .filter((url): url is string => typeof url === "string")
      .filter((url) => !url.includes("github") && !url.includes("linkedin") && !url.includes("upf.edu"));

    expect(selfUrls.length).toBeGreaterThanOrEqual(3);
    for (const url of selfUrls) {
      expect(url.startsWith(ORIGIN)).toBe(true);
    }
  });
});

describe("referenced static assets exist in public/", () => {
  it("index.html root-relative link/script assets ship in public/", () => {
    const hrefs = attributeValues(indexHtml, /(?:href|src)="(\/[^"]+)"/g).filter(
      (href) => !href.startsWith("/src/"),
    );

    expect(hrefs.length).toBeGreaterThanOrEqual(4);
    for (const href of hrefs) {
      expect(existsSync(join(root, "public", href)), `missing public${href}`).toBe(true);
    }
  });

  it("site.webmanifest icons ship in public/", () => {
    const icons = manifest.icons ?? [];
    expect(icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of icons) {
      expect(existsSync(join(root, "public", icon.src)), `missing public${icon.src}`).toBe(true);
    }
  });
});
