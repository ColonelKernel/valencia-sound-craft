import { useState } from "react";
import type { NormalizedGroove, TrajectoryPoint, ViewMode } from "./types";
import type { GrooveScene } from "./index";
import GrooveField from "./GrooveField";
import GrooveDNA from "./GrooveDNA";
import GrooveSculptor from "./GrooveSculptor";

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "field", label: "Field" },
  { key: "topology", label: "Topology" },
  { key: "landscape", label: "Landscape" },
];

interface Props {
  scene: GrooveScene | null;
  selected: NormalizedGroove | null;
  selectedId: string | null;
  trajectory: TrajectoryPoint[];
  trajectoryStats: { totalDistance: number; lastHop: number } | null;
  isLoading: boolean;
  loadError: string | null;
  onSelect: (groove: NormalizedGroove) => void;
  onClearSelection: () => void;
  onClearTrajectory: () => void;
}

/**
 * The full-viewport desktop lab: canvas field with camera/LOD, view modes,
 * sculptor, trajectory HUD, and the DNA panel. Desktop-only concerns
 * (view mode, sculptor state) live here so they reset naturally when the
 * breakpoint flips to mobile.
 */
export default function DesktopLab({
  scene,
  selected,
  selectedId,
  trajectory,
  trajectoryStats,
  isLoading,
  loadError,
  onSelect,
  onClearSelection,
  onClearTrajectory,
}: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("field");
  const [sculptorActive, setSculptorActive] = useState(false);
  const [sculptorValues, setSculptorValues] = useState({
    energy: 0.5,
    swing: 0.5,
    syncopation: 0.5,
    dynamics: 0.5,
  });

  const toggleSculptor = () => {
    setSculptorActive(current => {
      const next = !current;
      // Entering sculpt mode stops playback and clears the selection so the
      // morphed field reads as its own state (old-lab behavior).
      if (next) onClearSelection();
      return next;
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-[hsl(240,10%,4%)] text-foreground">
      <header className="z-10 flex shrink-0 items-center justify-between border-b border-white/5 px-6 py-3">
        <div>
          <h1 className="font-mono text-sm font-semibold tracking-wide">Groove Intelligence Lab</h1>
          <p className="font-mono text-[10px] tracking-wider text-muted-foreground/50">
            FIELD INTERFACE · PERCEPTUAL RHYTHM SPACE
          </p>
        </div>
        <div className="flex items-center gap-1" role="group" aria-label="Field view mode">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              aria-pressed={viewMode === mode.key}
              className={`rounded px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                viewMode === mode.key
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground/50 hover:text-muted-foreground"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {isLoading && (
            <span className="font-mono text-[9px] text-muted-foreground/40">Initializing working set…</span>
          )}
          {!isLoading && scene && (
            <span className="font-mono text-[10px] text-muted-foreground/30">
              {scene.grooves.length}/{scene.totalCount} sampled nodes · {scene.clusters.length} clusters · {scene.genreCount} genres
            </span>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="relative flex-1">
          {scene && (
            <GrooveField
              grooves={scene.grooves}
              selectedId={selectedId}
              onSelect={onSelect}
              viewMode={viewMode}
              trajectory={trajectory}
              clusters={scene.clusters}
              sculptorActive={sculptorActive}
              sculptorValues={sculptorValues}
            />
          )}

          {trajectoryStats && (
            <div className="pointer-events-auto absolute left-3 top-3 z-10 rounded-lg border border-white/10 bg-black/70 px-3 py-2">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">Trajectory</p>
                  <p className="font-mono text-xs text-foreground">
                    {trajectory.length} stops · Σd = {trajectoryStats.totalDistance.toFixed(2)}
                  </p>
                  <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/40">
                    Last hop: {trajectoryStats.lastHop.toFixed(3)}
                  </p>
                </div>
                <button
                  onClick={onClearTrajectory}
                  className="rounded border border-white/10 px-2 py-1 font-mono text-[9px] text-muted-foreground/50 transition-colors hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute bottom-12 left-4 right-16 text-center">
            <p className="font-mono text-[10px] tracking-wider text-white/15">
              Sampled, precomputed groove field. Scroll to zoom · Shift+drag to pan.
            </p>
          </div>

          {!scene && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-muted-foreground">
                {loadError ?? "No groove scene available."}
              </div>
            </div>
          )}
        </div>

        <aside className="flex w-80 shrink-0 flex-col gap-5 overflow-y-auto border-l border-white/5 p-4">
          <GrooveSculptor
            values={sculptorValues}
            onChange={setSculptorValues}
            active={sculptorActive}
            onToggle={toggleSculptor}
          />
          <div className="h-px bg-white/5" />

          {scene && (
            <div className="space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
                Groove list
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto pr-1" role="listbox" aria-label="Grooves (keyboard-accessible selection)">
                {scene.keyboardGrooves.map(groove => (
                  <button
                    key={groove.id}
                    role="option"
                    aria-selected={selectedId === groove.id}
                    onClick={() => onSelect(groove)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono text-[11px] transition-colors ${
                      selectedId === groove.id
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground"
                    }`}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: groove.color }}
                      aria-hidden="true"
                    />
                    <span className="truncate capitalize">{groove.genre}</span>
                    <span className="ml-auto shrink-0 text-muted-foreground/40">{groove.bpm}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="h-px bg-white/5" />

          {scene && (
            <GrooveDNA
              groove={selected}
              grooveMap={scene.grooveMap}
              onSelectGroove={onSelect}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
