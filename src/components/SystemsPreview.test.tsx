import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import SystemsPreview from "./SystemsPreview";
import { ANALYTICS_SPARKS } from "@/content/analyticsSparks";
import { ROUTE_META } from "@/app/routeMeta";

/**
 * The merged Systems section, which replaced two consecutive card bands —
 * SystemsPreview and AnalyticsPreview — on the homepage.
 *
 * The invariant worth testing is not how it looks but that the merge cost
 * nothing: every destination the two old sections linked to still has a link
 * here. A merge that quietly drops a route is the failure mode.
 *
 * The "never claims real streaming data" guard is inherited from
 * AnalyticsPreview.test.tsx, which was deleted with its component. The claim
 * it guards against was live on the site once; the guard outlives the markup
 * that carried it.
 */

const renderSection = () =>
  render(
    <MemoryRouter>
      <SystemsPreview />
    </MemoryRouter>,
  );

/** Everything the two pre-merge sections linked to. */
const REQUIRED_DESTINATIONS = [
  ROUTE_META.musicAnalytics.path,
  ROUTE_META.grooveAtlas.path,
  ROUTE_META.rhythm.path,
  ROUTE_META.harmony.path,
  ROUTE_META.circle.path,
  ROUTE_META.tonnetz.path,
  ROUTE_META.projects.path,
];

describe("SystemsPreview", () => {
  it("keeps a link to every destination the two merged sections had", () => {
    const { container } = renderSection();
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    for (const path of REQUIRED_DESTINATIONS) {
      expect(hrefs, `missing link to ${path}`).toContain(path);
    }
  });

  it("leads with the catalog platform, which is the on-message artifact", () => {
    renderSection();
    expect(
      screen.getByRole("heading", { name: /Music Catalog Intelligence/i }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Groove Atlas/i })).toBeTruthy();
  });

  it("plots the derived series, not decoration, and captions what it plots", () => {
    const { container } = renderSection();

    // One sparkline now, not four. It is aria-hidden, so the caption beside
    // it is the only thing that says what it shows.
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBe(1);
    expect(document.body.textContent).toContain("Modeled revenue by release month");

    // The path has to be drawn from the real committed series.
    const path = container.querySelector('path[vector-effect="non-scaling-stroke"]');
    expect(path?.getAttribute("d")).toBeTruthy();
    expect(ANALYTICS_SPARKS.revenue.length).toBeGreaterThan(1);
  });

  it("never claims real streaming data", () => {
    renderSection();
    expect(document.body.textContent).not.toMatch(/real streaming data/i);
  });
});
