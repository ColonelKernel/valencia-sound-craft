import { describe, expect, it } from "vitest";

import {
  getDefaultRecommendationControls,
  getMusicIntelligenceBundle,
} from "./musicIntelligenceEngine";

describe("music intelligence engine", () => {
  it("returns ranked recommendations with explainable output", () => {
    const bundle = getMusicIntelligenceBundle(getDefaultRecommendationControls());

    expect(bundle.recommendations).toHaveLength(6);
    expect(bundle.recommendations[0].track.id).not.toBe(bundle.seedTrack.id);
    expect(bundle.recommendations[0].hybridScore).toBeGreaterThan(bundle.recommendations[4].hybridScore);
    expect(bundle.recommendations[0].explanation.length).toBeGreaterThan(2);
    expect(bundle.primaryMode.length).toBeGreaterThan(2);
  });

  it("boosts guitar-forward tracks when guitarist mode is enabled", () => {
    const controls = getDefaultRecommendationControls();

    const withGuitaristMode = getMusicIntelligenceBundle({
      ...controls,
      seedTrackId: "valencia-afterglow",
      chordProgressionId: "mixolydian-pocket",
      blendArtistId: "dire-straits",
      guitaristMode: true,
      globalPulse: false,
    });

    const withoutGuitaristMode = getMusicIntelligenceBundle({
      ...controls,
      seedTrackId: "valencia-afterglow",
      chordProgressionId: "mixolydian-pocket",
      blendArtistId: "dire-straits",
      guitaristMode: false,
      globalPulse: false,
    });

    const topWith = withGuitaristMode.recommendations[0].track.guitarFocus;
    const topWithout = withoutGuitaristMode.recommendations[0].track.guitarFocus;

    expect(topWith).toBeGreaterThanOrEqual(topWithout);
  });

  it("pushes recommendations toward more globally fused tracks when global pulse is enabled", () => {
    const controls = getDefaultRecommendationControls();

    const withGlobalPulse = getMusicIntelligenceBundle({
      ...controls,
      seedTrackId: "porto-chrome",
      familiarity: 20,
      globalPulse: true,
      guitaristMode: false,
    });

    const withoutGlobalPulse = getMusicIntelligenceBundle({
      ...controls,
      seedTrackId: "porto-chrome",
      familiarity: 20,
      globalPulse: false,
      guitaristMode: false,
    });

    const averageFusion = (scores: typeof withGlobalPulse.recommendations) =>
      scores.reduce((sum, result) => sum + result.track.globalFusion, 0) / scores.length;

    expect(averageFusion(withGlobalPulse.recommendations)).toBeGreaterThan(
      averageFusion(withoutGlobalPulse.recommendations),
    );
  });
});
