import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ROUTE_META } from "./routeMeta";

/**
 * The static shell (index.html, robots.txt, sitemap.xml) is hand-authored,
 * while the hydrated app reads ROUTE_META. Crawlers and social scrapers only
 * ever see the static side, so these tests pin the two together — a change
 * to either that forgets the other fails the suite instead of silently
 * shipping divergent metadata.
 */

const root = join(__dirname, "..", "..");
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const robotsTxt = readFileSync(join(root, "public", "robots.txt"), "utf8");
const sitemapXml = readFileSync(join(root, "public", "sitemap.xml"), "utf8");
const redirects = readFileSync(join(root, "public", "_redirects"), "utf8");

const SITE_ORIGIN = "https://zachscheffler.com";

const realPaths = Object.values(ROUTE_META)
  .map((route) => route.path)
  .filter((path) => path !== "*");

describe("static shell metadata stays in sync with ROUTE_META", () => {
  it("index.html <title> matches the home route title verbatim", () => {
    expect(indexHtml).toContain(`<title>${ROUTE_META.home.title}</title>`);
  });

  it("index.html description metas match the home route description", () => {
    const description = ROUTE_META.home.description;
    expect(indexHtml).toContain(`<meta name="description" content="${description}">`);
    expect(indexHtml).toContain(`<meta property="og:description" content="${description}">`);
    expect(indexHtml).toContain(`<meta name="twitter:description" content="${description}">`);
  });

  it("sitemap.xml lists exactly the real routes, each on the site origin", () => {
    const locs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
    const expected = realPaths.map((path) => (path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`));

    expect(locs.sort()).toEqual(expected.sort());
  });

  it("robots.txt advertises the sitemap on the same origin", () => {
    expect(robotsTxt).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  it("index.html carries the homepage canonical and site-identity metas", () => {
    expect(indexHtml).toContain(`<link rel="canonical" href="${SITE_ORIGIN}/">`);
    expect(indexHtml).toContain('<meta property="og:site_name" content="Zach Scheffler">');
    expect(indexHtml).toContain('<meta name="theme-color" content="#121212">');
  });

  it("_redirects has no SPA catch-all (unknown paths must 404 via 404.html)", () => {
    // The catch-all would shadow Netlify's automatic 404.html handling and
    // soft-404 every unknown URL as the homepage. stampRouteHeadsPlugin
    // generates explicit rewrites for every real route instead.
    expect(redirects).not.toMatch(/^\/\*\s/m);
  });
});
