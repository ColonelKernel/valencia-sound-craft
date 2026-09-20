import { test, expect } from "@playwright/test";

/**
 * Contact form failure path: when the Supabase insert cannot complete (paused
 * project, network failure), the visitor must land on the error alert with
 * both fallback channels — a mailto link carrying their typed message and the
 * LinkedIn link — instead of hanging on a disabled "Sending..." button.
 *
 * Whichever way the build was configured, this test asserts something: the
 * failure path when the form is present, the direct-contact panel when it is
 * not. It never reports green having run nothing.
 */

test("failed submit surfaces the error alert with mailto + LinkedIn fallbacks", async ({ page }) => {
  // Kill every insert attempt at the network layer.
  await page.route("**/rest/v1/contact_messages*", (route) => route.abort());

  await page.goto("/");

  const contact = page.locator("#contact");
  await contact.scrollIntoViewIfNeeded();

  // Builds without Supabase env vars render the direct-contact panel instead
  // of the form, so the failure path genuinely does not exist there. This used
  // to be a bare test.skip, which meant the site's most important negative
  // path reported green having executed nothing — and a build that lost its
  // env vars (which is exactly what a VITE_* key in netlify.toml causes) would
  // have looked no different. Assert the fallback instead: whichever branch
  // shipped, one of them is now checked.
  const form = contact.locator("form");
  if ((await form.count()) === 0) {
    const panel = contact.getByText("Reach out directly");
    await expect(panel).toBeVisible();
    await expect(
      contact.getByRole("link", { name: "LinkedIn" }),
    ).toHaveAttribute("href", /linkedin\.com/);
    return;
  }

  await page.getByLabel("Name").fill("Playwright Probe");
  await page.getByLabel("Email").fill("probe@example.com");
  await page.getByLabel("Reason for reaching out").selectOption("Data science / ML project");
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
