import { expect, test } from "@playwright/test";

/**
 * The positioning copy is the most consequential text on the site and, until
 * this file existed, the only text nothing asserted. Incidental strings were
 * pinned tightly while the H1, the location, and the contact form's categories
 * were free to drift back to a framing aimed at a different market.
 *
 * The target is government, multilateral and non-profit research, plus the
 * consultancies that serve them, with transportation and urban development as
 * the specialism rather than the whole claim. Tests that used to pin an
 * evidence-before-music DOM order are gone because the music is gone from this
 * page; tests/e2e/work.spec.ts holds that it stayed gone.
 *
 * These assertions encode decisions, not phrasing. Each one can be satisfied by
 * many wordings; what they forbid is the specific regression.
 */

test("the homepage leads with the public-sector identity and the right location", async ({
  page,
}) => {
  await page.goto("/");

  // The identity a screener reads first. The sector leads because that is
  // where the seven years are — World Bank, USAID through NORC, CMS through
  // Rios — and because government, multilateral and non-profit postings screen
  // on "policy" and "public" before they screen on tooling.
  const h1 = page.locator("h1").first();
  await expect(h1).toContainText("Public Policy");
  await expect(h1).toContainText("Data Scientist");

  // The specialism survives the reframe rather than being replaced by it: the
  // UCLA M.P.P. is literally titled Transportation & Urban Development, and
  // the transit atlas is the largest artifact on the site. It sits below the
  // H1, not inside it.
  await expect(page.locator("main")).toContainText("Transportation");

  // He lives in the Bay Area. Saying Valencia reads as sponsorship and a
  // nine-hour gap to anyone screening on location.
  await expect(page.locator("body")).toContainText("San Francisco Bay Area");
  await expect(page.locator("body")).not.toContainText("Based in Valencia");

  // The retired freelance framing.
  await expect(page.locator("body")).not.toContainText("Guitar Lessons");
});

test("the first screenful names who commissioned the work", async ({ page }) => {
  await page.goto("/");

  // A hero that says "Data Scientist" and nothing else is indistinguishable
  // from every other one. The clients are the differentiator, and they are
  // verifiable — each maps to an entry in EXPERIENCE.
  const hero = page.locator("main").locator("section").first();
  await expect(hero).toContainText("World Bank");
  await expect(hero).toContainText("USAID");
});

test("the CV states what he is looking for", async ({ page }) => {
  await page.goto("/cv");

  // /cv listed history for a year and never named the ask, leaving the reader
  // to infer it from a hero on a different route.
  await expect(page.locator("body")).toContainText(
    "public and non-profit sectors",
  );
  await expect(page.locator("body")).toContainText("San Francisco Bay Area");
});

test("the CV indexes the work by client, not only by employer", async ({ page }) => {
  await page.goto("/cv");

  const body = page.locator("body");

  // Two of the three most relevant clients were reached through an
  // intermediary, so neither appears as a heading in the employer-grouped
  // Experience list. A screener scanning for federal or multilateral work saw
  // a consultancy and a research institute. Both must be findable by name.
  await expect(body).toContainText("Selected engagements");
  await expect(body).toContainText("USAID");
  await expect(body).toContainText("Centers for Medicare & Medicaid Services");
  await expect(body).toContainText("World Bank");

  // And the method, with its evidence attached — a research or evaluation
  // posting screens on this before it screens on tooling.
  await expect(page.getByRole("heading", { name: "Methods", level: 2 })).toBeVisible();
  await expect(body).toContainText("difference-in-differences");
});

test("the CV does not promote the student project to paid work", async ({ page }) => {
  await page.goto("/cv");

  // The Kyrgyz Republic hospital-financing analysis was a five-person Applied
  // Policy Project for the M.P.P. It is a real line and it stays — under
  // Education, where its provenance is legible. It must not appear among the
  // engagements, which are commissioned work.
  await expect(page.locator("body")).toContainText("Kyrgyz Republic");

  await expect(page.locator("#engagements")).not.toContainText("Kyrgyz");
});

test("the transportation evidence is on the homepage, not one click away", async ({ page }) => {
  await page.goto("/");

  // The atlas used to be reachable from here only through an Evidence card's
  // CTA. The specialism is transportation, and the largest artifact on the
  // site has to be visible as work rather than linked as a claim.
  await expect(
    page.locator("main").getByRole("link", { name: /transit atlas|case study/i }).first(),
  ).toBeVisible();
  await expect(page.locator("main")).toContainText("201");
});

const EVIDENCE_ROUTES = [
  "/tools/rhythm",
  "/tools/harmony",
  "/tools/circle",
  "/tools/tonnetz",
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
