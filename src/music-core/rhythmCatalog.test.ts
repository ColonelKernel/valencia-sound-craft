import { describe, expect, it } from "vitest";

import { getMusicRhythmById, getMusicRhythmsByRegion, MUSIC_RHYTHM_DATASET } from "./rhythmCatalog";

describe("rhythmCatalog", () => {
  it("normalizes the authored rhythm dataset into a single shared catalog", () => {
    expect(MUSIC_RHYTHM_DATASET.length).toBeGreaterThan(0);

    const buleria = getMusicRhythmById("flamenco_buleria");

    expect(buleria?.country).toBe("Spain");
    expect(buleria?.timeSignature).toBe("12/8");
    expect(buleria?.pattern.length).toBeGreaterThan(0);
  });

  it("supports region-level lookups from the shared catalog", () => {
    const balkanRhythms = getMusicRhythmsByRegion("balkans");

    expect(balkanRhythms.length).toBeGreaterThan(0);
    expect(balkanRhythms.every((rhythm) => rhythm.region === "balkans")).toBe(true);
  });
});

