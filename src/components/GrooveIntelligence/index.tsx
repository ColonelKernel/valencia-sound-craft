import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { NormalizedGroove, RawGroove, ViewMode, TrajectoryPoint } from "./types";
import type { Cluster } from "./clustering";
import { normalizeGrooves, grooveDistance, MAX_RENDERED_GROOVES, sampleGrooveSet } from "./utils";
import { playGrooveSequence, generatePattern, startPlayback, stopPlayback } from "./audioEngine";
import { clusterGrooves, buildSimilarityCache } from "./clustering";
import GrooveField from "./GrooveField";
import GrooveDNA from "./GrooveDNA";
import GrooveSculptor from "./GrooveSculptor";

const CLUSTER_K = 12;

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "field", label: "Field" },
  { key: "topology", label: "Topology" },
  { key: "landscape", label: "Landscape" },
];

interface GrooveScene {
  grooves: NormalizedGroove[];
  grooveMap: Map<string, NormalizedGroove>;
  clusters: Cluster[];
  totalCount: number;
  genreCount: number;
}

export default function GrooveIntelligenceLab() {
  const [scene, setScene] = useState<GrooveScene | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("field");
  const [sculptorActive, setSculptorActive] = useState(false);
  const [sculptorValues, setSculptorValues] = useState({ energy: 0.5, swing: 0.5, syncopation: 0.5, dynamics: 0.5 });
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const playbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    fetch("/data/egmd.json")
      .then(response => response.json())
      .then((data: RawGroove[]) => {
        if (cancelled) return;

        const workingSet = sampleGrooveSet(data, MAX_RENDERED_GROOVES);
        const normalized = normalizeGrooves(workingSet, data);
        const similarity = buildSimilarityCache(normalized, 5);
        const grooves = normalized.map(groove => ({
          ...groove,
          similar: similarity.neighbors.get(groove.id) ?? [],
        }));
        const grooveMap = new Map(grooves.map(groove => [groove.id, groove]));
        const clusterCount = Math.min(CLUSTER_K, Math.max(6, Math.floor(grooves.length / 24)));
        const clusters = clusterGrooves(grooves, clusterCount);

        setScene({
          grooves,
          grooveMap,
          clusters,
          totalCount: data.length,
          genreCount: new Set(grooves.map(groove => groove.genre)).size,
        });
        setSelectedId(current => current ?? grooves[0]?.id ?? null);
      })
      .catch(error => {
        console.error("Failed to load groove data:", error);
        if (!cancelled) setLoadError("Unable to initialize the groove field.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sculptorActive) return;
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    stopPlayback();
    setSelectedId(null);
  }, [sculptorActive]);

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
      stopPlayback();
    };
  }, []);

  const selected = useMemo(() => {
    if (!scene || !selectedId) return null;
    return scene.grooveMap.get(selectedId) ?? null;
  }, [scene, selectedId]);

  const handleSelect = useCallback((groove: NormalizedGroove) => {
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }

    stopPlayback();
    playGrooveSequence(groove.norm_density, groove.norm_swing, groove.norm_velocity);
    setSelectedId(groove.id);
    setTrajectory(previous => (
      previous[previous.length - 1]?.grooveId === groove.id
        ? previous
        : [...previous, { grooveId: groove.id, timestamp: Date.now() }]
    ));

    const pattern = generatePattern(groove);
    playbackTimerRef.current = window.setTimeout(() => {
      startPlayback(groove, pattern);
      playbackTimerRef.current = null;
    }, 80);
  }, []);

  const trajectoryStats = useMemo(() => {
    if (!scene || trajectory.length < 2) return null;

    let totalDistance = 0;
    for (let index = 1; index < trajectory.length; index++) {
      const from = scene.grooveMap.get(trajectory[index - 1].grooveId);
      const to = scene.grooveMap.get(trajectory[index].grooveId);
      if (!from || !to) continue;
      totalDistance += grooveDistance(from, to);
    }

    const previous = scene.grooveMap.get(trajectory[trajectory.length - 2].grooveId);
    const current = scene.grooveMap.get(trajectory[trajectory.length - 1].grooveId);

    return {
      totalDistance,
      lastHop: previous && current ? grooveDistance(previous, current) : 0,
    };
  }, [scene, trajectory]);

  const clearTrajectory = useCallback(() => {
    setTrajectory(selected ? [{ grooveId: selected.id, timestamp: Date.now() }] : []);
  }, [selected]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[hsl(240,10%,4%)] text-foreground overflow-hidden">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <a href="/" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-mono">← Back</a>
          <div>
            <h1 className="text-sm font-semibold tracking-wide font-mono">🧠 Groove Intelligence Lab</h1>
            <p className="text-[10px] text-muted-foreground/50 font-mono tracking-wider">FIELD INTERFACE · PERCEPTUAL RHYTHM SPACE</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`px-3 py-1 text-[10px] font-mono uppercase tracking-wider rounded transition-colors ${
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
            <span className="text-[9px] text-muted-foreground/40 font-mono">Initializing working set…</span>
          )}
          {!isLoading && scene && (
            <span className="text-[10px] text-muted-foreground/30 font-mono">
              {scene.grooves.length}/{scene.totalCount} sampled nodes · {scene.clusters.length} clusters · {scene.genreCount} genres
            </span>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 relative">
          {scene && (
            <GrooveField
              grooves={scene.grooves}
              selectedId={selectedId}
              onSelect={handleSelect}
              viewMode={viewMode}
              trajectory={trajectory}
              clusters={scene.clusters}
              sculptorActive={sculptorActive}
              sculptorValues={sculptorValues}
            />
          )}

          {trajectoryStats && (
            <div className="absolute top-3 left-3 bg-black/70 border border-white/10 rounded-lg px-3 py-2 pointer-events-auto z-10">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[9px] text-muted-foreground/60 font-mono uppercase tracking-wider">Trajectory</p>
                  <p className="text-xs font-mono text-foreground">
                    {trajectory.length} stops · Σd = {trajectoryStats.totalDistance.toFixed(2)}
                  </p>
                  <p className="text-[9px] font-mono text-muted-foreground/40 mt-0.5">
                    Last hop: {trajectoryStats.lastHop.toFixed(3)}
                  </p>
                </div>
                <button
                  onClick={clearTrajectory}
                  className="text-[9px] font-mono text-muted-foreground/50 hover:text-foreground border border-white/10 rounded px-2 py-1 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-12 left-4 right-16 text-center pointer-events-none">
            <p className="text-[10px] text-white/15 font-mono tracking-wider">
              Sampled, precomputed groove field. Scroll to zoom · Shift+drag to pan.
            </p>
          </div>

          {!scene && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-sm font-mono text-muted-foreground">
                {loadError ?? "No groove scene available."}
              </div>
            </div>
          )}
        </div>

        <aside className="w-72 border-l border-white/5 p-4 overflow-y-auto shrink-0 flex flex-col gap-5">
          <GrooveSculptor
            values={sculptorValues}
            onChange={setSculptorValues}
            active={sculptorActive}
            onToggle={() => setSculptorActive(current => !current)}
          />
          <div className="h-px bg-white/5" />
          {scene && (
            <GrooveDNA
              groove={selected}
              grooveMap={scene.grooveMap}
              onSelectGroove={handleSelect}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
