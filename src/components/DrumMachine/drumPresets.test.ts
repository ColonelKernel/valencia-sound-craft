import { describe, expect, it } from "vitest";

import { ATLAS_COUNTRY_CENTROIDS } from "../Blipblox/atlasCountryCentroids";
import { DRUM_PRESETS, filterRhythms, getCountryMapData } from "./drumPresets";
import { getInstrument } from "./drumSoundEngine";

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

describe("filterRhythms", () => {
  it("filters by region correctly", () => {
    const result = filterRhythms({ region: "flamenco" });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((rhythm) => rhythm.region === "flamenco")).toBe(true);
  });

  it("filters by BPM range", () => {
    const result = filterRhythms({ region: "brazil", bpm: 120 });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((rhythm) =>
      rhythm.region === "brazil" &&
      rhythm.tempoRange[0] <= 120 &&
      rhythm.tempoRange[1] >= 120,
    )).toBe(true);
  });

  it("returns deterministic results for the same filters", () => {
    const first = filterRhythms({ region: "middle_east", bpm: 110 }).map((rhythm) => rhythm.name);
    const second = filterRhythms({ region: "middle_east", bpm: 110 }).map((rhythm) => rhythm.name);

    // Comparing the two calls alone passes for any pure function, including
    // one that returns nothing — which is what this asserted before. The
    // determinism claim is only worth making about a non-empty result, and
    // the order has to be stable, not just the membership.
    expect(first.length).toBeGreaterThan(0);
    expect(first).toEqual(second);

    // And it has to be a filter, not a pass-through: the determinism of
    // "return everything" is not the property being claimed.
    expect(first.length).toBeLessThan(DRUM_PRESETS.length);
  });
});

describe("timbre mapping", () => {
  it("ensures all pattern keys have timbres", () => {
    DRUM_PRESETS.forEach((rhythm) => {
      rhythm.tracks.forEach((track) => {
        expect(getInstrument(track.instrumentId)).toBeTruthy();
      });

      rhythm.variationTracks?.forEach((track) => {
        expect(getInstrument(track.instrumentId)).toBeTruthy();
      });
    });
  });
});
