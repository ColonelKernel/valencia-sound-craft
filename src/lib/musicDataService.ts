import Papa from "papaparse";

/**
 * DEMONSTRATION DATASET — NOT LIVE STREAMING DATA.
 *
 * Source: the public 2020 TidyTuesday Spotify songs sample. "Streams" are
 * modeled proxies (track_popularity × 1,000,000) bucketed by album release
 * month; when release dates are missing, months are synthesized. Any
 * user-facing copy must describe this as modeled demonstration data.
 *
 * Export rule, as in catalogAnalytics.ts: a symbol is exported because a
 * component imports it or because musicDataService.test.ts pins its rule
 * directly. toChartRows and aggregateToMonthly are exported for the second
 * reason — the synthetic fallback is disclosed by name on the case-study
 * page, so it is tested at the function rather than through a fetch stub.
 */
export interface ChartRow {
  artist: string;
  date: string;
  streams: number;
}

export interface ArtistMonthly {
  artist: string;
  month: string; // YYYY-MM
  streams: number;
}

interface FetchResult {
  monthly: ArtistMonthly[];
  topArtists: string[];
}

let cache: FetchResult | null = null;

const DATA_URL =
  // Self-hosted slim of the TidyTuesday 2020-01-21 spotify_songs.csv (all
// 32,833 rows, only the three columns this service reads — regenerate with
// scripts/slim-spotify-csv.mjs). No third-party dependency at runtime.
  "/data/spotify_songs.csv";

export async function fetchAndParseChartData(): Promise<FetchResult> {
  if (cache) return cache;

  const resp = await fetch(DATA_URL);
  if (!resp.ok) throw new Error("Unable to fetch chart data. Please try again later.");
  const text = await resp.text();

  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (!parsed.data?.length) throw new Error("No data found in dataset.");

  const monthly = aggregateToMonthly(toChartRows(parsed.data));
  const topArtists = getTopArtists(monthly, 5);

  cache = { monthly, topArtists };
  return cache;
}

/**
 * Parsed CSV records → ChartRow, reading the only three columns this service
 * touches: track_artist, track_popularity, track_album_release_date.
 *
 * Popularity is an integer 0-100; multiplying by a million is what makes the
 * axes read like streams. It is the single step that turns a popularity
 * sample into something a reader may mistake for listening data, which is why
 * every page that renders the result says so.
 */
export function toChartRows(records: Record<string, string>[]): ChartRow[] {
  const rows: ChartRow[] = [];
  for (const row of records) {
    const artist = row["track_artist"]?.trim();
    if (!artist) continue;

    const popularity = parseInt(row["track_popularity"] ?? "0", 10);
    const streams = isNaN(popularity) ? 0 : popularity * 1_000_000;

    const date = row["track_album_release_date"]?.trim() ?? "";
    rows.push({ artist, streams, date });
  }
  return rows;
}

export function aggregateToMonthly(rows: ChartRow[]): ArtistMonthly[] {
  const map = new Map<string, number>();

  // Check if dates have month granularity
  const hasDates = rows.some((r) => r.date && r.date.length >= 7);

  if (hasDates) {
    for (const r of rows) {
      const month = r.date.slice(0, 7);
      if (month.length < 7 || !month.includes("-")) continue;
      const key = `${r.artist}|||${month}`;
      map.set(key, (map.get(key) ?? 0) + r.streams);
    }
  }

  // If date-based aggregation produced nothing, synthesize months.
  //
  // Disclosed by name on /projects/catalog-intelligence, and it does not fire
  // on the shipped dataset. Two properties worth stating since the page
  // describes this shape in prose: the factor runs 0.55 to 1.15 across the
  // twelve discrete months, not 0.85 to 1.15 — 0.85 is the offset, not the
  // floor — and because the twelve sine terms cancel over a full period, the
  // factors sum to 10.2 rather than 12, so a synthesized year carries 85% of
  // the artist's real total. Both are pinned in musicDataService.test.ts.
  if (map.size === 0) {
    const artistTotals = new Map<string, number>();
    for (const r of rows) {
      artistTotals.set(r.artist, (artistTotals.get(r.artist) ?? 0) + r.streams);
    }
    const baseYear = new Date().getFullYear() - 1;
    for (const [artist, total] of artistTotals) {
      for (let m = 0; m < 12; m++) {
        const month = `${baseYear}-${String(m + 1).padStart(2, "0")}`;
        const factor = 0.85 + 0.3 * Math.sin((m * Math.PI) / 6);
        const key = `${artist}|||${month}`;
        map.set(key, Math.round((total / 12) * factor));
      }
    }
  }

  const result: ArtistMonthly[] = [];
  for (const [key, streams] of map) {
    const [artist, month] = key.split("|||");
    result.push({ artist, month, streams });
  }
  result.sort((a, b) => a.month.localeCompare(b.month));
  return result;
}

function getTopArtists(monthly: ArtistMonthly[], n = 5): string[] {
  const totals = new Map<string, number>();
  for (const r of monthly) {
    totals.set(r.artist, (totals.get(r.artist) ?? 0) + r.streams);
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([a]) => a);
}
