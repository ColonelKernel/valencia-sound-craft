import { test, expect, type Page } from "@playwright/test";

import { PROJECTS } from "../../src/content/projects";

/**
 * /projects — every card from the content model renders with its links, and
 * in-app project links actually navigate.
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

test("projects page renders every card with working links", async ({ page, baseURL }) => {
  const appOrigin = new URL(baseURL ?? "http://127.0.0.1:4199").origin;
  const errors = collectOwnOriginErrors(page, appOrigin);

  await page.goto("/projects");

  await expect(page.getByRole("heading", { name: "Software I Build" })).toBeVisible();

  for (const project of PROJECTS) {
    await expect(page.getByRole("heading", { name: project.title, exact: true })).toBeVisible();
  }

  // External links open in new tabs with the exact verified URLs. A URL may
  // appear more than once on the page — the repo is both the "This Site" card's
  // source link and part of the page intro — so this asserts presence, not
  // uniqueness, and would otherwise trip Playwright's strict mode.
  const external = PROJECTS.flatMap((p) => p.links).filter((l) => !l.url.startsWith("/"));
  for (const link of external) {
    await expect(
      page.locator(`a[href="${link.url}"]`).first(),
      `no link on the page for ${link.url}`,
    ).toBeAttached();
  }

  // An in-app project link navigates client-side.
  await page.getByRole("link", { name: /open atlas/i }).click();
  await expect(page).toHaveURL(/\/groove-atlas$/);

  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("homepage teaser links to /projects", async ({ page }) => {
  await page.goto("/");
  const teaser = page.getByRole("link", { name: /all projects/i });
  await teaser.scrollIntoViewIfNeeded();
  await teaser.click();
  await expect(page).toHaveURL(/\/projects$/);
});
