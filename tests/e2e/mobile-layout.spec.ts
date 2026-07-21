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

/**
 * The navbar must stay one row at every width.
 *
 * Regression guard: the desktop nav used to appear at md (768px). With ten
 * items plus social icons it was too tight there, and "Groove Atlas" wrapped
 * onto a second line. It now switches at lg, so 768–1023px gets the menu
 * button instead.
 */
const NAV_WIDTHS = [768, 900, 1023, 1024, 1280, 1440];

for (const width of NAV_WIDTHS) {
  test(`navbar stays a single row at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/cv");
    await page.waitForLoadState("networkidle");

    const nav = page.locator("nav").first();
    const box = await nav.boundingBox();
    expect(box, "navbar should render").not.toBeNull();
    // One row is the h-16 bar (64px) plus the 1px bottom border.
    expect(box!.height, `navbar wrapped to multiple rows at ${width}px`).toBeLessThanOrEqual(72);

    // Below lg the menu button drives navigation; at/above it the links show.
    const menuButton = page.getByRole("button", { name: "Toggle menu" });
    const cvLink = page.getByRole("link", { name: "CV", exact: true });
    if (width >= 1024) {
      await expect(cvLink.first()).toBeVisible();
      await expect(menuButton).toBeHidden();
    } else {
      await expect(menuButton).toBeVisible();
    }
  });
}
