import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StepSequencer from "./StepSequencer";

const pattern = [1, 0, 0, 1, 0, 0, 0, 0];
const velocityPattern = [112, 0, 0, 88, 0, 0, 0, 0];

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
});
