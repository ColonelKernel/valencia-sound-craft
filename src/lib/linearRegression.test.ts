import { describe, expect, it } from "vitest";

import { forecast } from "./linearRegression";

/**
 * The CV lists "Forecasting" and points here; the catalog case study quotes
 * this file's interval formula. It had no tests and one live defect.
 *
 * These pin the edges rather than the happy path, because the happy path is
 * what the dashboard exercises on every load and the edges are what it never
 * does until one artist has no rows.
 */

const line = (n: number, slope: number, intercept = 0) =>
  Array.from({ length: n }, (_, i) => ({ x: i, y: slope * i + intercept }));

describe("forecast", () => {
  it("returns nothing for no observations, rather than a band bounded by NaN", () => {
    // 1.96 * 0 * Math.sqrt(1 + 1/0) is 0 * Infinity. Every caller passed the
    // result to Recharts unguarded.
    expect(forecast([], 3)).toEqual([]);
  });

  it("never emits a non-finite bound, whatever the input", () => {
    const inputs = [
      [],
      [{ x: 0, y: 5 }],
      [
        { x: 0, y: 5 },
        { x: 0, y: 9 },
      ], // every x identical: the regression's denom is 0
      line(6, 0, 100), // perfectly flat: zero residual, zero standard error
      line(6, 12),
    ];
    for (const points of inputs) {
      for (const row of forecast(points, 6)) {
        expect(Number.isFinite(row.y), `y for ${JSON.stringify(points)}`).toBe(true);
        expect(Number.isFinite(row.lower)).toBe(true);
        expect(Number.isFinite(row.upper)).toBe(true);
      }
    }
  });

  it("extrapolates a clean line exactly, and starts after the last observation", () => {
    const rows = forecast(line(5, 10), 3);
    expect(rows.map((r) => r.x)).toEqual([5, 6, 7]);
    expect(rows.map((r) => r.y)).toEqual([50, 60, 70]);
  });

  it("collapses the band to the point estimate when the fit is exact", () => {
    // Zero residuals means zero standard error, so a band would be dishonest
    // in the other direction — there is nothing for it to express.
    const [first] = forecast(line(8, 4), 1);
    expect(first.lower).toBe(first.y);
    expect(first.upper).toBe(first.y);
  });

  it("widens the band as the observations scatter", () => {
    const tight = forecast(
      [
        { x: 0, y: 100 },
        { x: 1, y: 101 },
        { x: 2, y: 102 },
        { x: 3, y: 103 },
      ],
      1,
    )[0];
    const noisy = forecast(
      [
        { x: 0, y: 100 },
        { x: 1, y: 160 },
        { x: 2, y: 40 },
        { x: 3, y: 180 },
      ],
      1,
    )[0];
    expect(noisy.upper - noisy.lower).toBeGreaterThan(tight.upper - tight.lower);
  });

  it("does not widen the band with the forecast horizon", () => {
    // Asserted so the limitation cannot be silently removed: /music-analytics
    // and the case study both tell the reader the band is too narrow far out.
    // If this test ever fails, the copy on both pages has to change with it.
    const rows = forecast(line(6, 5, 20).map((p, i) => ({ ...p, y: p.y + (i % 2) * 7 })), 12);
    const widths = rows.map((r) => r.upper - r.lower);
    expect(new Set(widths).size).toBe(1);
  });

  it("floors both the estimate and the lower bound at zero", () => {
    // Streams cannot go negative; a declining catalog must not forecast debt.
    const rows = forecast(line(6, -50, 100), 6);
    for (const row of rows) {
      expect(row.y).toBeGreaterThanOrEqual(0);
      expect(row.lower).toBeGreaterThanOrEqual(0);
    }
    expect(rows.at(-1)?.y).toBe(0);
  });

  it("treats a single observation as a flat line at that value", () => {
    const rows = forecast([{ x: 3, y: 42 }], 2);
    expect(rows).toEqual([
      { x: 4, y: 42, lower: 42, upper: 42 },
      { x: 5, y: 42, lower: 42, upper: 42 },
    ]);
  });

  it("returns nothing when asked for no future points", () => {
    expect(forecast(line(5, 3), 0)).toEqual([]);
  });
});
