import { describe, expect, it } from "vitest";

import { ATLAS_COUNTRY_CENTROIDS } from "../Blipblox/atlasCountryCentroids";
import { DRUM_PRESETS, getCountryMapData } from "./drumPresets";

describe("getCountryMapData", () => {
  it("uses country centroids for mapped countries", () => {
    const countriesByName = new Map(getCountryMapData().map((country) => [country.name, country]));
    const spain = countriesByName.get("Spain");

    expect(spain).toBeDefined();
    expect(spain?.lat).toBeCloseTo(ATLAS_COUNTRY_CENTROIDS.Spain.lat, 6);
    expect(spain?.lng).toBeCloseTo(ATLAS_COUNTRY_CENTROIDS.Spain.lng, 6);
  });

  it("keeps a country-center fallback for Puerto Rico", () => {
    const countriesByName = new Map(getCountryMapData().map((country) => [country.name, country]));
    const puertoRico = countriesByName.get("Puerto Rico");

    expect(puertoRico).toBeDefined();
    expect(puertoRico?.lat).toBeCloseTo(18.220833, 6);
    expect(puertoRico?.lng).toBeCloseTo(-66.590149, 6);
  });

  it("counts the number of rhythms per country from the dataset", () => {
    const expectedCounts = DRUM_PRESETS.reduce<Map<string, number>>((counts, preset) => {
      if (preset.countryCode === "UN") {
        return counts;
      }

      counts.set(preset.countryCode, (counts.get(preset.countryCode) || 0) + 1);
      return counts;
    }, new Map());

    const countriesByCode = new Map(getCountryMapData().map((country) => [country.code, country]));

    expect(countriesByCode.size).toBe(expectedCounts.size);

    expectedCounts.forEach((count, countryCode) => {
      expect(countriesByCode.get(countryCode)?.rhythmCount).toBe(count);
    });
  });
});
