import { describe, expect, it } from "vitest";

import { getTransitNetworkById } from "./transitSynthData";
import {
  generateTransitSequence,
  getStationSoundProfile,
  getTransitNetworkMetrics,
  TRANSIT_STYLE_PRESETS,
  type TransitEngineControls,
} from "./transitSynthEngine";

const baseControls: TransitEngineControls = {
  scaleMode: "dorian",
  styleMode: "cartographic",
  sequenceMode: "route-solo",
  selectedLineId: "bart-red",
  tempo: 112,
  urbanDensity: 58,
  order: 54,
};

describe("transit synth engine", () => {
  it("derives stable graph metrics for a network", () => {
    const network = getTransitNetworkById("bart");
    const metrics = getTransitNetworkMetrics(network);

    expect(metrics.stationCount).toBeGreaterThan(8);
    expect(metrics.edgeCount).toBeGreaterThan(8);
    expect(metrics.transferCount).toBeGreaterThan(1);
    expect(metrics.density).toBeGreaterThan(0);
  });

  it("keeps route solo traversal in line order", () => {
    const network = getTransitNetworkById("madrid-metro");
    const events = generateTransitSequence(network, {
      ...baseControls,
      selectedLineId: "madrid-line-1",
      sequenceMode: "route-solo",
      order: 92,
    });

    expect(events.slice(0, 4).map((event) => event.stationId)).toEqual([
      "chamartin",
      "plaza-castilla",
      "tribunal",
      "gran-via",
    ]);
  });

  it("quantizes pitch output to the selected scale family", () => {
    const network = getTransitNetworkById("tokyo-metro");
    const profile = getStationSoundProfile(network, "shibuya", {
      ...baseControls,
      styleMode: "tokyo-minimal-precision",
      scaleMode: "mixolydian",
      selectedLineId: "tokyo-ginza",
    });

    const rootMidi = TRANSIT_STYLE_PRESETS["tokyo-minimal-precision"].rootMidi;
    const pitchClass = ((profile.midi - rootMidi) % 12 + 12) % 12;

    expect([0, 2, 4, 5, 7, 9, 10]).toContain(pitchClass);
  });
});
