import Papa from "papaparse";

import {
  computeAcquisitionScore,
  dropSparseFinalBucket,
  rollingVariance,
} from "@/lib/catalogAnalytics";
import { aggregateToMonthly, toChartRows } from "@/lib/musicDataService";

/**
 * The derivation behind src/content/analyticsSparks.ts.
 *
 * Kept separate from the generator script so the test can call exactly what
 * the generator calls — a test that reimplements the derivation guards
 * nothing. Everything here delegates to src/lib, so the homepage sparklines
 * and the /music-analytics dashboard cannot disagree about the same dataset.
 */

export interface AnalyticsSparkSeries {
  acquisition: number[];
  revenue: number[];
  risk: number[];
  catalog: number[];
}

export interface AnalyticsSparkMeta {
  /** Rows read from the CSV after dropping those with no artist. */
  rows: number;
  artists: number;
  months: number;
  /** Inclusive release-month range the series cover. */
  from: string;
  to: string;
}

const REVENUE_PER_STREAM = 0.003;

export function computeAnalyticsSparks(csv: string): {
  series: AnalyticsSparkSeries;
  meta: AnalyticsSparkMeta;
} {
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
  });
  const rows = toChartRows(parsed.data);
  const monthly = aggregateToMonthly(rows);

  const months = [...new Set(monthly.map((r) => r.month))].sort();

  // ── Revenue: the sample's modeled revenue by release month ──
  // Trimmed to the last two years so the sparkline is a readable slope rather
  // than sixty years of catalog squeezed into 100px.
  const byMonth = new Map<string, number>();
  for (const r of monthly) byMonth.set(r.month, (byMonth.get(r.month) ?? 0) + r.streams);

  // The dashboard's own trailing-median rule, applied so the homepage and
  // /music-analytics cannot disagree about where the series ends. On this
  // sample it does not fire: January 2020 is a partial month but still sits
  // above half the median of the preceding six, so it is kept. Applied
  // anyway, because the next regeneration of the CSV may not be so lucky.
  const allStreams = months.map((m) => byMonth.get(m) ?? 0);
  const keptStreams = dropSparseFinalBucket(allStreams);
  const keptMonths = months.slice(0, keptStreams.length);

  const recentStreams = keptStreams.slice(-24);
  const revenue = recentStreams.map((v) => Math.round(v * REVENUE_PER_STREAM));

  // ── Risk: rolling three-month variance of those same months ──
  // Rescaled to 0-100. Variance of stream counts is a number with eighteen
  // digits; the sparkline normalizes it away anyway, and a committed array of
  // raw variances is unreadable to anyone checking this file.
  const rawRisk = rollingVariance(recentStreams, 3);
  const peakRisk = Math.max(...rawRisk, 1);
  const risk = rawRisk.map((v) => Math.round((v / peakRisk) * 100));

  // ── Acquisition: real scores from the weighted model, best first ──
  const artistMonths = new Map<string, { month: string; streams: number }[]>();
  for (const r of monthly) {
    const list = artistMonths.get(r.artist) ?? [];
    list.push({ month: r.month, streams: r.streams });
    artistMonths.set(r.artist, list);
  }
  const acquisition = [...artistMonths.entries()]
    // Rank by catalog size so the twelve shown are artists the dataset
    // actually says something about, then sort by the score itself.
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 12)
    .map(([, series]) =>
      computeAcquisitionScore(series.sort((a, b) => a.month.localeCompare(b.month))).score,
    )
    .sort((a, b) => b - a);

  // ── Catalog depth: releases per year, most recent first ──
  const byYear = new Map<string, number>();
  for (const row of rows) {
    const year = row.date.slice(0, 4);
    if (year.length !== 4) continue;
    byYear.set(year, (byYear.get(year) ?? 0) + 1);
  }
  const catalog = [...byYear.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8)
    .map(([, count]) => count);

  return {
    series: { acquisition, revenue, risk, catalog },
    meta: {
      rows: rows.length,
      artists: artistMonths.size,
      months: keptMonths.length,
      from: keptMonths[0] ?? "",
      to: keptMonths.at(-1) ?? "",
    },
  };
}
