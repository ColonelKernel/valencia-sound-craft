import { test } from "@playwright/test";

import { ROUTE_META } from "../../src/app/routeMeta";
import {
  UNMEASURABLE_ZONES,
  expectReadable,
  preferReducedMotion,
  settle,
} from "./contrastProbe";
import { expectSvgTextReadable } from "./pixelProbe";

/**
 * The states you can only reach by clicking.
 *
 * contrast.spec.ts sweeps every route in its default state, which on this site
 * is a small fraction of the text: /music-analytics renders one of seven tab
 * panels at a time and the harmony lab one of four workspaces, so a route
 * sweep measures the first panel and never sees the other ten. That matters
 * because those panels are exactly where the contrast bugs were — every one of
 * the eighteen dimmed labels fixed on 2026-09-21 lived behind a tab, which is
 * why neither Lighthouse nor a default-state sweep had ever flagged them.
 *
 * Each panel is a separate test rather than one test looping over tabs: a
 * failure then names the panel, and one broken panel does not mask the rest.
 */

const MUSIC_ANALYTICS_TABS = [
  "Overview",
  "Acquisition",
  "Compare",
  "Segments",
  "Risk",
  "Portfolio",
  "AI Insights",
];

const HARMONY_WORKSPACES = [
  "Mode Visualizer",
  "Chord Progressions",
  "Metronome",
  "Scale Reference",
];

for (const tab of MUSIC_ANALYTICS_TABS) {
  test(`/music-analytics · ${tab} has no unreadable text`, async ({ page }) => {
    await preferReducedMotion(page);
    await page.goto(ROUTE_META.musicAnalytics.path);
    await settle(page);

    const button = page.getByRole("button", { name: tab, exact: true });
    await button.waitFor({ state: "visible", timeout: 20_000 });
    await button.click();

    // The panels are lazy and several fetch or derive a dataset before they
    // render anything; the probe's own "measured nothing" guard would catch an
    // empty panel, but waiting first makes the failure mean what it says.
    await page.waitForLoadState("networkidle");
    await settle(page);

    await expectReadable(
      page,
      `/music-analytics · ${tab}`,
      UNMEASURABLE_ZONES[ROUTE_META.musicAnalytics.path] ?? [],
    );
    await expectSvgTextReadable(page, `/music-analytics · ${tab}`);
  });
}

for (const workspace of HARMONY_WORKSPACES) {
  test(`/tools/harmony · ${workspace} has no unreadable text`, async ({ page }) => {
    await preferReducedMotion(page);
    await page.goto(ROUTE_META.harmony.path);
    await settle(page);

    const button = page.getByRole("button", { name: workspace, exact: true });
    await button.waitFor({ state: "visible", timeout: 20_000 });
    await button.click();

    await page.waitForLoadState("networkidle");
    await settle(page);

    await expectReadable(
      page,
      `/tools/harmony · ${workspace}`,
      UNMEASURABLE_ZONES[ROUTE_META.harmony.path] ?? [],
    );
    await expectSvgTextReadable(page, `/tools/harmony · ${workspace}`);
  });
}
