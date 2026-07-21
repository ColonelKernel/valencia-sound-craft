import { test, expect, type Page } from "@playwright/test";

import { GLOBAL_PULSE, WORK_EMBEDS } from "../../src/content/work";

/**
 * /work — the dedicated music & video page, plus the homepage Work section
 * that feeds from the same content model. Both must show the real, labeled
 * work (no generic "YouTube"/"Spotify" placeholders, no collapse toggle).
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

test("work page shows every labeled embed and the full EP credits", async ({ page, baseURL }) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
  const errors = collectOwnOriginErrors(page, appOrigin);

  await page.goto("/work");

  await expect(page.getByRole("heading", { name: "Music & Video" })).toBeVisible();

  // Every embed renders as a click-to-load facade under its real title;
  // clicking one swaps in the real third-party iframe.
  for (const embed of WORK_EMBEDS) {
    await expect(page.getByRole("button", { name: `Load ${embed.title} player` })).toBeAttached();
  }
  const first = WORK_EMBEDS[0];
  await page.getByRole("button", { name: `Load ${first.title} player` }).click();
  await expect(page.locator(`iframe[title="${first.title}"]`)).toBeAttached();

  // The EP section lists all five tracks with credits.
  await expect(page.getByRole("heading", { name: GLOBAL_PULSE.title, exact: true })).toBeVisible();
  for (const track of GLOBAL_PULSE.tracks) {
    await expect(page.getByText(track.credits)).toBeVisible();
  }

  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("homepage work section is always expanded with real labels and a link to /work", async ({
  page,
  baseURL,
}) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
  const errors = collectOwnOriginErrors(page, appOrigin);

  await page.goto("/");

  const section = page.locator("#portfolio");
  await section.scrollIntoViewIfNeeded();

  // No collapse toggle: every embed facade is simply present — and no
  // third-party iframe loads until a facade is clicked (mobile perf contract).
  await expect(section.getByRole("button", { name: /^Load .* player$/ })).toHaveCount(
    WORK_EMBEDS.length,
  );
  await expect(section.locator("iframe")).toHaveCount(0);

  await section.getByRole("link", { name: /see all work/i }).click();
  await expect(page).toHaveURL(/\/work$/);

  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});
