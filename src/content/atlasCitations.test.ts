import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { GLOBAL_RHYTHM_ATLAS } from "@/components/Blipblox/globalRhythmAtlas";
import { ATLAS_COUNTRY_CENTROIDS } from "@/components/Blipblox/atlasCountryCentroids";
import { MAX_RENDERED_GROOVES } from "@/components/GrooveIntelligence/utils";
import { ATLAS_CITATIONS, getScholarshipForRhythm } from "./atlasCitations";

/**
 * The citation layer must stay welded to the atlas: every citation key
 * resolves to at least one hydrated documented rhythm, and every citation is a
 * well-formed https reference. A key that matches nothing is dead weight; a
 * malformed URL would ship a broken "source" — both are publishing defects.
 */

function templateIdOf(rhythmId: string, country: string): string {
  const slug = country.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return rhythmId.endsWith(`-${slug}`) ? rhythmId.slice(0, -(slug.length + 1)) : rhythmId;
}

const documented = GLOBAL_RHYTHM_ATLAS.filter((rhythm) => rhythm.classification === "documented");
const documentedTemplateIds = new Set(documented.map((r) => templateIdOf(r.id, r.country)));

describe("ATLAS_CITATIONS", () => {
  it("every citation key matches a documented atlas template", () => {
    for (const key of Object.keys(ATLAS_CITATIONS)) {
      expect(documentedTemplateIds.has(key), `${key} matches no documented rhythm`).toBe(true);
    }
  });

  it("every citation is a well-formed https reference with title and publisher", () => {
    for (const [key, scholarship] of Object.entries(ATLAS_CITATIONS)) {
      expect(scholarship.citations.length, `${key} has no citations`).toBeGreaterThan(0);
      for (const citation of scholarship.citations) {
        expect(new URL(citation.url).protocol).toBe("https:");
        expect(citation.title.length).toBeGreaterThan(3);
        expect(citation.publisher.length).toBeGreaterThan(1);
      }
    }
  });

  it("resolves scholarship through hydrated rhythm ids (country suffix stripped)", () => {
    const cuba = GLOBAL_RHYTHM_ATLAS.find((rhythm) => rhythm.country === "Cuba");
    expect(cuba).toBeDefined();
    const scholarship = getScholarshipForRhythm(cuba!.id, cuba!.country);
    expect(scholarship?.citations.length).toBeGreaterThan(0);
  });

  it("covers every researched documented tradition", () => {
    // 39 traditions passed fetch-verification (12 original + 27 expansion,
    // 2026-07-21); growing this map is welcome, silently shrinking it is not.
    expect(Object.keys(ATLAS_CITATIONS).length).toBeGreaterThanOrEqual(39);
  });
});

describe("the numbers /groove-atlas states about this data", () => {
  /**
   * The page quotes three figures in prose. They were correct when written and
   * nothing kept them that way — the existing coverage asserts only
   * `>= 39` traditions, so adding a tradition would silently falsify the page.
   *
   * Importing this data into the route would pull the whole citation corpus
   * into a chunk that the feel-space lens does not need, so the numbers stay
   * as literals and this test is what pins them, exactly as
   * src/app/ogCard.test.ts pins the social card's copy.
   */
  const page = readFileSync(
    join(__dirname, "..", "pages", "GrooveAtlasPage.tsx"),
    "utf8",
  );

  it("states the citation and tradition counts this file actually contains", () => {
    const traditions = Object.keys(ATLAS_CITATIONS).length;
    const citations = Object.values(ATLAS_CITATIONS).reduce(
      (total, entry) => total + entry.citations.length,
      0,
    );
    expect(page).toContain(`${citations} ethnomusicological citations`);
    expect(page).toContain(`attached to ${traditions} of`);
  });

  it("states the centroid count the atlas map actually plots", () => {
    // Keyed by country code, not an array.
    const centroids = Object.keys(ATLAS_COUNTRY_CENTROIDS).length;
    expect(page).toContain(`Leaflet over ${centroids}`);
  });

  it("states the number of grooves k-means actually sees", () => {
    // Not the dataset's row count: index.tsx dedupes, then samples to
    // MAX_RENDERED_GROOVES before clusterGrooves is called.
    expect(page).toContain(`k-means over ${MAX_RENDERED_GROOVES} grooves`);
  });
});
