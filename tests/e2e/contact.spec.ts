import { test, expect } from "@playwright/test";

/**
 * Contact form failure path: when the Supabase insert cannot complete (paused
 * project, network failure), the visitor must land on the error alert with
 * both fallback channels — a mailto link carrying their typed message and the
 * LinkedIn link — instead of hanging on a disabled "Sending..." button.
 */

test("failed submit surfaces the error alert with mailto + LinkedIn fallbacks", async ({ page }) => {
  // Kill every insert attempt at the network layer.
  await page.route("**/rest/v1/contact_messages*", (route) => route.abort());

  await page.goto("/");

  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();

  // Builds without Supabase env vars render the direct-contact panel instead
  // of the form; the failure path doesn't exist there.
  const form = contact.locator("form");
  test.skip((await form.count()) === 0, "backend not configured in this build — no form to test");

  await page.getByLabel("Name").fill("Playwright Probe");
  await page.getByLabel("Email").fill("probe@example.com");
  await page.getByLabel("Project Type").selectOption("Production");
  await page.getByLabel("Message").fill("End-to-end failure-path check");

  await page.getByRole("button", { name: /send message/i }).click();

  const alert = page.getByRole("alert");
  await expect(alert).toContainText(/something went wrong/i);

  const mailto = alert.getByRole("link", { name: /email it to me directly/i });
  await expect(mailto).toBeVisible();
  const href = (await mailto.getAttribute("href")) ?? "";
  expect(href).toContain("mailto:");
  expect(href).toContain(encodeURIComponent("End-to-end failure-path check"));

  await expect(alert.getByRole("link", { name: "LinkedIn" })).toBeVisible();

  // The submit button must have recovered — no stuck "Sending..." state.
  await expect(page.getByRole("button", { name: /send message/i })).toBeEnabled();
});
