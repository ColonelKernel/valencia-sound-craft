import { describe, expect, it } from "vitest";

import {
  buildArtistComparison,
  buildSegmentedData,
  computeAcquisitionScore,
  computeVolatility,
  diversificationScore,
  dropSparseFinalBucket,
  formatMetric,
  robustMoMGrowth,
  rollingVariance,
  segmentArtist,
  volatilityScore,
} from "./catalogAnalytics";
import type { ArtistMonthly } from "./musicDataService";

/**
 * These are the rules /projects/catalog-intelligence describes in prose: the
 * trailing-median sparse-bucket filter, the four-component acquisition prior
 * and its 0.30/0.30/0.20/0.20 weights, and the segmentation ratio cuts. The
 * case study is a claim about what this code does; this file is what keeps
 * the claim true.
 *
 * The thresholds are asserted on both sides wherever the case study commits
 * to a number, because a test that only checks the happy side of a cut would
 * pass against a filter that dropped everything.
 */

const month = (i: number) => `2020-${String(i + 1).padStart(2, "0")}`;
const series = (streams: number[], artist = "A"): ArtistMonthly[] =>
  streams.map((s, i) => ({ artist, month: month(i), streams: s }));

describe("dropSparseFinalBucket", () => {
  it("drops a final bucket that sits below half the trailing median", () => {
    // Trailing median of [100…] is 100; a 20 final bucket is a partial month,
    // not a collapse.
    const input = [100, 100, 100, 100, 100, 100, 20];
    expect(dropSparseFinalBucket(input)).toEqual([100, 100, 100, 100, 100, 100]);
  });

  it("is exactly a half-of-median cut, not an approximate one", () => {
    const base = [100, 100, 100, 100, 100, 100];
    expect(dropSparseFinalBucket([...base, 50])).toHaveLength(7);
    expect(dropSparseFinalBucket([...base, 49])).toHaveLength(6);
  });

  it("measures against the trailing median, not against the previous month", () => {
    // This is the distinction that decides what the rule can and cannot see.
    // A 60% fall from the last complete month survives in a rising catalog,
    // because the median of the preceding six (80) is well under that month —
    // and is discarded in a flat one, where the median is the previous month.
    expect(dropSparseFinalBucket([50, 60, 70, 80, 90, 100, 40])).toHaveLength(7);
    expect(dropSparseFinalBucket([100, 100, 100, 100, 100, 100, 40])).toHaveLength(6);
  });

  it("cannot distinguish a real collapse from a partial month, and discards both", () => {
    // Named rather than hidden: in a flat catalog the filter suppresses any
    // decline deeper than 50%. The dashboard reports declines up to that
    // point and goes quiet past it. /projects/catalog-intelligence says so.
    expect(dropSparseFinalBucket([100, 100, 100, 100, 100, 100, 1])).toEqual([
      100, 100, 100, 100, 100, 100,
    ]);
  });

  it("leaves short series alone — under four buckets there is no trend to guard", () => {
    expect(dropSparseFinalBucket([100, 100, 1])).toEqual([100, 100, 1]);
  });

  it("leaves the series alone when every preceding bucket is empty", () => {
    // No positive trailing values means no median, so there is nothing to
    // compare the final bucket against.
    expect(dropSparseFinalBucket([0, 0, 0, 0, 5])).toEqual([0, 0, 0, 0, 5]);
  });
});

describe("robustMoMGrowth", () => {
  it("does not report the collapse that the sparse final bucket fakes", () => {
    // Without the filter this reads as −80%. This is the bug the case study
    // says shaped the metrics.
    expect(robustMoMGrowth([100, 100, 100, 100, 100, 100, 20])).toBe(0);
  });

  it("still reports a decline shallow enough to be comparable", () => {
    expect(robustMoMGrowth([100, 100, 100, 100, 100, 100, 50])).toBeCloseTo(-50, 5);
  });

  it("reports growth", () => {
    expect(robustMoMGrowth([100, 100, 100, 100, 100, 100, 150])).toBeCloseTo(50, 5);
  });

  it("returns 0 rather than dividing by a zero previous month", () => {
    expect(robustMoMGrowth([0, 0])).toBe(0);
  });
});

describe("computeVolatility and volatilityScore", () => {
  it("is the sample standard deviation", () => {
    // [2,4,4,4,5,5,7,9] has a sample SD of exactly sqrt(32/7).
    expect(computeVolatility([2, 4, 4, 4, 5, 5, 7, 9])).toBeCloseTo(Math.sqrt(32 / 7), 10);
  });

  it("is 0 for a series too short to vary", () => {
    expect(computeVolatility([100])).toBe(0);
  });

  it("labels by coefficient of variation at the documented cuts", () => {
    // Constant series: CV 0.
    expect(volatilityScore([100, 100, 100])).toEqual({ score: 0, label: "Low" });
    // Each of these is built so the CV lands clearly inside one band.
    expect(volatilityScore([100, 105, 95, 100]).label).toBe("Low");
    expect(volatilityScore([100, 130, 70, 100]).label).toBe("Medium");
    expect(volatilityScore([100, 200, 10, 190]).label).toBe("High");
  });

  it("reports the coefficient of variation as the score, in percent", () => {
    const { score } = volatilityScore([100, 130, 70, 100]);
    const cv = computeVolatility([100, 130, 70, 100]) / 100;
    expect(score).toBe(Math.round(cv * 100));
  });

  it("does not divide by a zero mean", () => {
    expect(volatilityScore([0, 0, 0])).toEqual({ score: 0, label: "Low" });
  });
});

