import { test, expect, type Page } from "@playwright/test";

import { GLOBAL_PULSE, WORK_EMBEDS } from "../../src/content/work";

/**
 * /work — the dedicated music & video page. It must show the real, labeled
 * work: no generic "YouTube"/"Spotify" placeholders, no collapse toggle, and
 * no third-party iframe until a facade is clicked.
 *
 * The homepage used to render a two-embed teaser of this page. It does not any
 * more, and the second test here is what holds that: aimed at government,
 * multilateral and non-profit research, a homepage that plays records invites
 * "why are you applying here?" before the World Bank line is read. The music
 * is evidence on its own route, not part of the argument the homepage makes.
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

test("the homepage does not play music", async ({ page }) => {
  await page.goto("/");

  // Every section on the homepage is lazy, so an empty result here is only
  // meaningful once the page has actually finished assembling. Contact is the
  // last section in the tree; waiting on it means the whole page mounted.
  await page.locator("#contact").waitFor({ state: "attached", timeout: 15_000 });

  // No embed facades, and therefore no path to a third-party player.
  await expect(page.getByRole("button", { name: /^Load .* player$/ })).toHaveCount(0);
  await expect(page.locator("main iframe")).toHaveCount(0);

  // The EP is not here either — it had its own AudioPlaylist below the grid.
  await expect(page.locator("main")).not.toContainText(GLOBAL_PULSE.title);

  // But it is still one click away, and still reachable from this page. This
  // is a demotion, not a deletion: dropping the link would strand /work.
  await expect(page.locator("main").getByRole("link", { name: /own page/i })).toHaveAttribute(
    "href",
    "/work",
  );
});
