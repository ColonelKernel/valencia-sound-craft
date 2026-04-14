import type { ArtistMonthly } from "./musicDataService";
import { linearRegression, forecast } from "./linearRegression";

/* ── Revenue ── */
const REVENUE_PER_STREAM = 0.003;
export const toRevenue = (streams: number) => streams * REVENUE_PER_STREAM;

/* ── Formatting helpers ── */
export function formatMetric(n: number, mode: "streams" | "revenue"): string {
  const v = mode === "revenue" ? toRevenue(n) : n;
  const prefix = mode === "revenue" ? "$" : "";
  if (v >= 1_000_000_000) return `${prefix}${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${prefix}${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${prefix}${(v / 1_000).toFixed(1)}K`;
  return `${prefix}${Math.round(v)}`;
}

/* ── Volatility (std deviation of monthly streams) ── */
export function computeVolatility(monthlyStreams: number[]): number {
  if (monthlyStreams.length < 2) return 0;
  const mean = monthlyStreams.reduce((s, v) => s + v, 0) / monthlyStreams.length;
  const variance = monthlyStreams.reduce((s, v) => s + (v - mean) ** 2, 0) / (monthlyStreams.length - 1);
  return Math.sqrt(variance);
}

export function volatilityScore(monthlyStreams: number[]): { score: number; label: "Low" | "Medium" | "High" } {
  if (monthlyStreams.length < 2) return { score: 0, label: "Low" };
  const mean = monthlyStreams.reduce((s, v) => s + v, 0) / monthlyStreams.length;
  if (mean === 0) return { score: 0, label: "Low" };
  const cv = computeVolatility(monthlyStreams) / mean; // coefficient of variation
  if (cv < 0.15) return { score: Math.round(cv * 100), label: "Low" };
  if (cv < 0.35) return { score: Math.round(cv * 100), label: "Medium" };
  return { score: Math.round(cv * 100), label: "High" };
}

/* ── Rolling variance (window = 3 months) ── */
export function rollingVariance(monthlyStreams: number[], window = 3): number[] {
  const result: number[] = [];
  for (let i = 0; i < monthlyStreams.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = monthlyStreams.slice(start, i + 1);
    const mean = slice.reduce((s, v) => s + v, 0) / slice.length;
    const v = slice.reduce((s, x) => s + (x - mean) ** 2, 0) / slice.length;
    result.push(v);
  }
  return result;
}

/* ── Catalog Segmentation ── */
export type CatalogSegment = "Front Catalog" | "Mid Catalog" | "Back Catalog";

export function segmentArtist(
  monthlyData: { month: string; streams: number }[]
): CatalogSegment {
  if (monthlyData.length < 3) return "Mid Catalog";
  const sorted = [...monthlyData].sort((a, b) => a.month.localeCompare(b.month));
  const half = Math.ceil(sorted.length / 2);
  const recentHalf = sorted.slice(half);
  const earlyHalf = sorted.slice(0, half);
  const recentAvg = recentHalf.reduce((s, r) => s + r.streams, 0) / recentHalf.length;
  const earlyAvg = earlyHalf.reduce((s, r) => s + r.streams, 0) / earlyHalf.length;

  if (earlyAvg === 0) return "Front Catalog";
  const ratio = recentAvg / earlyAvg;
  if (ratio > 1.3) return "Front Catalog";
  if (ratio < 0.7) return "Back Catalog";
  return "Mid Catalog";
}

/* ── Segmented monthly data for stacked chart ── */
export interface SegmentedMonth {
  month: string;
  front: number;
  mid: number;
  back: number;
}

export function buildSegmentedData(
  data: ArtistMonthly[],
  artists: string[]
): SegmentedMonth[] {
  // Classify each artist
  const segments = new Map<string, CatalogSegment>();
  for (const artist of artists) {
    const rows = data.filter((r) => r.artist === artist);
    segments.set(artist, segmentArtist(rows));
  }

  // Aggregate by month and segment
  const monthMap = new Map<string, { front: number; mid: number; back: number }>();
  const topSet = new Set(artists);
  for (const r of data) {
    if (!topSet.has(r.artist)) continue;
    if (!monthMap.has(r.month)) monthMap.set(r.month, { front: 0, mid: 0, back: 0 });
    const entry = monthMap.get(r.month)!;
    const seg = segments.get(r.artist) ?? "Mid Catalog";
    if (seg === "Front Catalog") entry.front += r.streams;
    else if (seg === "Back Catalog") entry.back += r.streams;
    else entry.mid += r.streams;
  }

  return [...monthMap.entries()]
    .map(([month, v]) => ({ month, ...v }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/* ── Portfolio diversification score ── */
export function diversificationScore(artistVolatilities: number[]): number {
  if (artistVolatilities.length <= 1) return 0;
  const mean = artistVolatilities.reduce((s, v) => s + v, 0) / artistVolatilities.length;
  if (mean === 0) return 100;
  // Lower average volatility + more artists = higher diversification
  const avgCV = mean;
  const diversityBonus = Math.min(artistVolatilities.length * 10, 40);
  return Math.min(100, Math.max(0, Math.round(100 - avgCV * 100 + diversityBonus)));
}

/* ── Artist comparison data ── */
export interface ArtistComparisonData {
  artist: string;
  total: number;
  momGrowth: number;
  volatility: number;
  volatilityLabel: "Low" | "Medium" | "High";
  forecastQ: number;
  segment: CatalogSegment;
  monthlyData: { month: string; streams: number }[];
}

export function buildArtistComparison(
  data: ArtistMonthly[],
  artists: string[]
): ArtistComparisonData[] {
  return artists.map((artist) => {
    const rows = data
      .filter((r) => r.artist === artist)
      .sort((a, b) => a.month.localeCompare(b.month));
    const monthlyStreams = rows.map((r) => r.streams);
    const total = monthlyStreams.reduce((s, v) => s + v, 0);
    const last = monthlyStreams[monthlyStreams.length - 1] ?? 0;
    const prev = monthlyStreams[monthlyStreams.length - 2] ?? last;
    const momGrowth = prev > 0 ? ((last - prev) / prev) * 100 : 0;
    const vol = volatilityScore(monthlyStreams);
    const points = rows.map((r, i) => ({ x: i, y: r.streams }));
    const fc = forecast(points, 3);
    const forecastQ = fc.reduce((s, f) => s + f.y, 0);
    const segment = segmentArtist(rows);

    return {
      artist,
      total,
      momGrowth,
      volatility: vol.score,
      volatilityLabel: vol.label,
      forecastQ,
      segment,
      monthlyData: rows.map((r) => ({ month: r.month, streams: r.streams })),
    };
  });
}
