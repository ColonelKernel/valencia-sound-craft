import Papa from "papaparse";

/**
 * DEMONSTRATION DATASET — NOT LIVE STREAMING DATA.
 *
 * Source: the public 2020 TidyTuesday Spotify songs sample. "Streams" are
 * modeled proxies (track_popularity × 1,000,000) bucketed by album release
 * month; when release dates are missing, months are synthesized. Any
 * user-facing copy must describe this as modeled demonstration data.
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

  // Map rows → ChartRow using track_artist, track_popularity, track_album_release_date
  const rows: ChartRow[] = [];
  for (const row of parsed.data) {
    const artist = row["track_artist"]?.trim();
    if (!artist) continue;

    const popularity = parseInt(row["track_popularity"] ?? "0", 10);
    // Use popularity as a proxy for "streams" (scale up for realistic numbers)
    const streams = isNaN(popularity) ? 0 : popularity * 1_000_000;

    const date = row["track_album_release_date"]?.trim() ?? "";
    rows.push({ artist, streams, date });
  }

  const monthly = aggregateToMonthly(rows);
  const topArtists = getTopArtists(monthly, 5);

  cache = { monthly, topArtists };
  return cache;
}

function aggregateToMonthly(rows: ChartRow[]): ArtistMonthly[] {
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

  // If date-based aggregation produced nothing, synthesize months
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
