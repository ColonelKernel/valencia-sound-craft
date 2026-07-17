import { describe, expect, it } from "vitest";

import { getSecondaryDominants } from "@/components/ModeVisualizer/chordProgressionUtils";
import { getChordSpellings, getScaleNotes } from "@/components/ModeVisualizer/scaleData";

import { cloneProgression, equalProgressions } from "./chordProgressionModel";

function buildProgression() {
  const scaleNotes = getScaleNotes("C", "Ionian");
  const chordSpellings = getChordSpellings(scaleNotes, "Ionian");
  const progression = getSecondaryDominants("C", "Ionian", chordSpellings).slice(0, 3);
  // Guard: the equality/clone tests are only meaningful with real entries.
  expect(progression.length).toBeGreaterThan(0);
  return progression;
}

describe("equalProgressions", () => {
  it("treats a progression as equal to itself and to its deep clone", () => {
    const progression = buildProgression();
    expect(equalProgressions(progression, progression)).toBe(true);
    expect(equalProgressions(progression, cloneProgression(progression))).toBe(true);
  });

  it("returns false when a single field differs", () => {
    const progression = buildProgression();
    const changed = cloneProgression(progression);
    changed[0] = { ...changed[0], sourceLabel: `${changed[0].sourceLabel} (edited)` };
    expect(equalProgressions(progression, changed)).toBe(false);
  });

  it("returns false on a length mismatch", () => {
    const progression = buildProgression();
    expect(equalProgressions(progression, progression.slice(0, progression.length - 1))).toBe(false);
    expect(equalProgressions(progression, [])).toBe(false);
  });
});

describe("cloneProgression", () => {
  it("deep-copies nested arrays so a later source mutation cannot leak in", () => {
    const progression = buildProgression();
    const clone = cloneProgression(progression);

    // Nested arrays are fresh references, not shared with the source.
    expect(clone[0].chord.notes).not.toBe(progression[0].chord.notes);

    progression[0].chord.notes.push("__leaked__");
    expect(clone[0].chord.notes).not.toContain("__leaked__");
    expect(equalProgressions(clone, cloneProgression(progression))).toBe(false);
  });
});
