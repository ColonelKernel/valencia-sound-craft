import { test, expect } from "@playwright/test";

/**
 * No page may scroll horizontally on a 375px phone.
 *
 * Regression guard: the footer's five social links sat in a non-wrapping flex
 * row with gap-6, needing ~395px. That overflowed every page of the site with
 * a horizontal scrollbar, because the footer renders on all routes.
 */

const ROUTES = ["/", "/cv", "/work", "/projects", "/groove-atlas", "/tools"];

test.use({ viewport: { width: 375, height: 812 } });

for (const route of ROUTES) {
  test(`no horizontal overflow at 375px on ${route}`, async ({ page }) => {
    await page.goto(route);
    // Let lazy route chunks and fade-in transitions settle.
    await page.waitForLoadState("networkidle");

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(
      scrollWidth,
      `${route} overflows by ${scrollWidth - clientWidth}px at 375px`,
    ).toBeLessThanOrEqual(clientWidth);
  });
}
