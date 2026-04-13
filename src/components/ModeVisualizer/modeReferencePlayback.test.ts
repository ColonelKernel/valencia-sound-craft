import { describe, expect, it } from "vitest";
import {
  buildModeReferenceSequence,
  MODE_REFERENCE_OCTAVES,
  MODE_REFERENCE_START_OCTAVE,
} from "./modeReferencePlayback";

const PITCH_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function toAbsolutePitch(note: string, octave: number): number {
  return octave * 12 + PITCH_INDEX[note];
}

describe("buildModeReferenceSequence", () => {
  it("starts at the reference octave and spans exactly one octave for diatonic modes", () => {
    const sequence = buildModeReferenceSequence(["C", "D", "E", "F", "G", "A", "B"]);

    expect(sequence[0]).toEqual({ note: "C", octave: MODE_REFERENCE_START_OCTAVE });
    expect(sequence.at(-1)).toEqual({
      note: "C",
      octave: MODE_REFERENCE_START_OCTAVE + MODE_REFERENCE_OCTAVES,
    });
    expect(sequence).toHaveLength(8);

    const span =
      toAbsolutePitch(sequence.at(-1)!.note, sequence.at(-1)!.octave) -
      toAbsolutePitch(sequence[0].note, sequence[0].octave);
    expect(span).toBe(12);
  });

  it("wraps octaves correctly for non-C roots while staying within the same one-octave span", () => {
    const sequence = buildModeReferenceSequence([
      "B",
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
    ]);

    expect(sequence[0]).toEqual({ note: "B", octave: MODE_REFERENCE_START_OCTAVE });
    expect(sequence[1]).toEqual({ note: "C", octave: MODE_REFERENCE_START_OCTAVE + 1 });
    expect(sequence.at(-1)).toEqual({
      note: "B",
      octave: MODE_REFERENCE_START_OCTAVE + MODE_REFERENCE_OCTAVES,
    });
    expect(sequence).toHaveLength(13);

    const span =
      toAbsolutePitch(sequence.at(-1)!.note, sequence.at(-1)!.octave) -
      toAbsolutePitch(sequence[0].note, sequence[0].octave);
    expect(span).toBe(12);
  });
});
