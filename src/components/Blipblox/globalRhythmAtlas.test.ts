import { describe, expect, it } from "vitest";

import { ATLAS_COUNTRY_CENTROIDS } from "./atlasCountryCentroids";
import {
  CANONICAL_COUNTRY_LIST,
  filterAtlasRhythms,
  getAtlasRhythmByCountry,
  GLOBAL_RHYTHM_ATLAS,
  validateGlobalRhythmAtlas,
} from "./globalRhythmAtlas";

describe("globalRhythmAtlas", () => {
  it("covers all 195 globally recognized countries", () => {
    expect(CANONICAL_COUNTRY_LIST).toHaveLength(195);
    expect(GLOBAL_RHYTHM_ATLAS).toHaveLength(195);
    expect(new Set(GLOBAL_RHYTHM_ATLAS.map((rhythm) => rhythm.country)).size).toBe(195);
  });

  it("validates the full atlas without structural errors", () => {
    expect(validateGlobalRhythmAtlas()).toEqual([]);
  });

  it("keeps the required examples aligned with their classification", () => {
    const argentina = getAtlasRhythmByCountry("Argentina");
    const bulgaria = getAtlasRhythmByCountry("Bulgaria");
    const india = getAtlasRhythmByCountry("India");
    const japan = getAtlasRhythmByCountry("Japan");
    const luxembourg = getAtlasRhythmByCountry("Luxembourg");
    const coteDIvoire = getAtlasRhythmByCountry("Cote d'Ivoire");

    expect(argentina?.name).toBe("Chacarera");
    expect(argentina?.classification).toBe("documented");

    expect(bulgaria?.meter).toBe("7/8");
    expect(bulgaria?.subdivision).toEqual([2, 2, 3]);
    expect(bulgaria?.classification).toBe("documented");

    expect(india?.name).toBe("Teentaal");
    expect(india?.classification).toBe("documented");

    expect(japan?.timbreProfile).toBe("taiko");
    expect(japan?.classification).toBe("documented");

    expect(luxembourg?.classification).toBe("regional");
    expect(luxembourg?.meter).toBe("3/4");
    expect(luxembourg?.name).toBe("Western European Waltz");

    expect(coteDIvoire?.classification).toBe("regional");
  });

  it("supports country, continent, and meter filters", () => {
    const byCountry = filterAtlasRhythms({ country: "Japan" });
    const byContinent = filterAtlasRhythms({ continent: "Africa" });
    const byMeter = filterAtlasRhythms({ meter: "7/8" });

    expect(byCountry).toHaveLength(1);
    expect(byCountry[0]?.country).toBe("Japan");

    expect(byContinent.length).toBeGreaterThan(0);
    expect(byContinent.every((rhythm) => rhythm.continent === "Africa")).toBe(true);

    expect(byMeter.length).toBeGreaterThan(0);
    expect(byMeter.every((rhythm) => rhythm.meter === "7/8")).toBe(true);
  });

  it("normalizes every atlas entry to a 32-step grid", () => {
    GLOBAL_RHYTHM_ATLAS.forEach((rhythm) => {
      expect(rhythm.midiPattern).toHaveLength(32);
      expect(rhythm.accents).toHaveLength(32);
    });
  });

  it("has a real centroid for every atlas country", () => {
    expect(Object.keys(ATLAS_COUNTRY_CENTROIDS)).toHaveLength(195);

    GLOBAL_RHYTHM_ATLAS.forEach((rhythm) => {
      expect(ATLAS_COUNTRY_CENTROIDS[rhythm.country]).toBeDefined();
    });
  });
});
