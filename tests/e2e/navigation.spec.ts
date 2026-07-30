import { test, expect, type Page } from "@playwright/test";

import { ROUTE_META } from "../../src/app/routeMeta";

/**
 * Client-side navigation sweep: reach every route through in-app links
 * (Navbar + the "Tool navigation" subnav), asserting the manifest-driven
 * document title on each stop and zero own-origin console errors across
 * the whole journey. Deep-load coverage of every route lives in
 * console-clean.spec.ts; this suite covers the transitions.
 */

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

function collectErrors(page: Page, appOrigin: string): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    if (isThirdPartyOrigin(message.location().url, appOrigin)) {
      return;
    }
    errors.push(message.text());
  });

  page.on("pageerror", (error) => {
    errors.push(String(error));
  });

  return errors;
}

const toolNav = (page: Page) => page.getByRole("navigation", { name: "Tool navigation" });

test("navbar navigation reaches work, groove atlas, analytics, and home with manifest titles", async ({
  page,
  baseURL,
}) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
  const errors = collectErrors(page, appOrigin);

  await page.goto("/");
  await expect(page).toHaveTitle(ROUTE_META.home.title);

  await page.getByRole("link", { name: "Work", exact: true }).first().click();
  await expect(page).toHaveURL(/\/work$/);
  await expect(page).toHaveTitle(ROUTE_META.work.title, { timeout: 15_000 });

  await page.getByRole("link", { name: "Projects", exact: true }).first().click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page).toHaveTitle(ROUTE_META.projects.title, { timeout: 15_000 });

  await page.getByRole("link", { name: "Groove Atlas" }).first().click();
  await expect(page).toHaveURL(/\/groove-atlas$/);
  await expect(page).toHaveTitle(ROUTE_META.grooveAtlas.title, { timeout: 15_000 });

  await page.getByRole("link", { name: "CV", exact: true }).first().click();
  await expect(page).toHaveURL(/\/cv$/);
  await expect(page).toHaveTitle(ROUTE_META.cv.title, { timeout: 15_000 });

  await page.getByRole("link", { name: "Analytics" }).first().click();
  await expect(page).toHaveURL(/\/music-analytics$/);
  await expect(page).toHaveTitle(ROUTE_META.musicAnalytics.title, { timeout: 15_000 });

  await page.getByRole("link", { name: "ZS", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${appOrigin}/$`));
  await expect(page).toHaveTitle(ROUTE_META.home.title);

  expect(errors).toEqual([]);
});

test("resets scroll to the top on client-side navigation", async ({ page }) => {
  await page.goto("/tools/rhythm");
  await expect(page).toHaveTitle(ROUTE_META.rhythm.title, { timeout: 15_000 });

  // Scroll to the bottom, re-issuing the scroll on every poll tick: the
  // stamped shell satisfies toHaveTitle before hydration, and the lazy engine
  // workspace (map Suspense-deferred inside it) grows the page over the next
  // ~700ms — a single scrollTo would clamp against the short pre-mount page
  // and stick there. Once the route is tall, the poll crosses 300 and we know
  // the page is genuinely scrolled down.
  await expect
    .poll(async () => {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      return page.evaluate(() => window.scrollY);
    }, { timeout: 15_000 })
    .toBeGreaterThan(300);

  await toolNav(page).getByRole("link", { name: "Harmony", exact: true }).click();
  await expect(page).toHaveURL(/\/tools\/harmony$/);

  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("tool subnav navigates across every tool with manifest titles", async ({ page, baseURL }) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
  const errors = collectErrors(page, appOrigin);

  await page.goto("/tools");
  await expect(page).toHaveTitle(ROUTE_META.toolsIndex.title, { timeout: 15_000 });

  const stops = [
    { link: "Rhythm", key: "rhythm" },
    { link: "Harmony", key: "harmony" },
    { link: "Map", key: "map" },
    { link: "Circle", key: "circle" },
    { link: "Tonnetz", key: "tonnetz" },
    { link: "Overview", key: "toolsIndex" },
  ] as const;

  for (const stop of stops) {
    await toolNav(page).getByRole("link", { name: stop.link, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${ROUTE_META[stop.key].path.replace(/\//g, "\\/")}$`));
    await expect(page).toHaveTitle(ROUTE_META[stop.key].title, { timeout: 15_000 });
  }

  expect(errors).toEqual([]);
});
