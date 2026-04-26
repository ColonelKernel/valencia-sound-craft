import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const INPUT_PATH = fileURLToPath(new URL("../public/data/egmd.json", import.meta.url));
const OUTPUT_PATH = fileURLToPath(new URL("../public/data/groove-intelligence.json", import.meta.url));
const FIELD_LIMIT = 80;

function sampleGrooveSet(raw, limit = FIELD_LIMIT) {
  if (raw.length <= limit) return raw;

  const genreGroups = new Map();
  for (const groove of raw) {
    const key = groove.genre || "unknown";
    const group = genreGroups.get(key);
    if (group) group.push(groove);
    else genreGroups.set(key, [groove]);
  }

  const orderedGroups = [...genreGroups.entries()].sort(([left], [right]) => left.localeCompare(right));
  const allocations = new Map();
  let assigned = 0;

  for (const [genre, items] of orderedGroups) {
    const share = Math.max(1, Math.floor((items.length / raw.length) * limit));
    const allocation = Math.min(items.length, share);
    allocations.set(genre, allocation);
    assigned += allocation;
  }

  while (assigned > limit) {
    const next = orderedGroups
      .map(([genre, items]) => ({ genre, room: allocations.get(genre) - 1, size: items.length }))
      .filter((item) => item.room > 0)
      .sort((left, right) => right.room - left.room || right.size - left.size)[0];

    if (!next) break;
    allocations.set(next.genre, allocations.get(next.genre) - 1);
    assigned -= 1;
  }

  while (assigned < limit) {
    const next = orderedGroups
      .map(([genre, items]) => ({ genre, remaining: items.length - allocations.get(genre) }))
      .filter((item) => item.remaining > 0)
      .sort((left, right) => right.remaining - left.remaining)[0];

    if (!next) break;
    allocations.set(next.genre, allocations.get(next.genre) + 1);
    assigned += 1;
  }

  const sample = [];
  for (const [genre, items] of orderedGroups) {
    const count = allocations.get(genre) ?? 0;
    if (count <= 0) continue;
    if (count >= items.length) {
      sample.push(...items);
      continue;
    }

    const step = items.length / count;
    for (let index = 0; index < count; index += 1) {
      sample.push(items[Math.min(items.length - 1, Math.floor(index * step))]);
    }
  }

  return sample.slice(0, limit);
}

function extent(arr, selector) {
  let min = Infinity;
  let max = -Infinity;

  for (const item of arr) {
    const value = selector(item);
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return [min, max];
}

const source = JSON.parse(await readFile(INPUT_PATH, "utf8"));
const grooves = sampleGrooveSet(source, FIELD_LIMIT);

const payload = {
  totalCount: source.length,
  referenceRanges: {
    bpm: extent(source, (groove) => groove.bpm),
    density: extent(source, (groove) => groove.note_density),
    syncopation: extent(source, (groove) => groove.syncopation),
    swing: extent(source, (groove) => groove.swing_ratio),
    velocity: extent(source, (groove) => groove.velocity_variance),
  },
  grooves,
};

await writeFile(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Wrote ${payload.grooves.length} sampled grooves to ${OUTPUT_PATH}`);