describe("rollingVariance", () => {
  it("returns one value per month, with no variance at the first", () => {
    const out = rollingVariance([10, 20, 30, 40]);
    expect(out).toHaveLength(4);
    expect(out[0]).toBe(0);
  });

  it("only looks back across the window", () => {
    // A spike three months ago is outside a 3-month window by the time the
    // series reaches the end, so the last value is flat again.
    const out = rollingVariance([0, 1000, 0, 0, 0], 3);
    expect(out[4]).toBe(0);
    expect(out[1]).toBeGreaterThan(0);
  });
});

describe("segmentArtist", () => {
  it("calls a catalog Front when the recent half outruns the early half by >1.3x", () => {
    expect(segmentArtist(series([10, 10, 10, 100, 100, 100]))).toBe("Front Catalog");
  });

  it("calls it Back when the recent half falls under 0.7x", () => {
    expect(segmentArtist(series([100, 100, 100, 10, 10, 10]))).toBe("Back Catalog");
  });

  it("calls a flat catalog Mid", () => {
    expect(segmentArtist(series([100, 100, 100, 100, 100, 100]))).toBe("Mid Catalog");
  });

  it("puts the cuts at exactly 1.3x and 0.7x", () => {
    // Early half averages 100 in each of these; only the recent half moves,
    // landing a percentage point either side of each documented threshold.
    expect(segmentArtist(series([100, 100, 100, 131, 131, 131]))).toBe("Front Catalog");
    expect(segmentArtist(series([100, 100, 100, 129, 129, 129]))).toBe("Mid Catalog");
    expect(segmentArtist(series([100, 100, 100, 71, 71, 71]))).toBe("Mid Catalog");
    expect(segmentArtist(series([100, 100, 100, 69, 69, 69]))).toBe("Back Catalog");
  });

  it("defaults to Mid rather than guessing from under three months", () => {
    expect(segmentArtist(series([1, 1000]))).toBe("Mid Catalog");
  });

  it("calls a catalog with no early activity Front, instead of dividing by zero", () => {
    expect(segmentArtist(series([0, 0, 0, 50, 50, 50]))).toBe("Front Catalog");
  });

  it("sorts by month itself, so input order cannot change the answer", () => {
    const rows = series([10, 10, 10, 100, 100, 100]);
    const shuffled = [...rows].reverse();
    expect(segmentArtist(shuffled)).toBe(segmentArtist(rows));
  });
});

