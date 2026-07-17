import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import AnalyticsPreview from "./AnalyticsPreview";

const renderPreview = () =>
  render(
    <MemoryRouter>
      <AnalyticsPreview />
    </MemoryRouter>,
  );

describe("AnalyticsPreview", () => {
  it("renders the four metric cards with inline SVG sparklines (no chart library)", () => {
    const { container } = renderPreview();

    expect(screen.getByRole("heading", { name: /Music Catalog Intelligence Platform/i })).toBeTruthy();

    // Four decorative sparklines, all marked presentational for a11y.
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBe(4);

    // Line/area sparks use non-scaling strokes; the catalog spark uses bars.
    expect(container.querySelectorAll('path[vector-effect="non-scaling-stroke"]').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll("rect").length).toBe(8);
  });

  it("uses the honest dataset labelling and never claims real streaming data", () => {
    renderPreview();

    // A3 regression guard: the false "Real streaming data" claim must stay gone.
    expect(document.body.textContent).not.toMatch(/real streaming data/i);
    expect(document.body.textContent).toContain("Modeled catalog metrics");
    expect(document.body.textContent).toContain("public Spotify popularity dataset (2020 sample)");
  });
});
