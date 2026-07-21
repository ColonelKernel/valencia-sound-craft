import { test, expect } from "@playwright/test";

/**
 * Every route must load without console errors or uncaught page errors.
 *
 * The only filter applied: console messages whose source location is a
 * third-party origin (e.g. leaflet tile CDNs on the map route) are ignored,
 * because network availability of external hosts is not this app's contract.
 * Everything originating from the app's own origin (or with no source
 * location, e.g. uncaught exceptions) must be clean.
 */

const ROUTES = [
  "/",
  "/tools",
  "/tools/rhythm",
  "/tools/harmony",
  "/tools/map",
  "/tools/circle",
  "/tools/tonnetz",
  "/music-analytics",
  "/groove-intelligence",
  "/work",
  "/definitely-missing-404",
];

function isThirdPartyOrigin(sourceUrl: string, appOrigin: string): boolean {
  if (!sourceUrl) {
    return false;
  }

  try {
    return new URL(sourceUrl).origin !== appOrigin;
  } catch {
    return false;
  }
}

for (const route of ROUTES) {
  test(`no console errors on ${route}`, async ({ page, baseURL }) => {
    const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
    const errors: string[] = [];

    page.on("console", (message) => {
      if (message.type() !== "error") {
        return;
      }

      const sourceUrl = message.location().url;

      if (isThirdPartyOrigin(sourceUrl, appOrigin)) {
        return;
      }

      errors.push(`[console.error] ${message.text()} (${sourceUrl || "no source"})`);
    });

    page.on("pageerror", (error) => {
      errors.push(`[pageerror] ${error.message}`);
    });

    await page.goto(route);
    await page.waitForTimeout(2000);

    expect(errors).toEqual([]);
  });
}
