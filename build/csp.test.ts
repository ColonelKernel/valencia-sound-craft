import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The basemap host lives in two places that must agree: the tile URL the map
 * requests, and the `img-src` allowlist in public/_headers. Change one alone
 * and the map goes blank in production only — the dev server sends no CSP, so
 * local verification looks perfect.
 *
 * This is not hypothetical. The host changed once already: CARTO began serving
 * watermarked tiles to keyless callers, which is a 200 with a valid PNG body,
 * so nothing in the app could detect it.
 */

const root = resolve(__dirname, "..");

const mapSource = readFileSync(
  resolve(root, "src/components/Blipblox/GlobalRhythmMap.tsx"),
  "utf8",
);
const headers = readFileSync(resolve(root, "public/_headers"), "utf8");

const cspLine = headers
  .split("\n")
  .find((line) => line.includes("Content-Security-Policy:"));

function directive(name: string): string[] {
  const body = cspLine?.split("Content-Security-Policy:")[1] ?? "";
  const match = body
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `));

  return match ? match.split(/\s+/).slice(1) : [];
}

describe("basemap CSP", () => {
  it("allows the origin the tile layer actually requests", () => {
    const tileUrl = mapSource.match(/const TILE_URL\s*=\s*\n?\s*"([^"]+)"/)?.[1];
    expect(tileUrl, "TILE_URL not found in GlobalRhythmMap.tsx").toBeTruthy();

    const origin = new URL(tileUrl!.replace(/\{[a-z]\}/g, "a")).origin;
    expect(directive("img-src")).toContain(origin);
  });

  it("does not still allow a basemap host nothing requests", () => {
    for (const source of directive("img-src")) {
      if (!source.startsWith("https://")) continue;
      const host = new URL(source).host;
      // i.ytimg.com is the YouTube embed facade's poster frame, not a basemap.
      if (host === "i.ytimg.com") continue;
      expect(
        mapSource,
        `${host} is allowed by img-src but no longer referenced by the map`,
      ).toContain(host);
    }
  });
});
