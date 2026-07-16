import { test, expect, type Page } from "@playwright/test";

import { getQuickPlayRhythms } from "../../src/components/Blipblox/rhythmEngineModel";

/**
 * Cross-tool shared state (src/state/globalMusicState.tsx) lives in memory
 * above the router, so it only survives client-side navigation. Every test
 * does one full page load, interacts, then navigates via the "Tool
 * navigation" subnav links (react-router NavLinks in ToolSubnav.tsx) instead
 * of a second page.goto().
 */

const toolNav = (page: Page) => page.getByRole("navigation", { name: "Tool navigation" });

// The rhythm route mounts two GlobalRhythmEngine instances (standalone +
// embedded DrumMachine preview); every engine locator must scope here.
const engineSection = (page: Page) =>
  page.locator('section[aria-labelledby="rhythm-engine-section"]');

// A quick-play rhythm that differs from the store default (flamenco_buleria
// at 110 BPM) in both identity and default tempo, resolved from the same
// library the engine renders — keeps the tests deterministic.
const altRhythm = getQuickPlayRhythms(10).find(
  (definition) => definition.id !== "flamenco_buleria" && definition.defaultTempo !== 110,
);

async function navigateViaToolNav(page: Page, linkName: string, expectedPath: string) {
  await toolNav(page).getByRole("link", { name: linkName, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${expectedPath}$`));
}

test("key selected on the circle propagates to the harmony workspace", async ({ page }) => {
  await page.goto("/tools/circle");
  await expect(page.getByRole("heading", { level: 1, name: "Circle of Fifths" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText(/current shared tonal center is/)).toContainText("is C in Ionian");

  // The major-ring segments in CircleOfFifths are unlabeled SVG paths; their
  // "G" label is a pointer-events-none <text> node sitting on top of the
  // path, so click through the label with force (the browser hit-tests the
  // path underneath, which triggers handleMajorClick -> onSelectKey).
  const gLabel = page.locator("svg text").filter({ hasText: /^G$/ }).first();
  await gLabel.click({ force: true });

  await expect(page.getByText(/current shared tonal center is/)).toContainText("is G in Ionian");

  await navigateViaToolNav(page, "Harmony", "/tools/harmony");
  await expect(page.getByText(/harmony workspace is centered on/)).toContainText(
    "centered on G Ionian",
    { timeout: 15_000 },
  );
});

test("tempo set on the rhythm engine propagates to the tonnetz", async ({ page }) => {
  await page.goto("/tools/rhythm");
  // The route mounts two GlobalRhythmEngine instances today (standalone
  // engine + one embedded in the legacy DrumMachine), so scope to the
  // standalone engine section to keep the locator unambiguous.
  await expect(
    page
      .locator('section[aria-labelledby="rhythm-engine-section"]')
      .getByRole("heading", { name: "Global Rhythm Atlas Engine" }),
  ).toBeVisible({ timeout: 20_000 });

  // The engine's tempo control is the only native range input inside the
  // rhythm-engine section (Swing/Strength are Radix sliders; the legacy
  // DrumMachine lives in a separate article). "End" jumps a native range
  // input to its max (220), which is deterministic regardless of the
  // rhythm's default tempo and fires React's onChange.
  const tempoSlider = page
    .locator('section[aria-labelledby="rhythm-engine-section"] input[type="range"]')
    .first();
  await tempoSlider.press("End");

  await expect(page.getByText(/Shared tempo:/)).toContainText("Shared tempo: 220 BPM");

  // useDebouncedTempo commits to the global store after 140ms; give the
  // debounce time to flush before navigating away.
  await page.waitForTimeout(400);

  await navigateViaToolNav(page, "Tonnetz", "/tools/tonnetz");
  await expect(page.getByText(/Tonnetz is currently aligned to/)).toContainText("at 220 BPM", {
    timeout: 15_000,
  });
});

test("rhythm selected on the map route is the active rhythm on the rhythm route", async ({
  page,
}) => {
  await page.goto("/tools/map");
  await expect(page.getByRole("heading", { name: "Global Rhythm Atlas Engine" })).toBeVisible({
    timeout: 20_000,
  });

  // Rhythm Identity Panel heading renders "{name} - {country}". The map
  // section contains several h4s (the map card title renders first), so
  // target the identity heading's dedicated test id.
  const identity = page.getByTestId("rhythm-identity").first();
  await expect(identity).toContainText(" - ");
  const initialIdentity = ((await identity.textContent()) ?? "").trim();

  // Leaflet markers are flaky under automation, so use the rhythm browser
  // instead: the region pills render lowercase ("brazil"), which keeps the
  // exact (case-sensitive) match unambiguous versus the "Brazil" country
  // button. Switching region loads that region's first rhythm and pushes it
  // into the shared store via onRhythmChange.
  await page.getByRole("button", { name: "brazil", exact: true }).click();
  await expect(identity).not.toHaveText(initialIdentity);

  const nextIdentity = ((await identity.textContent()) ?? "").trim();
  const separator = nextIdentity.lastIndexOf(" - ");
  const rhythmName = nextIdentity.slice(0, separator).trim();
  const country = nextIdentity.slice(separator + 3).trim();
  expect(rhythmName.length).toBeGreaterThan(0);
  expect(country).toBe("Brazil");

  // The page prose renders the capitalized region label from REGION_LABELS
  // ("Brazil"), not the lowercase region key used by the filter pills.
  await expect(page.getByText(/You are exploring/)).toContainText("Brazil");

  await navigateViaToolNav(page, "Rhythm", "/tools/rhythm");
  await expect(page.getByText("Current rhythm:")).toContainText(
    `Current rhythm: ${rhythmName} from ${country}`,
    { timeout: 20_000 },
  );
});

test("an untouched tempo adopts the selected rhythm's default", async ({ page }) => {
  expect(altRhythm).toBeDefined();

  await page.goto("/tools/rhythm");
  await expect(
    engineSection(page).getByRole("heading", { name: "Global Rhythm Atlas Engine" }),
  ).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Shared tempo:/)).toContainText("Shared tempo: 110 BPM");

  await engineSection(page)
    .getByRole("button", { name: `${altRhythm!.country} · ${altRhythm!.name}` })
    .click();

  await expect(page.getByText(/Shared tempo:/)).toContainText(
    `Shared tempo: ${altRhythm!.defaultTempo} BPM`,
  );
});

test("a user-set tempo survives rhythm selection", async ({ page }) => {
  expect(altRhythm).toBeDefined();

  await page.goto("/tools/rhythm");
  await expect(
    engineSection(page).getByRole("heading", { name: "Global Rhythm Atlas Engine" }),
  ).toBeVisible({ timeout: 20_000 });

  // "End" jumps the engine's native range input to its max (220) — an
  // explicit user tempo. Wait out the 140ms debounce so the store commits
  // (and marks tempo as touched) before the selection below.
  const tempoSlider = engineSection(page).locator('input[type="range"]').first();
  await tempoSlider.press("End");
  await expect(page.getByText(/Shared tempo:/)).toContainText("Shared tempo: 220 BPM");
  await page.waitForTimeout(400);

  await engineSection(page)
    .getByRole("button", { name: `${altRhythm!.country} · ${altRhythm!.name}` })
    .click();

  // The selection suggests its default tempo; a touched store must ignore it.
  await page.waitForTimeout(400);
  await expect(page.getByText(/Shared tempo:/)).toContainText("Shared tempo: 220 BPM");
});

test("transport plays on the single shared AudioContext", async ({ page }) => {
  await page.goto("/tools/rhythm");
  await expect(
    engineSection(page).getByRole("heading", { name: "Global Rhythm Atlas Engine" }),
  ).toBeVisible({ timeout: 20_000 });

  await engineSection(page).getByRole("button", { name: "Play", exact: true }).click();

  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            (window as unknown as { __vscAudioContext?: AudioContext }).__vscAudioContext?.state ??
            "absent",
        ),
      { timeout: 10_000 },
    )
    .toBe("running");

  await engineSection(page).getByRole("button", { name: "Stop", exact: true }).click();
  await expect(engineSection(page).getByRole("button", { name: "Play", exact: true })).toBeVisible();
});
