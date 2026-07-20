import { test, expect, type Page } from "@playwright/test";

/**
 * Groove Lab (/groove-intelligence) — the restored full desktop lab and the
 * mobile atlas variant.
 *
 * Desktop (default 1280×720 viewport ≥ 1024px): canvas field with view modes,
 * sculptor, and the DNA panel. The AI-narrative fetch is gated off under
 * navigator.webdriver, so "Narrative unavailable" is the deterministic state.
 * Mobile (375×812): list-based atlas, no canvas field.
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

test.describe("desktop lab", () => {
  test("field, view modes, sculptor, and narrative render cleanly", async ({ page, baseURL }) => {
    const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
    const errors = collectOwnOriginErrors(page, appOrigin);

    await page.goto("/groove-intelligence");

    // Canvas field present with its accessible name.
    await expect(page.getByRole("img", { name: /groove field map/i })).toBeVisible();

    // View modes switch without errors.
    for (const mode of ["Topology", "Landscape", "Field"]) {
      await page.getByRole("button", { name: mode, exact: true }).click();
    }

    // Sculptor toggle reveals the four sliders.
    await page.getByRole("button", { name: /shape a groove/i }).click();
    await expect(page.locator('input[type="range"]')).toHaveCount(4);
    // Toggle back off so a groove can be selected again.
    await page.getByRole("button", { name: /shape a groove/i }).click();

    // Selecting from the keyboard-accessible list populates the DNA panel.
    await page.getByRole("option").first().click();
    await expect(page.getByText("Step Pattern", { exact: true })).toBeVisible();
    await expect(page.getByText("Nearest in Feel Space")).toBeVisible();

    // Deterministic narrative state under automation (webdriver gate).
    await expect(page.getByText("Narrative unavailable")).toBeVisible({ timeout: 5000 });

    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});

test.describe("mobile atlas", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("list-based atlas with no canvas field", async ({ page, baseURL }) => {
    const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
    const errors = collectOwnOriginErrors(page, appOrigin);

    await page.goto("/groove-intelligence");

    await expect(page.getByRole("heading", { name: /sampled grooves/i })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);

    // Tapping a groove card updates the DNA panel.
    const cards = page.locator("main button.w-full");
    await cards.nth(1).click();
    await expect(page.getByText("Step Pattern", { exact: true })).toBeVisible();

    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});
