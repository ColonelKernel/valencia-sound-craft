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
 * The route sweep: every page in its default state.
 *
 * tests/e2e/contrastInteractive.spec.ts covers the states you can only reach
 * by clicking, which is where most of this site's text actually lives.
 */

const ROUTES = [
  ROUTE_META.home.path,
  ROUTE_META.cv.path,
  ROUTE_META.projects.path,
  ROUTE_META.work.path,
  ROUTE_META.transitAtlas.path,
  ROUTE_META.catalogIntelligence.path,
  ROUTE_META.sessionState.path,
  ROUTE_META.autoharm.path,
  ROUTE_META.toolsIndex.path,
  ROUTE_META.rhythm.path,
  ROUTE_META.harmony.path,
  ROUTE_META.circle.path,
  ROUTE_META.tonnetz.path,
  ROUTE_META.musicAnalytics.path,
];

for (const route of ROUTES) {
  test(`${route} has no unreadable text`, async ({ page }) => {
    await preferReducedMotion(page);
    await page.goto(route);
    await settle(page);
    await expectReadable(page, route, UNMEASURABLE_ZONES[route] ?? []);
    await expectSvgTextReadable(page, route);
  });
}
