import { test, expect } from "@playwright/test";

/**
 * /music-analytics — the route the navbar and the homepage Intelligence band
 * both funnel into.
 *
 * Its only coverage used to be a console-clean smoke and a title check, which
 * a page rendering seven empty charts passes comfortably. These assert that
 * the dashboard actually resolves its dataset and puts numbers on screen, that
 * a second tab mounts its own lazy chunk without the first one's charts
 * breaking, and that the page is no longer a dead end.
 */

/** Formatted metrics look like 1.5K / 2.4M / $3.0K — never a bare 0 or NaN. */
const FORMATTED_METRIC = /\$?\d+(\.\d+)?[KMB]?$/;

test("overview renders real values from the dataset, not empty chart frames", async ({
  page,
}) => {
  await page.goto("/music-analytics");

  // The page fetches and parses a CSV before anything can render. Wait on the
  // skeleton's aria-busy rather than on placeholder text: a text wait silently
  // becomes a no-op the moment the copy changes, which is exactly what
  // happened when "Loading…" was replaced by DashboardSkeleton.
  await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });

  // The artist filter is populated from the parsed data, so a real option
  // beyond the "All Artists" placeholder proves the CSV resolved.
  const artistFilter = page.getByLabel("Filter by artist");
  await expect(artistFilter).toBeVisible();
  await expect
    .poll(async () => (await artistFilter.locator("option").count()), { timeout: 20_000 })
    .toBeGreaterThan(1);

  // Recharts draws into SVG; an empty dashboard still renders the frame, so
  // assert on plotted geometry rather than on the container existing.
  await expect(page.locator("svg.recharts-surface").first()).toBeVisible({ timeout: 20_000 });
  await expect
    .poll(async () => page.locator(".recharts-layer path, .recharts-layer rect").count(), {
      timeout: 20_000,
    })
    .toBeGreaterThan(0);
});

test("acquisition tab computes a score with its four components", async ({ page }) => {
  await page.goto("/music-analytics");
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });

  await page.getByRole("button", { name: "Acquisition" }).click();

  // Each label is one of the four documented cuts of the weighted score.
  const verdict = page
    .getByText(/Strong Acquisition|Promising|Hold|High Risk/)
    .first();
  await expect(verdict).toBeVisible({ timeout: 20_000 });

  // The components are shown beside the score on purpose — the case study
  // argues a bare number invites trust where a breakdown invites argument.
  for (const component of ["Growth", "Stability", "Longevity", "Momentum"]) {
    await expect(page.getByText(component, { exact: false }).first()).toBeVisible();
  }
});

test("the streams/revenue toggle changes the numbers on screen", async ({ page }) => {
  await page.goto("/music-analytics");
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0, { timeout: 20_000 });

  const metric = page.locator("text=/^\\$?\\d+(\\.\\d+)?[KMB]$/").first();
  await expect(metric).toBeVisible({ timeout: 20_000 });
  const asStreams = (await metric.textContent())?.trim() ?? "";
  expect(asStreams).toMatch(FORMATTED_METRIC);
  expect(asStreams).not.toContain("$");

  await page.getByRole("button", { name: "Revenue", exact: true }).click();

  // Revenue is streams * $0.003, so the same figure must both change and
  // acquire a currency marker.
  await expect
    .poll(async () => (await metric.textContent())?.trim() ?? "", { timeout: 10_000 })
    .not.toBe(asStreams);
  await expect(page.locator("text=/^\\$\\d/").first()).toBeVisible();
});

test("the dashboard explains its method and links to the case study", async ({ page }) => {
  await page.goto("/music-analytics");

  const method = page.getByRole("heading", { name: "How this works" });
  await expect(method).toBeVisible();

  // The three numbers this copy commits to are the ones pinned by
  // src/lib/catalogAnalytics.test.ts.
  const section = page.locator("section", { has: method });
  await expect(section).toContainText("growth 0.30, stability 0.30, longevity 0.20, momentum 0.20");
  await expect(section).toContainText("half the median of the preceding six");
  await expect(section).toContainText("popularity");

  // The route used to carry no outward link at all.
  const caseStudy = page.getByRole("link", { name: "Read the full case study" });
  await expect(caseStudy).toBeVisible();
  await caseStudy.click();
  await expect(page).toHaveURL(/\/projects\/catalog-intelligence$/);
  await expect(
    page.getByRole("heading", { name: "The bug that shaped the metrics" }),
  ).toBeVisible();
});
