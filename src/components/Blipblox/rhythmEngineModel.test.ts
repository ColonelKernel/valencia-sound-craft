import { describe, expect, it } from "vitest";

import {
  filterRhythmLibrary,
  getDefaultRhythmDefinitionForCountry,
  validateRhythmLibrary,
} from "./rhythmEngineModel";

describe("rhythmEngineModel", () => {
  it("promotes documented countries into structured multi-layer rhythms", () => {
    const spain = getDefaultRhythmDefinitionForCountry("Spain");
    const cuba = getDefaultRhythmDefinitionForCountry("Cuba");

    expect(spain?.name).toBe("Buleria");
    expect(spain?.grouping).toEqual([3, 3, 2, 2, 2]);
    expect(spain?.layers.length).toBeGreaterThanOrEqual(3);
    expect(spain?.instrumentRoles.low).toBeTruthy();
    expect(spain?.instrumentRoles.mid).toBeTruthy();
    expect(spain?.instrumentRoles.high).toBeTruthy();

    expect(cuba?.name).toContain("Son Clave");
    expect(cuba?.layers.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps fallback atlas countries validated and playable", () => {
    const luxembourg = getDefaultRhythmDefinitionForCountry("Luxembourg");

    expect(luxembourg?.classification).toBe("proxy");
    expect(luxembourg?.layers.length).toBeGreaterThanOrEqual(3);
    expect(luxembourg?.sources.length).toBeGreaterThan(0);
  });

  it("supports browser filtering by region and meter", () => {
    const results = filterRhythmLibrary({
      region: "balkans",
      meter: "7/8",
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((rhythm) => rhythm.region === "balkans")).toBe(true);
    expect(results.every((rhythm) => rhythm.meter === "7/8")).toBe(true);
  });

  it("validates the full structured rhythm library", () => {
    expect(validateRhythmLibrary()).toEqual([]);
  });
});
