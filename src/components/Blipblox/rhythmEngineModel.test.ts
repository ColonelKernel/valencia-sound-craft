import { describe, expect, it } from "vitest";

import {
  filterRhythmLibrary,
  getDefaultRhythmDefinitionForCountry,
  getRhythmDefinitionById,
} from "./rhythmEngineModel";

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
});
