import { describe, expect, it } from "vitest";

import {
  filterRhythmLibrary,
  getDefaultRhythmDefinitionForCountry,
  getRhythmDefinitionById,
  RHYTHM_LIBRARY,
  validateRhythmLibrary,
} from "./rhythmEngineModel";
import { GLOBAL_RHYTHM_ATLAS } from "./globalRhythmAtlas";

describe("rhythmEngineModel", () => {
  it("resolves shared preset ids into atlas-backed rhythm definitions", () => {
    expect(getRhythmDefinitionById("flamenco_buleria")?.country).toBe("Spain");
    expect(getRhythmDefinitionById("brazil_baiao")?.region).toBe("brazil");
    expect(getRhythmDefinitionById("argentina_chacarera")?.name).toBe("Chacarera");
  });

  it("filters the atlas-backed library by region without leaking other regions", () => {
    const flamencoDefinitions = filterRhythmLibrary({ region: "flamenco" });
    const brazilDefinitions = filterRhythmLibrary({ region: "brazil" });

    expect(flamencoDefinitions.length).toBeGreaterThan(0);
    expect(brazilDefinitions.length).toBeGreaterThan(0);
    expect(flamencoDefinitions.every((definition) => definition.region === "flamenco")).toBe(true);
    expect(brazilDefinitions.every((definition) => definition.region === "brazil")).toBe(true);
  });

  it("returns country defaults that stay aligned with the expected region", () => {
    expect(getDefaultRhythmDefinitionForCountry("Spain")?.region).toBe("flamenco");
    expect(getDefaultRhythmDefinitionForCountry("Brazil")?.country).toBe("Brazil");
  });

  it("validates every sequencer-ready rhythm definition", () => {
    expect(validateRhythmLibrary()).toEqual([]);
  });

  it("keeps every rhythm definition tied to a real atlas country entry", () => {
    const atlasByCountry = new Map(GLOBAL_RHYTHM_ATLAS.map((rhythm) => [rhythm.country, rhythm]));

    RHYTHM_LIBRARY.forEach((definition) => {
      const atlasRhythm = atlasByCountry.get(definition.country);

      expect(atlasRhythm).toBeDefined();
      expect(definition.atlasRhythmId).toBe(atlasRhythm?.id);
      expect(definition.grouping.reduce((total, value) => total + value, 0)).toBe(definition.cycleLength);
      expect(definition.layers.every((layer) => layer.pattern.length === definition.cycleLength)).toBe(true);
      expect(definition.layers.every((layer) => layer.velocity.length === definition.cycleLength)).toBe(true);
    });
  });
});
