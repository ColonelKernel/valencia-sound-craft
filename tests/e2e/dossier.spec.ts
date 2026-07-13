import { expect, test } from "@playwright/test";

const retiredRoutes = [
  "/tools",
  "/music-analytics",
  "/music-intelligence",
  "/transit-synth",
  "/groove-intelligence",
];

test("presents the research dossier and its primary evidence", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Interpretable DAW State for Intelligent Music Production.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Explore the research" })).toHaveAttribute(
    "href",
    "#research",
  );
  await expect(page.getByRole("heading", { level: 2, name: /Session State Analyzer/i })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Improspira / Improv Partner" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: /AutoHarm \/ Autoharmonizer/i }),
  ).toBeVisible();

  const github = page.getByRole("link", { name: /^GitHub$/ }).first();
  const linkedIn = page.getByRole("link", { name: /^LinkedIn$/ }).first();
  await expect(github).toHaveAttribute("href", /^https:\/\/github\.com\/ColonelKernel\/?$/);
  await expect(linkedIn).toHaveAttribute("href", /^https:\/\/(www\.)?linkedin\.com\/in\/zscheff\/?$/);
});

test("supports in-page navigation and keyboard focus", async ({ page }) => {
  await page.goto("/");

  const researchLink = page.getByRole("link", { name: "Explore the research" });
  await researchLink.focus();
  await expect(researchLink).toBeFocused();
  await expect
    .poll(() =>
      researchLink.evaluate((element) => {
        const style = getComputedStyle(element);
        return style.outlineStyle !== "none" || style.boxShadow !== "none";
      }),
    )
    .toBe(true);

  await researchLink.press("Enter");
  await expect(page).toHaveURL(/#research$/);
  await expect(page.locator("#research")).toBeVisible();
});

test("resolves direct section links after the client app mounts", async ({ page }) => {
  await page.goto("/#projects");
  const projects = page.locator("#projects");
  await expect(projects).toBeInViewport();
  await expect(page).toHaveURL(/#projects$/);
});

test("opens and closes the mobile navigation without obscuring the page", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const menu = page.locator("#mobile-navigation");
  await expect(menu).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(menu).toBeVisible();
  await menu.getByRole("link", { name: "Research" }).click();
  await expect(menu).toBeHidden();
  await expect(page).toHaveURL(/#research$/);
});

test("remains usable without horizontal overflow at key viewport widths", async ({ page }) => {
  for (const width of [375, 768, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  }
});

test("honors reduced-motion preferences", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const movingElements = await page.locator("body *").evaluateAll((elements) =>
    elements.filter((element) => {
      const style = getComputedStyle(element);
      const seconds = (value: string) =>
        value.split(",").some((part) => Number.parseFloat(part) > 0.01);
      return seconds(style.animationDuration) || seconds(style.transitionDuration);
    }).length,
  );
  expect(movingElements).toBe(0);
});

test("bridges case studies to a proposed research trajectory", async ({ page }) => {
  await page.goto("/");

  const trajectory = page.locator("#trajectory");
  await expect(trajectory).toBeAttached();
  await expect(trajectory.locator("h2")).toContainText(/research trajectory|research/i);

  const trajectoryText = await trajectory.innerText();
  expect(trajectoryText).toContain("acoustic outcomes");
  expect(trajectoryText).toContain("creativity-supporting");

  const sectionOrder = await page.evaluate(() => {
    const ids = ["projects", "trajectory", "background"];
    return ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? -1);
  });
  expect(sectionOrder[0]).toBeLessThan(sectionOrder[1]);
  expect(sectionOrder[1]).toBeLessThan(sectionOrder[2]);

  await page.getByRole("link", { name: "Trajectory" }).first().click();
  await expect(page).toHaveURL(/#trajectory$/);
  await expect(trajectory).toBeInViewport();
});

test("does not expose retired portfolio behavior or private paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("form")).toHaveCount(0);

  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\/Volumes\//);
  expect(body).not.toMatch(/\/Users\//);
  expect(body).not.toMatch(/Spotify|WhatsApp|guitar lessons|mixing services/i);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

for (const route of retiredRoutes) {
  test(`renders the dossier 404 for ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.getByRole("heading", { name: /404|page not found/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /return home/i })).toHaveAttribute("href", "/");
  });
}
