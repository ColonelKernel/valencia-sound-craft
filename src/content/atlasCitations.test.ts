import { describe, expect, it } from "vitest";

import { GLOBAL_RHYTHM_ATLAS } from "@/components/Blipblox/globalRhythmAtlas";
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
    // 12 traditions passed fetch-verification on 2026-07-21; growing this map
    // is welcome, silently shrinking it is not.
    expect(Object.keys(ATLAS_CITATIONS).length).toBeGreaterThanOrEqual(12);
  });
});
