import { test, expect, type Page } from "@playwright/test";

import { CAREER_TIMELINE, EDUCATION } from "../../src/content/cv";

/**
 * /cv — the CV renders from the shared content model, exports a real PDF, and
 * never leaks the phone number that was deliberately removed from the site.
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

test("cv page renders the verified timeline and education", async ({ page, baseURL }) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
  const errors = collectOwnOriginErrors(page, appOrigin);

  await page.goto("/cv");

  await expect(page.getByRole("heading", { name: "Zach Scheffler", level: 1 })).toBeVisible();

  // Every timeline role and every institution comes from the shared model.
  for (const entry of CAREER_TIMELINE) {
    await expect(page.getByText(entry.role, { exact: true }).first()).toBeVisible();
  }
  for (const entry of EDUCATION) {
    await expect(page.getByText(entry.institution, { exact: true }).first()).toBeVisible();
  }

  // The verified credential is stated; the stale one never appears.
  await expect(page.getByText("M.M. Music Production, Technology & Innovation").first()).toBeVisible();
  await expect(page.getByText(/Master of Arts/i)).toHaveCount(0);

  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("cv page never exposes a phone number", async ({ page }) => {
  await page.goto("/cv");
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  expect(body).not.toContain("510.435.6431");
  expect(body).not.toMatch(/(?:\+?\d{1,2}[\s.-])?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
});

test("download button generates a PDF", async ({ page }) => {
  await page.goto("/cv");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /download pdf/i }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("Zach-Scheffler-CV.pdf");
});
