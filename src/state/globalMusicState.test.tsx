import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  getChordSpellings,
  getScaleNotes,
} from "@/components/ModeVisualizer/scaleData";
import { getSecondaryDominants } from "@/components/ModeVisualizer/chordProgressionUtils";

import {
  GlobalMusicProvider,
  useGlobalMusic,
  useGlobalMusicActions,
  useGlobalTransport,
} from "./globalMusicState";

describe("globalMusicState", () => {
  it("limits selector rerenders to the subscribed slice", () => {
    const renders = {
      key: 0,
      tempo: 0,
    };

    const KeyProbe = () => {
      const key = useGlobalMusic((state) => state.key);
      renders.key += 1;
      return <div>{key}</div>;
    };

    const TempoProbe = () => {
      const tempo = useGlobalMusic((state) => state.tempo);
      renders.tempo += 1;
      return <div>{tempo}</div>;
    };

    const Controls = () => {
      const actions = useGlobalMusicActions();
      return (
        <button type="button" onClick={() => actions.setKey("D")}>
          Change key
        </button>
      );
    };

    render(
      <GlobalMusicProvider>
        <KeyProbe />
        <TempoProbe />
        <Controls />
      </GlobalMusicProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Change key" }));

    expect(renders.key).toBe(2);
    expect(renders.tempo).toBe(1);
  });

  it("hands transport ownership to the most recent tool", () => {
    const TransportHarness = () => {
      const rhythm = useGlobalTransport("rhythm");
      const harmony = useGlobalTransport("harmony");

      return (
        <div>
          <button type="button" onClick={() => rhythm.setPlaying(true)}>
            Start rhythm
          </button>
          <button type="button" onClick={() => harmony.setPlaying(true)}>
            Start harmony
          </button>
          <div data-testid="rhythm-state">{rhythm.playing ? "playing" : "stopped"}</div>
          <div data-testid="harmony-state">{harmony.playing ? "playing" : "stopped"}</div>
        </div>
      );
    };

    render(
      <GlobalMusicProvider>
        <TransportHarness />
      </GlobalMusicProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Start rhythm" }));
    expect(screen.getByTestId("rhythm-state")).toHaveTextContent("playing");
    expect(screen.getByTestId("harmony-state")).toHaveTextContent("stopped");

    fireEvent.click(screen.getByRole("button", { name: "Start harmony" }));
    expect(screen.getByTestId("rhythm-state")).toHaveTextContent("stopped");
    expect(screen.getByTestId("harmony-state")).toHaveTextContent("playing");
  });

  it("preserves rich chord progression entries in shared state", () => {
    const scaleNotes = getScaleNotes("C", "Ionian");
    const chordSpellings = getChordSpellings(scaleNotes, "Ionian");
    const [secondaryDominant] = getSecondaryDominants("C", "Ionian", chordSpellings);

    const ProgressionProbe = () => {
      const progression = useGlobalMusic((state) => state.chordProgression);
      return <div data-testid="progression-source">{progression[0]?.sourceLabel ?? "empty"}</div>;
    };

    const Controls = () => {
      const actions = useGlobalMusicActions();
      return (
        <button type="button" onClick={() => actions.setChordProgression([secondaryDominant])}>
          Set progression
        </button>
      );
    };

    render(
      <GlobalMusicProvider>
        <ProgressionProbe />
        <Controls />
      </GlobalMusicProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Set progression" }));
    expect(screen.getByTestId("progression-source")).toHaveTextContent("resolves to IIm7");
  });

  it("adopts a suggested tempo only until the user touches tempo", () => {
    const Probe = () => {
      const tempo = useGlobalMusic((state) => state.tempo);
      const actions = useGlobalMusicActions();
      return (
        <div>
          <div data-testid="tempo">{tempo}</div>
          <button type="button" onClick={() => actions.suggestTempo(95)}>
            suggest 95
          </button>
          <button type="button" onClick={() => actions.setTempo(150)}>
            set 150
          </button>
          <button type="button" onClick={() => actions.suggestTempo(80)}>
            suggest 80
          </button>
        </div>
      );
    };

    render(
      <GlobalMusicProvider>
        <Probe />
      </GlobalMusicProvider>,
    );

    // Untouched: suggestion adopted.
    fireEvent.click(screen.getByRole("button", { name: "suggest 95" }));
    expect(screen.getByTestId("tempo").textContent).toBe("95");

    // Explicit set marks tempo as touched.
    fireEvent.click(screen.getByRole("button", { name: "set 150" }));
    expect(screen.getByTestId("tempo").textContent).toBe("150");

    // Touched: later suggestions are ignored.
    fireEvent.click(screen.getByRole("button", { name: "suggest 80" }));
    expect(screen.getByTestId("tempo").textContent).toBe("150");
  });

  it("normalizes mode aliases at the store boundary", () => {
    const Probe = () => {
      const mode = useGlobalMusic((state) => state.mode);
      const actions = useGlobalMusicActions();
      return (
        <div>
          <div data-testid="mode">{mode}</div>
          <button type="button" onClick={() => actions.setMode("major")}>
            set major
          </button>
        </div>
      );
    };

    render(
      <GlobalMusicProvider>
        <Probe />
      </GlobalMusicProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "set major" }));
    expect(screen.getByTestId("mode").textContent).toBe("Ionian");
  });

});
