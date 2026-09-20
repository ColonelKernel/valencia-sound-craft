import { test, expect } from "@playwright/test";

/**
 * The CV is the conversion target. It has to be reachable from the work.
 *
 * Before this suite, six of sixteen routes could not reach it by any link:
 * the navbar swaps the whole site nav for a subnav on /tools* and
 * /music-analytics, and the five tool pages contain no internal link of their
 * own. Three of the four case studies had their last link in the header, so a
 * reader who finished four hundred lines of method had nowhere to go.
 *
 * These walk the path rather than asserting a selector exists, because a link
 * that renders and 404s passes the second and fails the first.
 */

const CASE_STUDIES = [
  "/projects/autoharm",
  "/projects/catalog-intelligence",
  "/projects/transit-atlas",
  "/projects/session-state",
];

const WALLED_GARDEN = ["/tools", "/tools/circle", "/tools/rhythm", "/music-analytics"];

for (const path of WALLED_GARDEN) {
  test(`the CV is one click from ${path}`, async ({ page }) => {
    await page.goto(path);
    // Scoped to the nav: the CV link must be in the chrome that replaced the
    // site nav, not somewhere in the page body that a tool route may not have.
    await page.locator("nav").getByRole("link", { name: "CV", exact: true }).click();
    await expect(page).toHaveURL(/\/cv$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

for (const path of CASE_STUDIES) {
  test(`${path} ends with a way forward, not a wall`, async ({ page }) => {
    await page.goto(path);

    const footer = page.getByText("Next case study");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();

    // The next study must be a different one — the wrap-around must not point
    // a page at itself.
    const next = page.locator("a", { has: page.getByText("Next case study") });
    await expect(next).not.toHaveAttribute("href", path);

    await page.getByRole("link", { name: "CV", exact: true }).last().click();
    await expect(page).toHaveURL(/\/cv$/);
  });
}

test("the CV points back at the work it claims", async ({ page }) => {
  await page.goto("/cv");

  // Each skills chip's evidence used to exist only in a code comment.
  const evidence = page.getByText("Where these are demonstrated");
  await expect(evidence).toBeVisible();

  await page.getByRole("link", { name: "catalog intelligence" }).click();
  await expect(page).toHaveURL(/\/projects\/catalog-intelligence$/);
});

test("the groove atlas is no longer a dead end", async ({ page }) => {
  await page.goto("/groove-atlas");
  await page.getByRole("link", { name: "Other projects" }).click();
  await expect(page).toHaveURL(/\/projects$/);
});
