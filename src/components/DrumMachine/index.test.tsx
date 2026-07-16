import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../Blipblox/GlobalRhythmEngine", () => ({
  default: () => <div data-testid="embedded-rhythm-engine" />,
}));

import DrumMachine from "./index";
import {
  filterPresets,
  formatRegion,
} from "./drumPresets";

describe("DrumMachine", () => {
  it("propagates local preset changes before controlled props catch up", async () => {
    const startingPreset = filterPresets({ region: "flamenco" })[0]!;
    const nextPreset = filterPresets({ region: "brazil" })[0]!;
    const onRhythmChange = vi.fn();

    render(
      <DrumMachine
        selectedRhythmId={startingPreset.id}
        selectedRegion={startingPreset.region}
        onRhythmChange={onRhythmChange}
      />,
    );

    onRhythmChange.mockClear();
    fireEvent.click(
      screen.getAllByRole("button", { name: new RegExp(`^${formatRegion(nextPreset.region)}\\b`, "i") })[0],
    );

    await waitFor(() => {
      expect(onRhythmChange).toHaveBeenCalledWith({
        rhythmId: nextPreset.id,
        region: nextPreset.region,
        country: nextPreset.country,
        suggestedTempo: nextPreset.bpm,
      });
    });
  });

  it("does not echo controlled preset hydration back through onRhythmChange", async () => {
    const startingPreset = filterPresets({ region: "flamenco" })[0]!;
    const nextPreset = filterPresets({ region: "brazil" })[0]!;
    const onRhythmChange = vi.fn();

    const { rerender } = render(
      <DrumMachine
        selectedRhythmId={startingPreset.id}
        selectedRegion={startingPreset.region}
        onRhythmChange={onRhythmChange}
      />,
    );

    await waitFor(() => {
      expect(onRhythmChange).not.toHaveBeenCalled();
    });

    rerender(
      <DrumMachine
        selectedRhythmId={nextPreset.id}
        selectedRegion={nextPreset.region}
        onRhythmChange={onRhythmChange}
      />,
    );

    await waitFor(() => {
      expect(onRhythmChange).not.toHaveBeenCalled();
    });
  });
});
