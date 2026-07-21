import { test, expect, type Page } from "@playwright/test";

/**
 * Groove Atlas (/groove-atlas) — the World Atlas lens: Leaflet map hero,
 * tradition panel with real citations, and the lens switcher. The Feel-Space
 * lens has its own spec (groove-lab.spec.ts).
 */

function collectOwnOriginErrors(page: Page, appOrigin: string): string[] {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const sourceUrl = message.location().url;
    try {
      if (sourceUrl && new URL(sourceUrl).origin !== appOrigin) return;
    } catch {
      // keep — unparseable source counts as own-origin
    }
    errors.push(`[console.error] ${message.text()} (${sourceUrl || "no source"})`);
  });

  page.on("pageerror", (error) => {
    errors.push(`[pageerror] ${error.message}`);
  });

  return errors;
}

test("world atlas lens: map, tradition panel with citations, lens toggle", async ({
  page,
  baseURL,
}) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
  const errors = collectOwnOriginErrors(page, appOrigin);

  await page.goto("/groove-atlas");

  // World Atlas is the default lens: the Leaflet map renders.
  await expect(page.getByRole("button", { name: "World Atlas" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".leaflet-container")).toBeVisible();

  // Default tradition panel (Cuba → Son Clave) with metadata and citations.
  await expect(page.getByRole("heading", { name: "Son Clave" })).toBeVisible();
  await expect(page.getByText("Documented tradition", { exact: false })).toBeVisible();
  await expect(page.getByText("Sources", { exact: true })).toBeVisible();
  const citationLinks = page.locator('a[href^="https://"]', {
    has: page.locator("svg"),
  });
  await expect(citationLinks.first()).toBeVisible();

  // Lens toggle swaps to the feel-space lab and back.
  await page.getByRole("button", { name: "Feel-Space" }).click();
  await expect(page.getByRole("img", { name: /groove field map/i })).toBeVisible();
  await expect(page.locator(".leaflet-container")).toHaveCount(0);

  await page.getByRole("button", { name: "World Atlas" }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();

  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("legacy /groove-intelligence path redirects to /groove-atlas", async ({ page }) => {
  await page.goto("/groove-intelligence");
  await expect(page).toHaveURL(/\/groove-atlas$/);
  await expect(page.getByRole("button", { name: "World Atlas" })).toBeVisible();
});
