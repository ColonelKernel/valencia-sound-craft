import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  getScaleNotes,
  getChordSpellings,
} from "./scaleData";
import { getSecondaryDominants } from "./chordProgressionUtils";
import ChordProgressionBuilder from "./ChordProgressionBuilder";

describe("ChordProgressionBuilder", () => {
  it("hydrates controlled progressions after prop updates", () => {
    const scaleNotes = getScaleNotes("C", "Ionian");
    const chordSpellings = getChordSpellings(scaleNotes, "Ionian");
    const [secondaryDominant] = getSecondaryDominants("C", "Ionian", chordSpellings);

    const { rerender } = render(
      <ChordProgressionBuilder
        chordSpellings={chordSpellings}
        root="C"
        mode="Ionian"
        chordProgression={[]}
      />,
    );

    expect(screen.queryByText("V7/II")).not.toBeInTheDocument();

    rerender(
      <ChordProgressionBuilder
        chordSpellings={chordSpellings}
        root="C"
        mode="Ionian"
        chordProgression={[secondaryDominant]}
      />,
    );

    expect(screen.getByText("V7/II")).toBeInTheDocument();
    expect(screen.getByText(/resolves to IIm7/i)).toBeInTheDocument();
  });

  it("does not echo controlled progression hydration back through onProgressionChange", () => {
    const scaleNotes = getScaleNotes("C", "Ionian");
    const chordSpellings = getChordSpellings(scaleNotes, "Ionian");
    const [secondaryDominant] = getSecondaryDominants("C", "Ionian", chordSpellings);
    const onProgressionChange = vi.fn();

    const { rerender } = render(
      <ChordProgressionBuilder
        chordSpellings={chordSpellings}
        root="C"
        mode="Ionian"
        chordProgression={[secondaryDominant]}
        onProgressionChange={onProgressionChange}
      />,
    );

    expect(onProgressionChange).not.toHaveBeenCalled();

    rerender(
      <ChordProgressionBuilder
        chordSpellings={chordSpellings}
        root="C"
        mode="Ionian"
        chordProgression={[]}
        onProgressionChange={onProgressionChange}
      />,
    );

    expect(onProgressionChange).not.toHaveBeenCalled();
  });
});
