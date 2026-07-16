#!/usr/bin/env node
/**
 * Bundle budget gate ("lightning fast, no exceptions").
 *
 * Reads dist/bundle-report.json (written by `vite build --mode analyze`,
 * which `npm run budget` runs first) and computes the INITIAL GRAPH of the
 * homepage: the entry chunk plus everything it statically imports, plus the
 * entry CSS. Fails if:
 *   - the gzip total exceeds BUDGET_KB, or
 *   - any banned heavy library's modules appear in the initial graph.
 *
 * Lazy routes may be as heavy as they need to be; the budget protects what
 * every visitor pays before interaction.
 */
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const BUDGET_KB = 150;
const BANNED = /node_modules\/(recharts|leaflet|react-leaflet|framer-motion|motion-dom|@supabase\/|jspdf|abcjs|lodash|html2canvas|canvg)\//;

const dist = path.resolve("dist");
let report;
try {
  report = JSON.parse(readFileSync(path.join(dist, "bundle-report.json"), "utf8"));
} catch {
  console.error("budget: dist/bundle-report.json missing — run `vite build --mode analyze` first (npm run budget does).");
  process.exit(1);
}

const chunks = new Map(report.filter((c) => c.type === "chunk").map((c) => [c.fileName, c]));
const entry = report.find((c) => c.type === "chunk" && c.modules?.some((m) => m.endsWith("src/main.tsx")));

if (!entry) {
  console.error("budget: could not locate the entry chunk (src/main.tsx).");
  process.exit(1);
}

// Walk static imports transitively.
const initial = new Set();
const queue = [entry.fileName];
while (queue.length) {
  const name = queue.shift();
  if (initial.has(name)) continue;
  initial.add(name);
  for (const dep of chunks.get(name)?.imports ?? []) {
    queue.push(dep);
  }
}

// Entry CSS assets.
const cssAssets = report
  .filter((c) => c.type === "asset" && c.fileName.endsWith(".css") && c.fileName.includes("index-"))
  .map((c) => c.fileName);

const files = [...initial, ...cssAssets];
let total = 0;
const rows = [];
for (const file of files) {
  const bytes = gzipSync(readFileSync(path.join(dist, file))).length;
  total += bytes;
  rows.push(`  ${file}  ${(bytes / 1024).toFixed(1)} KB gz`);
}

const offenders = [];
for (const name of initial) {
  for (const mod of chunks.get(name)?.modules ?? []) {
    const match = mod.match(BANNED);
    if (match) {
      offenders.push(`${match[1]} (in ${name})`);
    }
  }
}

console.log("Initial graph (entry + static imports + css):");
console.log(rows.join("\n"));
console.log(`TOTAL: ${(total / 1024).toFixed(1)} KB gzip (budget ${BUDGET_KB} KB)`);

let failed = false;
if (total > BUDGET_KB * 1024) {
  console.error(`budget: FAIL — initial graph ${(total / 1024).toFixed(1)} KB gz exceeds ${BUDGET_KB} KB.`);
  failed = true;
}
if (offenders.length) {
  console.error(`budget: FAIL — banned libraries in the initial graph:\n  ${[...new Set(offenders)].join("\n  ")}`);
  failed = true;
}

if (failed) process.exit(1);
console.log("budget: PASS");
