import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SequencerLayer } from "./rhythmEngineModel";
import StepSequencer from "./StepSequencer";

const pattern = [1, 0, 0, 1, 0, 0, 0, 0];
const velocityPattern = [112, 0, 0, 88, 0, 0, 0, 0];
const layers: SequencerLayer[] = [
  {
    id: "kick",
    label: "Kick",
    instrumentId: "kick",
    instrument: "Kick",
    role: "bass",
    band: "low",
    pattern: [1, 0, 0, 1, 0, 0, 1, 0],
    velocity: [120, 0, 0, 104, 0, 0, 96, 0],
  },
  {
    id: "clap",
    label: "Clap",
    instrumentId: "snare",
    instrument: "Clap",
    role: "lead",
    band: "mid",
    pattern: [0, 0, 1, 0, 0, 0, 1, 0],
    velocity: [0, 0, 94, 0, 0, 0, 102, 0],
  },
  {
    id: "hat",
    label: "Hat",
    instrumentId: "hh-closed",
    instrument: "Hi-Hat",
    role: "timeline",
    band: "high",
    pattern: [1, 1, 1, 1, 1, 1, 1, 1],
    velocity: [74, 58, 68, 56, 76, 60, 70, 58],
  },
];

describe("StepSequencer", () => {
  it("renders the full sequencer chrome by default", () => {
    render(<StepSequencer pattern={pattern} velocityPattern={velocityPattern} />);

    expect(screen.getByText("Cycle Grouping")).toBeInTheDocument();
    expect(screen.getByText("Lane")).toBeInTheDocument();
    expect(screen.getByText("Click or drag to paint")).toBeInTheDocument();
  });

  it("renders a compact single-lane layout when requested", () => {
    render(<StepSequencer pattern={pattern} velocityPattern={velocityPattern} layout="compact" />);

    expect(screen.queryByText("Cycle Grouping")).not.toBeInTheDocument();
    expect(screen.queryByText("Lane")).not.toBeInTheDocument();
    expect(screen.queryByText("Click or drag to paint")).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Pattern step/i })).toHaveLength(pattern.length);
  });

  it("renders compact multitrack rows without the numbered header grid", () => {
    render(
      <StepSequencer
        pattern={pattern}
        velocityPattern={velocityPattern}
        layers={layers}
        layout="compact"
      />,
    );

    expect(screen.queryByText("Lane")).not.toBeInTheDocument();
    expect(screen.getByText("Kick")).toBeInTheDocument();
    expect(screen.getByText("Clap")).toBeInTheDocument();
    expect(screen.getByText("Hat")).toBeInTheDocument();
  });
});
