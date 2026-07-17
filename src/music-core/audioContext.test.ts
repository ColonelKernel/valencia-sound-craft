import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Enforces the invariant documented in audioContext.ts: the app must have
 * exactly one AudioContext creation site. Every extra context runs its own
 * clock and counts against the browser's ~6-context cap, so a stray
 * `new AudioContext()` anywhere else is a defect. A static scan turns the
 * comment's promise into a real, fast guard (mirrors routeMeta.test.ts).
 */

const SRC = join(__dirname, "..");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !/\.(test|spec)\.(ts|tsx)$/.test(entry.name)
    ) {
      files.push(full);
    }
  }
  return files;
}

// Matches `new AudioContext(`, `new webkitAudioContext(`, `new OfflineAudioContext(`.
const CREATION = /new\s+\w*AudioContext\s*\(/;

describe("single AudioContext creation site", () => {
  it("only src/music-core/audioContext.ts constructs an AudioContext", () => {
    const offenders = walk(SRC)
      .filter((file) => CREATION.test(readFileSync(file, "utf8")))
      .map((file) => file.slice(file.indexOf(`${join("/", "src")}/`) + 1))
      .sort();

    expect(offenders).toEqual(["src/music-core/audioContext.ts"]);
  });
});
