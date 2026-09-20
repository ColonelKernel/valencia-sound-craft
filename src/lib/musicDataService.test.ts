import { describe, expect, it } from "vitest";

import { aggregateToMonthly, toChartRows, type ChartRow } from "./musicDataService";

/**
 * The service that turns a popularity sample into the numbers the dashboard
 * calls streams, and the home of the synthetic fallback the case study
 * discloses by name.
 *
 * Writing these is what found the error in that disclosure: the page said the
 * sine factor runs "between 0.85 and 1.15" when it runs 0.55 to 1.15, and a
 * synthesized year carries 85% of the artist's total rather than all of it.
 */

const record = (artist: string, popularity: string, date: string) => ({
  track_artist: artist,
  track_popularity: popularity,
  track_album_release_date: date,
});

describe("toChartRows", () => {
  it("scales popularity by a million — the step that makes it look like streams", () => {
    expect(toChartRows([record("Nina", "73", "2019-04-12")])).toEqual([
      { artist: "Nina", streams: 73_000_000, date: "2019-04-12" },
    ]);
  });

  it("drops rows with no artist rather than bucketing them under an empty name", () => {
    expect(toChartRows([record("  ", "50", "2019-01"), record("", "50", "2019-01")])).toEqual([]);
  });

  it("treats unparseable or absent popularity as zero, never NaN", () => {
    const rows = toChartRows([
      record("A", "", "2019-01"),
      record("B", "not a number", "2019-01"),
      { track_artist: "C" } as Record<string, string>,
    ]);
    expect(rows.map((r) => r.streams)).toEqual([0, 0, 0]);
    for (const row of rows) expect(Number.isNaN(row.streams)).toBe(false);
  });
});

describe("aggregateToMonthly", () => {
  const dated: ChartRow[] = [
    { artist: "Nina", date: "2019-01-05", streams: 10 },
    { artist: "Nina", date: "2019-01-28", streams: 15 },
    { artist: "Nina", date: "2019-02-02", streams: 7 },
    { artist: "Otis", date: "2019-02-14", streams: 40 },
  ];

  it("sums an artist's rows within a release month and sorts by month", () => {
    expect(aggregateToMonthly(dated)).toEqual([
      { artist: "Nina", month: "2019-01", streams: 25 },
      { artist: "Nina", month: "2019-02", streams: 7 },
      { artist: "Otis", month: "2019-02", streams: 40 },
    ]);
  });

  it("silently drops undated rows once any row carries a date", () => {
    // Worth pinning because it is invisible: `hasDates` is computed over the
    // whole set, so a partially-dated dataset takes the date branch and the
    // undated rows contribute nothing at all — they do not fall through to
    // the synthetic path, which only fires on a completely empty map.
    const mixed = [...dated, { artist: "Ghost", date: "", streams: 999 }];
    const artists = new Set(aggregateToMonthly(mixed).map((r) => r.artist));
    expect(artists.has("Ghost")).toBe(false);
  });

  it("rejects a year-only date, which slices to four characters", () => {
    expect(aggregateToMonthly([{ artist: "Nina", date: "2019", streams: 10 }])).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ month: "2019" })]),
    );
  });
});

describe("the synthetic fallback", () => {
  // Fires only when the real aggregation produces nothing at all.
  const undated: ChartRow[] = [
    { artist: "Nina", date: "", streams: 1200 },
    { artist: "Otis", date: "", streams: 600 },
  ];
  const synthesized = aggregateToMonthly(undated);

  it("fires only on a completely empty map, and then builds twelve months each", () => {
    expect(synthesized).toHaveLength(24);
    expect(new Set(synthesized.map((r) => r.month)).size).toBe(12);
  });

  it("shapes the year with a factor running 0.55 to 1.15, not 0.85 to 1.15", () => {
    // The case-study copy said 0.85 to 1.15. 0.85 is the offset; the sine
    // reaches -1 at month nine, so the floor is 0.55.
    const nina = synthesized.filter((r) => r.artist === "Nina").sort((a, b) => a.month.localeCompare(b.month));
    const perMonth = 1200 / 12;
    const factors = nina.map((r) => r.streams / perMonth);

    expect(Math.min(...factors)).toBeCloseTo(0.55, 5);
    expect(Math.max(...factors)).toBeCloseTo(1.15, 5);
  });

  it("loses fifteen percent of the artist's total, because the sine cancels", () => {
    // The twelve sine terms sum to zero over a full period, so the factors
    // sum to 12 * 0.85 = 10.2 and the synthesized year is short by 15%.
    const total = synthesized
      .filter((r) => r.artist === "Nina")
      .reduce((sum, r) => sum + r.streams, 0);
    expect(total / 1200).toBeCloseTo(0.85, 3);
  });

  it("gives every artist the same twelve months, so the axis is shared", () => {
    const months = (artist: string) =>
      synthesized.filter((r) => r.artist === artist).map((r) => r.month).sort();
    expect(months("Nina")).toEqual(months("Otis"));
  });
});
