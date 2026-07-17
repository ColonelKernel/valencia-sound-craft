import { describe, expect, it } from "vitest";

import { sparklineBars, sparklineGeometry } from "./sparkline";

describe("sparklineGeometry", () => {
  it("returns empty paths for an empty series", () => {
    expect(sparklineGeometry([])).toEqual({ line: "", area: "" });
  });

  it("spans the full width and inverts y so larger values sit higher", () => {
    const { line, area } = sparklineGeometry([0, 10], { width: 100, height: 40, padY: 4 });

    // First point pinned to x=0, last to x=width.
    expect(line.startsWith("M0 ")).toBe(true);
    expect(line).toContain("L100 ");
    // Lower value -> larger y (bottom), higher value -> smaller y (top).
    expect(line).toBe("M0 36 L100 4");
    // Area closes down to the baseline and back.
    expect(area).toBe("M0 36 L100 4 L100 40 L0 40 Z");
  });

  it("centers a single point and flattens a constant series without dividing by zero", () => {
    // Single point: centered horizontally and vertically.
    expect(sparklineGeometry([5], { width: 100, height: 40, padY: 4 }).line).toBe("M50 20");

    // A flat series has zero range; every point lands at the same mid height.
    const flat = sparklineGeometry([7, 7, 7], { width: 100, height: 40, padY: 4 });
    expect(flat.line).toBe("M0 20 L50 20 L100 20");
  });
});

describe("sparklineBars", () => {
  it("returns no bars for an empty series", () => {
    expect(sparklineBars([])).toEqual([]);
  });

  it("scales the tallest value to the full height and keeps bars inside the width", () => {
    const bars = sparklineBars([10, 5], { width: 100, height: 40, gap: 0.2 });

    expect(bars).toHaveLength(2);
    // Tallest bar fills the height; the half-value bar is half as tall.
    expect(bars[0].height).toBe(40);
    expect(bars[1].height).toBe(20);
    // Bars stay within [0, width].
    for (const bar of bars) {
      expect(bar.x).toBeGreaterThanOrEqual(0);
      expect(bar.x + bar.width).toBeLessThanOrEqual(100);
    }
  });
});
