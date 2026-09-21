import { expect, test } from "@playwright/test";

/**
 * The positioning copy is the most consequential text on the site and, until
 * this file existed, the only text nothing asserted. Incidental strings were
 * pinned tightly while the H1, the location, and the contact form's categories
 * were free to drift back to a framing aimed at a different market.
 *
 * These assertions encode decisions, not phrasing. Each one can be satisfied by
 * many wordings; what they forbid is the specific regression.
 */

test("the homepage leads with the data identity and the right location", async ({ page }) => {
  await page.goto("/");

  // The identity a recruiter reads first.
  await expect(page.locator("h1").first()).toContainText("Data Scientist");

  // He lives in the Bay Area. Saying Valencia reads as sponsorship and a
  // nine-hour gap to anyone screening on location.
  await expect(page.locator("body")).toContainText("San Francisco Bay Area");
  await expect(page.locator("body")).not.toContainText("Based in Valencia");

  // The retired freelance framing.
  await expect(page.locator("body")).not.toContainText("Guitar Lessons");
});

test("evidence precedes the music on the homepage", async ({ page }) => {
  await page.goto("/");

  // Both sections are lazy, so wait for them to attach before comparing. The
  // first run of this test failed here rather than in the page, which is the
  // point: the assertion is about DOM order, not about load timing.
  const evidence = page.locator("#evidence");
  const portfolio = page.locator("#portfolio");
  await evidence.waitFor({ state: "attached" });
  await portfolio.waitFor({ state: "attached" });

  // A data reader who meets the EP player first has already filed this as a
  // musician's site. DOM order is the guarantee; CSS order is not.
  const evidenceIsFirst = await page.evaluate(() => {
    const a = document.getElementById("evidence");
    const b = document.getElementById("portfolio");
    if (!a || !b) return null;
    // Node.DOCUMENT_POSITION_FOLLOWING === 4: b comes after a.
    return Boolean(a.compareDocumentPosition(b) & 4);
  });

  expect(evidenceIsFirst).toBe(true);
});

test("the CV states what he is looking for", async ({ page }) => {
  await page.goto("/cv");

  // /cv listed history for a year and never named the ask, leaving the reader
  // to infer it from a hero on a different route.
  await expect(page.locator("body")).toContainText("Targeting data scientist");
  await expect(page.locator("body")).toContainText("San Francisco Bay Area");
});

const EVIDENCE_ROUTES = [
  "/tools/rhythm",
  "/tools/harmony",
  "/tools/circle",
  "/tools/tonnetz",
  "/groove-atlas",
];

for (const path of EVIDENCE_ROUTES) {
  test(`${path} explains how it is built`, async ({ page }) => {
    await page.goto(path);

    // Without this block every one of these routes reads as a toy: the
    // engineering behind them was written down only in source comments, which
    // a hiring reader never opens. The heading is owned by the layout, so
    // asserting it here also pins the heading level.
    const heading = page.getByRole("heading", { name: "How this is built", level: 2 });
    await expect(heading).toBeVisible();
  });
}

test("the session-state case study keeps the caveat on its own headline number", async ({ page }) => {
  await page.goto("/projects/session-state");

  // 99.3% is the most quotable figure in the portfolio and the most
  // misleading one without its qualifier: some taxonomy keywords were added
  // because benchmarking exposed them as misses on the same corpus. The
  // source file says so; this page must not quote the number and drop it.
  const body = page.locator("body");
  await expect(body).toContainText("99.3%");
  await expect(body).toContainText("in-sample");
  await expect(body).toContainText("not of held-out generalization");
});
