#!/usr/bin/env node
/**
 * Regenerates public/data/spotify_songs.csv from the TidyTuesday source,
 * keeping only the three columns the analytics dashboard reads
 * (track_artist, track_popularity, track_album_release_date). Every row is
 * kept, so all derived numbers are identical to parsing the full file —
 * the site just stops depending on raw.githubusercontent.com at runtime
 * and ships ~6% of the bytes.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import Papa from "papaparse";

const SOURCE =
  "https://raw.githubusercontent.com/rfordatascience/tidytuesday/master/data/2020/2020-01-21/spotify_songs.csv";
const COLUMNS = ["track_artist", "track_popularity", "track_album_release_date"];

const resp = await fetch(SOURCE);
if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
const text = await resp.text();

const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
const rows = parsed.data.map((row) => COLUMNS.map((c) => row[c] ?? ""));

mkdirSync("public/data", { recursive: true });
const out = Papa.unparse({ fields: COLUMNS, data: rows });
writeFileSync("public/data/spotify_songs.csv", out);
console.log(`wrote public/data/spotify_songs.csv (${rows.length} rows, ${(out.length / 1024).toFixed(0)} KB)`);
