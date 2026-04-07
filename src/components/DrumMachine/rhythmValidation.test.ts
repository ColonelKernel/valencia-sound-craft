import { describe, expect, it } from "vitest";

import { getInstrument } from "./drumSoundEngine";
import {
  filterRhythms,
  rhythmDataset,
} from "./drumPresets";
import {
  getRhythmRegionLabel,
  validateMusicalIntegrity,
  validateRhythms,
} from "./rhythmValidation";

describe("filterRhythms", () => {
  it("filters by region correctly", () => {
    const result = filterRhythms({ region: "flamenco" });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((rhythm) => getRhythmRegionLabel(rhythm) === "flamenco")).toBe(true);
  });

  it("filters by BPM range", () => {
    const result = filterRhythms({ region: "brazil", bpm: 120 });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((rhythm) =>
      getRhythmRegionLabel(rhythm) === "brazil" &&
      rhythm.tempoRange[0] <= 120 &&
      rhythm.tempoRange[1] >= 120,
    )).toBe(true);
  });

  it("returns deterministic results for the same filters", () => {
    const first = filterRhythms({ region: "middle_east", bpm: 110 }).map((rhythm) => rhythm.name);
    const second = filterRhythms({ region: "middle_east", bpm: 110 }).map((rhythm) => rhythm.name);

    expect(first).toEqual(second);
  });
});

describe("rhythm validation", () => {
  it("validates all rhythms", () => {
    const validated = validateRhythms(rhythmDataset);

    expect(validated.length).toBeGreaterThan(0);
  });

  it("ensures all rhythms pass musical validation", () => {
    rhythmDataset.forEach((rhythm) => {
      expect(() => validateMusicalIntegrity(rhythm)).not.toThrow();
    });
  });
});

describe("timbre mapping", () => {
  it("ensures all pattern keys have timbres", () => {
    rhythmDataset.forEach((rhythm) => {
      rhythm.tracks.forEach((track) => {
        expect(getInstrument(track.instrumentId)).toBeTruthy();
      });

      rhythm.variationTracks?.forEach((track) => {
        expect(getInstrument(track.instrumentId)).toBeTruthy();
      });
    });
  });
});
