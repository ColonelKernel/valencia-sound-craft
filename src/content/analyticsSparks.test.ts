import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ANALYTICS_SPARKS, ANALYTICS_SPARK_META } from "./analyticsSparks";
import { computeAnalyticsSparks } from "./analyticsSparksSource";

/**
 * analyticsSparks.ts is generated and committed, which means it rots silently
 * the moment the CSV is regenerated — and the only place it surfaces is four
 * decorative sparklines on the homepage that nobody inspects.
 *
 * Same contract as the social card: the generator's output is checked against
 * a fresh derivation from the source data, so a stale file fails the suite
 * rather than shipping invented-looking numbers next to real method names.
 * These replaced four hand-written arrays.
 */

const csv = readFileSync(
  join(__dirname, "..", "..", "public", "data", "spotify_songs.csv"),
  "utf8",
);
const fresh = computeAnalyticsSparks(csv);

describe("homepage analytics sparklines", () => {
  it("matches what the generator produces from the shipped CSV", () => {
    expect(ANALYTICS_SPARKS.acquisition).toEqual(fresh.series.acquisition);
    expect(ANALYTICS_SPARKS.revenue).toEqual(fresh.series.revenue);
    expect(ANALYTICS_SPARKS.risk).toEqual(fresh.series.risk);
    expect(ANALYTICS_SPARKS.catalog).toEqual(fresh.series.catalog);
    expect(ANALYTICS_SPARK_META).toEqual(fresh.meta);
  });

  it("plots real numbers — every point finite and non-negative", () => {
    for (const [name, series] of Object.entries(ANALYTICS_SPARKS)) {
      expect(series.length, name).toBeGreaterThan(1);
      for (const value of series) {
        expect(Number.isFinite(value), `${name}: ${value}`).toBe(true);
        expect(value, name).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("is not flat — a sparkline of one repeated value says nothing", () => {
    for (const [name, series] of Object.entries(ANALYTICS_SPARKS)) {
      expect(new Set(series).size, name).toBeGreaterThan(1);
    }
  });

  it("keeps acquisition scores inside the model's own 0-100 range", () => {
    for (const score of ANALYTICS_SPARKS.acquisition) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    // Generated best-first, which is what makes the shape readable.
    expect([...ANALYTICS_SPARKS.acquisition].sort((a, b) => b - a)).toEqual([
      ...ANALYTICS_SPARKS.acquisition,
    ]);
  });

  it("reports metadata that matches the dataset the pages describe", () => {
    // 32,833 rows is the figure the case study and the CSV slimming script
    // both quote for the 2020 TidyTuesday sample.
    expect(ANALYTICS_SPARK_META.rows).toBe(32_833);
    expect(ANALYTICS_SPARK_META.to.startsWith("2020")).toBe(true);
  });
});
