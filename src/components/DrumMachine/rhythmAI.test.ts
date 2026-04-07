import { describe, expect, it } from "vitest";

import {
  RHYTHM_RULES,
  correctRhythm,
  generateValidRhythm,
  scoreRhythm,
  validateRhythm,
  type RhythmPattern,
} from "@/lib/rhythm-ai";

describe("AI rhythm generation", () => {
  it("generates valid rhythms", () => {
    const rhythm = generateValidRhythm("flamenco", { seed: 7 });
    const validation = validateRhythm(rhythm);

    expect(rhythm).toBeDefined();
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it("scores rhythms positively", () => {
    const rhythm = generateValidRhythm("afro_cuban", { seed: 11 });
    const score = scoreRhythm(rhythm);

    expect(score).toBeGreaterThan(1);
  });

  it("adds missing required roles and repairs density", () => {
    const weakRhythm: RhythmPattern = {
      id: "weak_1",
      name: "Weak Rhythm",
      region: "middle_east",
      meter: "9/8",
      subdivision: [2, 2, 2, 3],
      tempoRange: [90, 130],
      instruments: [{ id: "darbuka_tek", name: "Darbuka Tek", instrument: "Darbuka", role: "lead", midiNote: 42 }],
      pattern: {
        darbuka_tek: [1, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      feel: "additive",
      tags: ["generated"],
    };

    const corrected = correctRhythm(weakRhythm, { seed: 21 });
    const validation = validateRhythm(corrected);

    expect(corrected).not.toBe(weakRhythm);
    expect(corrected.instruments.some((instrument) => instrument.role === "timeline")).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("honors region rule maps across the generated corpus", () => {
    (
      Object.keys(RHYTHM_RULES) as Array<keyof typeof RHYTHM_RULES>
    ).forEach((region) => {
      const rhythm = generateValidRhythm(region, { seed: region.length * 100 });
      const validation = validateRhythm(rhythm);

      expect(validation.valid).toBe(true);
      expect(
        RHYTHM_RULES[region].requiredRoles.every((role) =>
          rhythm.instruments.some((instrument) => instrument.role === role)
        )
      ).toBe(true);
      expect(
        RHYTHM_RULES[region].allowedSubdivisions.some(
          (candidate) =>
            candidate.length === rhythm.subdivision.length &&
            candidate.every((value, index) => value === rhythm.subdivision[index])
        )
      ).toBe(true);
    });
  });
});