describe("computeAcquisitionScore", () => {
  it("refuses to score a series shorter than two months", () => {
    expect(computeAcquisitionScore(series([100]))).toEqual({
      score: 0,
      label: "High Risk",
      components: { growth: 0, stability: 0, longevity: 0, momentum: 0 },
    });
  });

  it("combines the components at 0.30 growth / 0.30 stability / 0.20 longevity / 0.20 momentum", () => {
    // The score and the displayed components are rounded independently, so
    // they can differ by at most 1. Anything larger means the weights moved.
    for (const input of [
      series([10, 20, 30, 40, 50, 60]),
      series([100, 90, 80, 70, 60, 50]),
      series([5, 400, 8, 900, 3, 600]),
      series(Array.from({ length: 36 }, (_, i) => 100 + i * 5)),
    ]) {
      const { score, components: c } = computeAcquisitionScore(input);
      const weighted =
        c.growth * 0.3 + c.stability * 0.3 + c.longevity * 0.2 + c.momentum * 0.2;
      expect(Math.abs(score - weighted)).toBeLessThanOrEqual(1);
    }
  });

  it("keeps every component and the score inside 0–100", () => {
    for (const input of [
      series([1, 1_000_000]),
      series([1_000_000, 1]),
      series(Array.from({ length: 36 }, () => 0)),
    ]) {
      const { score, components } = computeAcquisitionScore(input);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      for (const value of Object.values(components)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("cuts the label at 80, 60 and 40 — and never disagrees with its own score", () => {
    const expected = (score: number) =>
      score >= 80 ? "Strong Acquisition" : score >= 60 ? "Promising" : score >= 40 ? "Hold" : "High Risk";

    for (const input of [
      series([10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120]),
      series([100, 100, 100, 100, 100, 100]),
      series([1000, 10, 900, 20, 800, 30]),
      series([0, 0, 0, 0, 1]),
    ]) {
      const { score, label } = computeAcquisitionScore(input);
      expect(label).toBe(expected(score));
    }
  });

  it("prefers steady growth over the same total delivered erratically", () => {
    const steady = computeAcquisitionScore(series([100, 110, 120, 130, 140, 150]));
    const erratic = computeAcquisitionScore(series([10, 250, 20, 240, 15, 215]));
    expect(steady.score).toBeGreaterThan(erratic.score);
    expect(steady.components.stability).toBeGreaterThan(erratic.components.stability);
  });
});

describe("diversificationScore", () => {
  it("is 0 for a portfolio that is not diversified at all", () => {
    expect(diversificationScore([])).toBe(0);
    expect(diversificationScore([0.4])).toBe(0);
  });

  it("is 100 when nothing in the portfolio moves", () => {
    expect(diversificationScore([0, 0, 0])).toBe(100);
  });

  it("rewards more holdings only up to four, where the bonus caps", () => {
    const two = diversificationScore([0.5, 0.5]);
    const four = diversificationScore([0.5, 0.5, 0.5, 0.5]);
    const eight = diversificationScore(Array.from({ length: 8 }, () => 0.5));
    expect(four).toBeGreaterThan(two);
    // The bonus is min(n * 10, 40), so it is already maxed at four holdings:
    // past that, adding names moves this number only through their volatility.
    expect(eight).toBe(four);
  });

  it("penalizes volatility, and stays inside 0–100", () => {
    const calm = diversificationScore([0.1, 0.1, 0.1]);
    const wild = diversificationScore([0.9, 0.9, 0.9]);
    expect(calm).toBeGreaterThan(wild);
    for (const value of [calm, wild, diversificationScore([5, 5, 5])]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });
});

describe("formatMetric", () => {
  it("abbreviates at each thousand boundary", () => {
    expect(formatMetric(999, "streams")).toBe("999");
    expect(formatMetric(1_500, "streams")).toBe("1.5K");
    expect(formatMetric(2_400_000, "streams")).toBe("2.4M");
    expect(formatMetric(3_100_000_000, "streams")).toBe("3.1B");
  });

  it("converts to revenue at the stated $0.003 per stream, and marks it as money", () => {
    // 1,000,000 streams * 0.003 = $3,000.
    expect(formatMetric(1_000_000, "revenue")).toBe("$3.0K");
    expect(formatMetric(1_000, "revenue")).toBe("$3");
  });
});

describe("buildSegmentedData", () => {
  const data: ArtistMonthly[] = [
    ...series([10, 10, 10, 100, 100, 100], "Rising"),
    ...series([100, 100, 100, 10, 10, 10], "Fading"),
    ...series([999, 999, 999, 999, 999, 999], "NotSelected"),
  ];

  it("splits each month's streams across the segment each artist belongs to", () => {
    const out = buildSegmentedData(data, ["Rising", "Fading"]);
    expect(out).toHaveLength(6);
    expect(out[0]).toEqual({ month: "2020-01", front: 10, mid: 0, back: 100 });
    expect(out[5]).toEqual({ month: "2020-06", front: 100, mid: 0, back: 10 });
  });

  it("ignores artists outside the selection", () => {
    const out = buildSegmentedData(data, ["Rising"]);
    const total = out.reduce((s, m) => s + m.front + m.mid + m.back, 0);
    expect(total).toBe(330);
  });

  it("returns months in chronological order", () => {
    const out = buildSegmentedData([...data].reverse(), ["Rising", "Fading"]);
    expect(out.map((m) => m.month)).toEqual([...out.map((m) => m.month)].sort());
  });
});

describe("buildArtistComparison", () => {
  const data: ArtistMonthly[] = [
    ...series([10, 20, 30, 40, 50, 60], "Rising"),
    ...series([60, 50, 40, 30, 20, 10], "Fading"),
  ];

  it("returns one row per requested artist, in the order asked for", () => {
    const rows = buildArtistComparison(data, ["Fading", "Rising"]);
    expect(rows.map((r) => r.artist)).toEqual(["Fading", "Rising"]);
  });

  it("agrees with the standalone functions rather than recomputing differently", () => {
    const [rising] = buildArtistComparison(data, ["Rising"]);
    const streams = [10, 20, 30, 40, 50, 60];
    expect(rising.total).toBe(210);
    expect(rising.momGrowth).toBeCloseTo(robustMoMGrowth(streams), 10);
    expect(rising.volatility).toBe(volatilityScore(streams).score);
    expect(rising.segment).toBe(segmentArtist(series(streams)));
    expect(rising.acquisition).toEqual(computeAcquisitionScore(series(streams)));
  });

  it("projects a rising catalog above a fading one", () => {
    const [rising, fading] = buildArtistComparison(data, ["Rising", "Fading"]);
    expect(rising.forecastQ).toBeGreaterThan(fading.forecastQ);
  });
});
