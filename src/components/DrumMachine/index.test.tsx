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

  it("does not mount the embedded rhythm engine until the Atlas panel is opened", async () => {
    const preset = filterPresets({ region: "flamenco" })[0]!;

    render(
      <DrumMachine
        selectedRhythmId={preset.id}
        selectedRegion={preset.region}
        onRhythmChange={vi.fn()}
      />,
    );

    // The Atlas panel starts closed, so no second GlobalRhythmEngine mounts on
    // load (regression guard for the double-mount fix).
    expect(screen.queryByTestId("embedded-rhythm-engine")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Atlas" }));

    await waitFor(() => {
      expect(screen.getAllByTestId("embedded-rhythm-engine")).toHaveLength(1);
    });
  });
});
